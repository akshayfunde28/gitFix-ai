package com.gitfix.agent;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LlmService {

    private static final Logger log = LoggerFactory.getLogger(LlmService.class);
    private static final int MAX_CALL_RETRIES = 3;

    private final ChatModel chatModel;

    public String generatePatch(String systemPrompt, String userPrompt) {
        log.info("Sending prompt to LLM (system length: {}, user length: {})",
                systemPrompt.length(), userPrompt.length());

        Prompt prompt = new Prompt(List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userPrompt)
        ));

        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_CALL_RETRIES; attempt++) {
            try {
                ChatResponse response = chatModel.call(prompt);
                if (response != null && response.getResult() != null && response.getResult().getOutput() != null) {
                    String content = response.getResult().getOutput().getContent();
                    log.info("Received LLM response (length: {} chars)", content.length());
                    return content;
                }
            } catch (Exception e) {
                lastException = e;
                log.warn("LLM invocation failed (attempt {}/{}): {}", attempt, MAX_CALL_RETRIES, e.getMessage());
                try {
                    Thread.sleep(1000L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrupted while waiting to retry LLM call", ie);
                }
            }
        }

        log.error("All {} LLM call attempts failed", MAX_CALL_RETRIES, lastException);
        throw new IllegalStateException("LLM service unavailable: " + (lastException != null ? lastException.getMessage() : "No response"), lastException);
    }
}
