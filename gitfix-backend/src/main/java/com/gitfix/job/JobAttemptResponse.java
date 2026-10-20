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
public class JobAttemptResponse {
    private Long id;
    private String jobId;
    private int attemptNo;
    private String patch;
    private boolean testPassed;
    private String testLogs;
    private Instant createdAt;

    public static JobAttemptResponse fromEntity(JobAttempt attempt) {
        return JobAttemptResponse.builder()
                .id(attempt.getId())
                .jobId(attempt.getJobId())
                .attemptNo(attempt.getAttemptNo())
                .patch(attempt.getPatch())
                .testPassed(attempt.isTestPassed())
                .testLogs(attempt.getTestLogs())
                .createdAt(attempt.getCreatedAt())
                .build();
    }
}
