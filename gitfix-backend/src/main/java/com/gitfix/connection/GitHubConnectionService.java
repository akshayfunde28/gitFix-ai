package com.gitfix.connection;

import com.gitfix.common.CryptoUtils;
import com.gitfix.common.ResourceNotFoundException;
import com.gitfix.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URL;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GitHubConnectionService {

    private static final Logger log = LoggerFactory.getLogger(GitHubConnectionService.class);

    private final GitHubConnectionRepository connectionRepository;
    private final CryptoUtils cryptoUtils;
    private final AppProperties appProperties;

    @Transactional
    public ConnectionResponse createConnection(ConnectionRequest request) {
        log.info("Validating and registering GitHub connection for repository: {}", request.getRepoFullName());

        // 1. Validate token with GitHub API
        validateGitHubCredentials(request.getGithubToken(), request.getRepoFullName());

        // 2. Encrypt token
        String encryptedToken = cryptoUtils.encrypt(request.getGithubToken());

        // 3. Generate random webhook secret (32 hex characters)
        String webhookSecret = CryptoUtils.generateRandomHex(16);

        // 4. Save connection
        String connectionId = UUID.randomUUID().toString();
        GitHubConnection connection = GitHubConnection.builder()
                .id(connectionId)
                .repoFullName(request.getRepoFullName())
                .encryptedToken(encryptedToken)
                .webhookSecret(webhookSecret)
                .build();

        GitHubConnection saved = connectionRepository.save(connection);
        log.info("Successfully registered connection id: {} for repo: {}", saved.getId(), saved.getRepoFullName());

        return ConnectionResponse.fromEntity(saved);
    }

    public List<ConnectionResponse> getAllConnections() {
        return connectionRepository.findAll().stream()
                .map(ConnectionResponse::fromEntity)
                .toList();
    }

    public ConnectionResponse getConnectionById(String id) {
        GitHubConnection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub connection not found with id: " + id));
        return ConnectionResponse.fromEntity(connection);
    }

    @Transactional
    public void deleteConnection(String id) {
        if (!connectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("GitHub connection not found with id: " + id);
        }
        connectionRepository.deleteById(id);
        log.info("Deleted connection id: {}", id);
    }

    public String getDecryptedToken(String connectionId) {
        GitHubConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub connection not found with id: " + connectionId));
        return cryptoUtils.decrypt(connection.getEncryptedToken());
    }

    public GitHubConnection getConnectionEntity(String id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub connection not found with id: " + id));
    }

    /**
     * Registers a GitHub webhook on the target repository using the kohsuke github-api.
     */
    public Map<String, Object> registerGitHubWebhook(String connectionId) {
        GitHubConnection connection = getConnectionEntity(connectionId);
        String token = cryptoUtils.decrypt(connection.getEncryptedToken());

        try {
            GitHub gitHub = new GitHubBuilder().withOAuthToken(token).build();
            GHRepository repository = gitHub.getRepository(connection.getRepoFullName());

            String webhookUrl = appProperties.getPublicBaseUrl() + "/api/webhook/github/" + connectionId;
            log.info("Registering webhook at URL: {} for repo: {}", webhookUrl, connection.getRepoFullName());

            // Check if webhook already exists
            for (GHHook hook : repository.getHooks()) {
                if (webhookUrl.equalsIgnoreCase(hook.getConfig().get("url"))) {
                    log.info("Webhook already registered with id: {}", hook.getId());
                    return Map.of(
                            "message", "Webhook is already registered",
                            "hookId", hook.getId(),
                            "webhookUrl", webhookUrl
                    );
                }
            }

            Map<String, String> config = new HashMap<>();
            config.put("url", webhookUrl);
            config.put("content_type", "json");
            config.put("secret", connection.getWebhookSecret());

            GHHook createdHook = repository.createHook(
                    "web",
                    config,
                    List.of(GHEvent.ISSUES),
                    true
            );

            log.info("Registered webhook id: {} on repo: {}", createdHook.getId(), connection.getRepoFullName());
            return Map.of(
                    "message", "Webhook successfully registered on GitHub",
                    "hookId", createdHook.getId(),
                    "webhookUrl", webhookUrl
            );
        } catch (IOException e) {
            log.error("Failed to register webhook on GitHub: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to register webhook on GitHub: " + e.getMessage(), e);
        }
    }

    private void validateGitHubCredentials(String token, String repoFullName) {
        try {
            GitHub gitHub = new GitHubBuilder().withOAuthToken(token).build();
            GHMyself myself = gitHub.getMyself();
            if (myself == null || myself.getLogin() == null) {
                throw new IllegalArgumentException("Invalid GitHub token: unable to retrieve authenticated user.");
            }
            GHRepository repository = gitHub.getRepository(repoFullName);
            if (repository == null) {
                throw new IllegalArgumentException("Repository not found or token has no access: " + repoFullName);
            }
            log.info("Verified GitHub user: {} has access to repo: {}", myself.getLogin(), repoFullName);
        } catch (IOException e) {
            log.error("GitHub validation failed: {}", e.getMessage());
            throw new IllegalArgumentException("GitHub token validation failed: " + e.getMessage(), e);
        }
    }
}
