package com.gitfix.job;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "connection_id", length = 36)
    private String connectionId;

    @Column(name = "repo_full_name", nullable = false)
    private String repoFullName;

    @Column(name = "issue_number", nullable = false)
    private Integer issueNumber;

    @Column(name = "issue_title", columnDefinition = "TEXT")
    private String issueTitle;

    @Column(name = "issue_body", columnDefinition = "TEXT")
    private String issueBody;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private JobStatus status;

    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "pr_url", length = 500)
    private String prUrl;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
