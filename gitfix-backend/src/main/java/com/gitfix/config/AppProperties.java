package com.gitfix.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gitfix")
public class AppProperties {

    /**
     * Base64-encoded 256-bit AES encryption key for securing GitHub tokens.
     */
    private String encryptionKey;

    /**
     * Local workspace directory for cloning and sandbox builds.
     */
    private String workspaceDir = "./workspace";

    /**
     * Maximum retry attempts for failing test runs.
     */
    private int maxRetries = 3;

    /**
     * Number of top semantic chunks to retrieve for LLM prompt context.
     */
    private int retrievalTopK = 8;

    /**
     * Sandbox execution timeout in seconds.
     */
    private int sandboxTimeoutSeconds = 300;

    /**
     * Public base URL for external webhooks (e.g. ngrok tunnel URL).
     */
    private String publicBaseUrl = "http://localhost:8080";

    /**
     * Label on GitHub issues that triggers the automated pipeline.
     */
    private String triggerLabel = "gitfix";
}
