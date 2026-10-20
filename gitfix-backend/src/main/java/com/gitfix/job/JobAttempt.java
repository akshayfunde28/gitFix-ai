package com.gitfix.job;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "job_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", length = 36, nullable = false)
    private String jobId;

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo;

    @Column(columnDefinition = "TEXT")
    private String patch;

    @Builder.Default
    @Column(name = "test_passed", nullable = false)
    private boolean testPassed = false;

    @Column(name = "test_logs", columnDefinition = "TEXT")
    private String testLogs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
