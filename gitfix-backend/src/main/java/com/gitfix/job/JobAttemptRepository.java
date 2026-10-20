package com.gitfix.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobAttemptRepository extends JpaRepository<JobAttempt, Long> {
    List<JobAttempt> findByJobIdOrderByAttemptNoAsc(String jobId);
}
