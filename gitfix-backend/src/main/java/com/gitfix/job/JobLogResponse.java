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
public class JobLogResponse {
    private Long id;
    private String jobId;
    private String step;
    private String message;
    private Instant timestamp;

    public static JobLogResponse fromEntity(JobLog log) {
        return JobLogResponse.builder()
                .id(log.getId())
                .jobId(log.getJobId())
                .step(log.getStep())
                .message(log.getMessage())
                .timestamp(log.getTimestamp())
                .build();
    }
}
