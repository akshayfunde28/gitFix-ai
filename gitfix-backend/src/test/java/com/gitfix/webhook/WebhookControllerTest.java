package com.gitfix.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gitfix.connection.GitHubConnection;
import com.gitfix.connection.GitHubConnectionRepository;
import com.gitfix.job.Job;
import com.gitfix.job.JobRepository;
import com.gitfix.job.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GitHubConnectionRepository connectionRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private JobService jobService;

    private static final String CONNECTION_ID = "conn-123";
    private static final String WEBHOOK_SECRET = "test-webhook-secret-456";

    @BeforeEach
    void setUp() {
        GitHubConnection mockConnection = GitHubConnection.builder()
                .id(CONNECTION_ID)
                .repoFullName("owner/test-repo")
                .encryptedToken("encrypted-token")
                .webhookSecret(WEBHOOK_SECRET)
                .build();

        when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(mockConnection));
    }

    @Test
    void shouldRejectWhenSignatureHeaderMissing() throws Exception {
        mockMvc.perform(post("/api/webhook/github/" + CONNECTION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "issues")
                        .content("{\"action\":\"opened\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldHandlePingEvent() throws Exception {
        byte[] payload = "{}".getBytes(StandardCharsets.UTF_8);
        String signature = computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/webhook/github/" + CONNECTION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "ping")
                        .header("X-Hub-Signature-256", signature)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("pong"));
    }

    @Test
    void shouldIgnoreIssueWithoutGitfixLabel() throws Exception {
        String payloadStr = """
                {
                    "action": "opened",
                    "issue": {
                        "number": 1,
                        "title": "Bug",
                        "labels": [{"name": "bug"}]
                    },
                    "repository": {
                        "full_name": "owner/test-repo"
                    }
                }
                """;
        byte[] payload = payloadStr.getBytes(StandardCharsets.UTF_8);
        String signature = computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/webhook/github/" + CONNECTION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "issues")
                        .header("X-Hub-Signature-256", signature)
                        .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("IGNORED"));

        verify(jobRepository, never()).save(any(Job.class));
    }

    @Test
    void shouldQueueJobWhenIssueHasGitfixLabel() throws Exception {
        String payloadStr = """
                {
                    "action": "opened",
                    "issue": {
                        "number": 42,
                        "title": "Fix NullPointerException",
                        "body": "Occurs when calling get()",
                        "labels": [{"name": "gitfix"}]
                    },
                    "repository": {
                        "full_name": "owner/test-repo"
                    }
                }
                """;
        byte[] payload = payloadStr.getBytes(StandardCharsets.UTF_8);
        String signature = computeSignature(payload, WEBHOOK_SECRET);

        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/webhook/github/" + CONNECTION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "issues")
                        .header("X-Hub-Signature-256", signature)
                        .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andExpect(jsonPath("$.issueNumber").value(42));

        verify(jobRepository, times(1)).save(any(Job.class));
        verify(jobService, times(1)).logStep(anyString(), eq("QUEUED"), anyString());
    }

    private String computeSignature(byte[] payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hmac = mac.doFinal(payload);
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : hmac) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
