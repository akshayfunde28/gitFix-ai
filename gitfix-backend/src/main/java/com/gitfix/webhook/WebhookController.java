package com.gitfix.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gitfix.common.InvalidSignatureException;
import com.gitfix.common.ResourceNotFoundException;
import com.gitfix.config.AppProperties;
import com.gitfix.connection.GitHubConnection;
import com.gitfix.connection.GitHubConnectionRepository;
import com.gitfix.job.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/webhook/github")
@RequiredArgsConstructor
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final SignatureVerifier signatureVerifier;
    private final GitHubConnectionRepository connectionRepository;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @PostMapping("/{connectionId}")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @PathVariable String connectionId,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "ping") String eventType,
            @RequestBody byte[] rawPayload
    ) {
        log.info("Received GitHub webhook for connectionId: {}, event: {}", connectionId, eventType);

        // 1. Retrieve connection
        GitHubConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub connection not found: " + connectionId));

        // 2. Verify signature
        if (signature == null || !signatureVerifier.verifySignature(rawPayload, signature, connection.getWebhookSecret())) {
            log.warn("Invalid webhook HMAC signature for connectionId: {}", connectionId);
            throw new InvalidSignatureException("Webhook signature verification failed");
        }

        // 3. Handle ping
        if ("ping".equalsIgnoreCase(eventType)) {
            log.info("Handled GitHub ping webhook successfully for connectionId: {}", connectionId);
            return ResponseEntity.ok(Map.of("message", "pong", "connectionId", connectionId));
        }

        // 4. Handle issues event
        if (!"issues".equalsIgnoreCase(eventType)) {
            log.info("Ignoring non-issues event: {}", eventType);
            return ResponseEntity.accepted().body(Map.of("status", "IGNORED", "reason", "Unhandled event type: " + eventType));
        }

        try {
            IssueEventDto dto = objectMapper.readValue(rawPayload, IssueEventDto.class);
            String action = dto.getAction();
            String triggerLabel = appProperties.getTriggerLabel();

            log.info("Processing issue event action: '{}' for issue #{}", action, dto.getIssue() != null ? dto.getIssue().getNumber() : "null");

            // Accept 'opened' or 'labeled' actions
            if (!"opened".equalsIgnoreCase(action) && !"labeled".equalsIgnoreCase(action)) {
                return ResponseEntity.accepted().body(Map.of("status", "IGNORED", "reason", "Action not opened or labeled: " + action));
            }

            // Check if issue has the required trigger label
            if (!dto.hasLabel(triggerLabel)) {
                log.info("Issue does not have required label '{}'. Skipping.", triggerLabel);
                return ResponseEntity.accepted().body(Map.of("status", "IGNORED", "reason", "Issue missing trigger label: " + triggerLabel));
            }

            Integer issueNumber = dto.getIssue().getNumber();
            String repoFullName = dto.getRepository() != null ? dto.getRepository().getFullName() : connection.getRepoFullName();

            // Idempotency: Check if there's an ongoing job
            Optional<Job> existingActive = jobRepository.findFirstByRepoFullNameAndIssueNumberAndStatusNotIn(
                    repoFullName,
                    issueNumber,
                    List.of(JobStatus.PR_CREATED, JobStatus.FAILED)
            );
            if (existingActive.isPresent()) {
                log.warn("Active job {} already exists for {} #{}", existingActive.get().getId(), repoFullName, issueNumber);
                return ResponseEntity.accepted().body(Map.of(
                        "status", "ALREADY_IN_PROGRESS",
                        "jobId", existingActive.get().getId()
                ));
            }

            // Create Job
            String jobId = UUID.randomUUID().toString();
            Job job = Job.builder()
                    .id(jobId)
                    .connectionId(connection.getId())
                    .repoFullName(repoFullName)
                    .issueNumber(issueNumber)
                    .issueTitle(dto.getIssue().getTitle())
                    .issueBody(dto.getIssue().getBody())
                    .status(JobStatus.QUEUED)
                    .attempts(0)
                    .build();

            jobRepository.save(job);
            jobService.logStep(jobId, "QUEUED", "Job queued from webhook for " + repoFullName + " #" + issueNumber);

            // Trigger pipeline asynchronously via event
            eventPublisher.publishEvent(new JobQueuedEvent(jobId));

            log.info("Successfully queued job {} for {} #{}", jobId, repoFullName, issueNumber);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                    "status", "QUEUED",
                    "jobId", jobId,
                    "repo", repoFullName,
                    "issueNumber", issueNumber
            ));

        } catch (Exception e) {
            log.error("Failed to parse and process webhook payload: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Malformed payload: " + e.getMessage()));
        }
    }
}
