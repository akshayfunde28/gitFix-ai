package com.gitfix.job;

import com.gitfix.common.ResourceNotFoundException;
import com.gitfix.connection.GitHubConnection;
import com.gitfix.connection.GitHubConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class JobService {

    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    private final JobRepository jobRepository;
    private final JobLogRepository jobLogRepository;
    private final JobAttemptRepository jobAttemptRepository;
    private final GitHubConnectionRepository connectionRepository;
    private final ApplicationEventPublisher eventPublisher;

    public JobService(
            JobRepository jobRepository,
            JobLogRepository jobLogRepository,
            JobAttemptRepository jobAttemptRepository,
            GitHubConnectionRepository connectionRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.jobRepository = jobRepository;
        this.jobLogRepository = jobLogRepository;
        this.jobAttemptRepository = jobAttemptRepository;
        this.connectionRepository = connectionRepository;
        this.eventPublisher = eventPublisher;
    }

    public List<JobResponse> getAllJobs() {
        return jobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(JobResponse::fromEntity)
                .toList();
    }

    public JobResponse getJobById(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + id));
        return JobResponse.fromEntity(job);
    }

    public List<JobLogResponse> getJobLogs(String jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job not found with id: " + jobId);
        }
        return jobLogRepository.findByJobIdOrderByTimestampAsc(jobId).stream()
                .map(JobLogResponse::fromEntity)
                .toList();
    }

    public List<JobAttemptResponse> getJobAttempts(String jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job not found with id: " + jobId);
        }
        return jobAttemptRepository.findByJobIdOrderByAttemptNoAsc(jobId).stream()
                .map(JobAttemptResponse::fromEntity)
                .toList();
    }

    @Transactional
    public JobResponse triggerManualJob(ManualJobRequest request) {
        GitHubConnection connection = connectionRepository.findById(request.getConnectionId())
                .orElseThrow(() -> new ResourceNotFoundException("GitHub connection not found with id: " + request.getConnectionId()));

        String jobId = UUID.randomUUID().toString();
        Job job = Job.builder()
                .id(jobId)
                .connectionId(connection.getId())
                .repoFullName(connection.getRepoFullName())
                .issueNumber(request.getIssueNumber())
                .issueTitle("Issue #" + request.getIssueNumber())
                .status(JobStatus.QUEUED)
                .attempts(0)
                .build();

        Job saved = jobRepository.saveAndFlush(job);
        logStep(saved.getId(), "QUEUED", "Job manually queued for " + connection.getRepoFullName() + " #" + request.getIssueNumber());

        // Publish event to trigger async pipeline execution
        eventPublisher.publishEvent(new JobQueuedEvent(saved.getId()));

        return JobResponse.fromEntity(saved);
    }

    @Transactional
    public JobResponse retryJob(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + id));

        if (job.getStatus() != JobStatus.FAILED) {
            throw new IllegalStateException("Only jobs in FAILED status can be retried. Current status: " + job.getStatus());
        }

        job.setStatus(JobStatus.QUEUED);
        job.setErrorMessage(null);
        Job saved = jobRepository.save(job);

        logStep(saved.getId(), "QUEUED", "Job retry requested. Reset status to QUEUED.");
        eventPublisher.publishEvent(new JobQueuedEvent(saved.getId()));

        return JobResponse.fromEntity(saved);
    }

    @Transactional
    public void logStep(String jobId, String step, String message) {
        log.info("[Job: {}] [{}] {}", jobId, step, message);
        JobLog jobLog = JobLog.builder()
                .jobId(jobId)
                .step(step)
                .message(message)
                .build();
        jobLogRepository.save(jobLog);
    }

    @Transactional
    public void recordAttempt(String jobId, int attemptNo, String patch, boolean testPassed, String testLogs) {
        JobAttempt attempt = JobAttempt.builder()
                .jobId(jobId)
                .attemptNo(attemptNo)
                .patch(patch)
                .testPassed(testPassed)
                .testLogs(testLogs)
                .build();
        jobAttemptRepository.save(attempt);
    }

    @Transactional
    public void updateJobStatus(String jobId, JobStatus status) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(status);
            jobRepository.save(job);
        });
    }

    @Transactional
    public void markJobFailed(String jobId, String errorMessage) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(errorMessage);
            jobRepository.save(job);
            logStep(jobId, "FAILED", "Job failed: " + errorMessage);
        });
    }

    @Transactional
    public void markJobPrCreated(String jobId, String prUrl) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(JobStatus.PR_CREATED);
            job.setPrUrl(prUrl);
            jobRepository.save(job);
            logStep(jobId, "PR_CREATED", "Successfully created PR: " + prUrl);
        });
    }
}
