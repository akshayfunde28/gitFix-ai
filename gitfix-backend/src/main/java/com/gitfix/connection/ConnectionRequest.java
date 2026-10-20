package com.gitfix.connection;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectionRequest {

    @NotBlank(message = "githubToken is required")
    private String githubToken;

    @NotBlank(message = "repoFullName is required (e.g. owner/repo)")
    private String repoFullName;
}
