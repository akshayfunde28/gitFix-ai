package com.gitfix.job;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {
    private String id;
    private String connectionId;
    private String repoFullName;
    private Integer issueNumber;
    private String issueTitle;
    private String issueBody;
    private JobStatus status;
    private int attempts;
    private String prUrl;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;

    public static JobResponse fromEntity(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .connectionId(job.getConnectionId())
                .repoFullName(job.getRepoFullName())
                .issueNumber(job.getIssueNumber())
                .issueTitle(job.getIssueTitle())
                .issueBody(job.getIssueBody())
                .status(job.getStatus())
                .attempts(job.getAttempts())
                .prUrl(job.getPrUrl())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
