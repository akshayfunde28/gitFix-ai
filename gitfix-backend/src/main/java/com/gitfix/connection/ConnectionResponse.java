package com.gitfix.connection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectionResponse {
    private String id;
    private String repoFullName;
    private String webhookSecret;
    private Instant createdAt;
    private Instant updatedAt;

    public static ConnectionResponse fromEntity(GitHubConnection connection) {
        return ConnectionResponse.builder()
                .id(connection.getId())
                .repoFullName(connection.getRepoFullName())
                .webhookSecret(connection.getWebhookSecret())
                .createdAt(connection.getCreatedAt())
                .updatedAt(connection.getUpdatedAt())
                .build();
    }
}
