package com.gitfix.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    List<Job> findByRepoFullNameOrderByCreatedAtDesc(String repoFullName);

    List<Job> findAllByOrderByCreatedAtDesc();

    Optional<Job> findFirstByRepoFullNameAndIssueNumberAndStatusNotIn(
            String repoFullName,
            Integer issueNumber,
            Collection<JobStatus> statuses
    );
}
