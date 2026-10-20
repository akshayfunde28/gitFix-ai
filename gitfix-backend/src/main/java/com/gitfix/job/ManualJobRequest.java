package com.gitfix.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualJobRequest {

    @NotBlank(message = "connectionId is required")
    private String connectionId;

    @NotNull(message = "issueNumber is required")
    private Integer issueNumber;
}
