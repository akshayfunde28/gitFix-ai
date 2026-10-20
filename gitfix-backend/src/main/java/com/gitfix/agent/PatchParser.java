package com.gitfix.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class PatchParser {

    private static final Logger log = LoggerFactory.getLogger(PatchParser.class);
    private static final Pattern MARKDOWN_JSON_BLOCK = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper;

    public PatchDto parse(String rawLlmResponse) {
        if (rawLlmResponse == null || rawLlmResponse.isBlank()) {
            throw new IllegalArgumentException("LLM returned empty or null response");
        }

        String jsonCandidate = extractJsonString(rawLlmResponse);

        try {
            PatchDto patch = objectMapper.readValue(jsonCandidate, PatchDto.class);

            if (patch.getFiles() == null || patch.getFiles().isEmpty()) {
                throw new IllegalStateException("LLM response did not contain any file changes");
            }

            for (PatchDto.FileChange change : patch.getFiles()) {
                if (change.getFilePath() == null || change.getFilePath().isBlank()) {
                    throw new IllegalStateException("FileChange entry missing filePath");
                }
                if (change.getContent() == null && !"DELETE".equalsIgnoreCase(change.getAction())) {
                    throw new IllegalStateException("FileChange entry missing content for file: " + change.getFilePath());
                }
            }

            log.info("Successfully parsed patch with {} file changes. Explanation: {}",
                    patch.getFiles().size(), patch.getExplanation());
            return patch;

        } catch (Exception e) {
            log.error("Failed to parse LLM JSON patch. Candidate JSON:\n{}\nError: {}", jsonCandidate, e.getMessage());
            throw new IllegalStateException("Failed to parse patch from LLM response: " + e.getMessage(), e);
        }
    }

    private String extractJsonString(String response) {
        String trimmed = response.trim();

        // 1. Check for markdown code blocks
        Matcher matcher = MARKDOWN_JSON_BLOCK.matcher(trimmed);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        // 2. Check if whole string starts with { and ends with }
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1).trim();
        }

        return trimmed;
    }
}
