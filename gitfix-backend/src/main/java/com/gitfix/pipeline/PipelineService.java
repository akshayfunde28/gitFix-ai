package com.gitfix.pipeline;

import com.gitfix.agent.*;
import com.gitfix.config.AppProperties;
import com.gitfix.connection.GitHubConnectionService;
import com.gitfix.git.GitService;
import com.gitfix.github.PullRequestDetails;
import com.gitfix.github.PullRequestService;
import com.gitfix.indexing.RepoIndexer;
import com.gitfix.job.Job;
import com.gitfix.job.JobQueuedEvent;
import com.gitfix.job.JobRepository;
import com.gitfix.job.JobService;
import com.gitfix.job.JobStatus;
import com.gitfix.retrieval.RetrievalService;
import com.gitfix.retrieval.RetrievedChunk;
import com.gitfix.sandbox.SandboxResult;
import com.gitfix.sandbox.SandboxService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.util.FileSystemUtils;

import java.io.File;
import java.util.List;

@Service
public class PipelineService {

    private static final Logger log = LoggerFactory.getLogger(PipelineService.class);

    private final JobRepository jobRepository;
    private final JobService jobService;
    private final GitHubConnectionService connectionService;
    private final GitService gitService;
    private final RepoIndexer repoIndexer;
    private final RetrievalService retrievalService;
    private final PromptBuilder promptBuilder;
    private final LlmService llmService;
    private final PatchParser patchParser;
    private final PatchApplier patchApplier;
    private final SandboxService sandboxService;
    private final PullRequestService pullRequestService;
    private final AppProperties appProperties;

    public PipelineService(
            JobRepository jobRepository,
            JobService jobService,
            GitHubConnectionService connectionService,
            GitService gitService,
            RepoIndexer repoIndexer,
            RetrievalService retrievalService,
            PromptBuilder promptBuilder,
            LlmService llmService,
            PatchParser patchParser,
            PatchApplier patchApplier,
            SandboxService sandboxService,
            PullRequestService pullRequestService,
            AppProperties appProperties
    ) {
        this.jobRepository = jobRepository;
        this.jobService = jobService;
        this.connectionService = connectionService;
        this.gitService = gitService;
        this.repoIndexer = repoIndexer;
        this.retrievalService = retrievalService;
        this.promptBuilder = promptBuilder;
        this.llmService = llmService;
        this.patchParser = patchParser;
        this.patchApplier = patchApplier;
        this.sandboxService = sandboxService;
        this.pullRequestService = pullRequestService;
        this.appProperties = appProperties;
    }

    @Async("pipelineExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onJobQueued(JobQueuedEvent event) {
        String jobId = event.jobId();
        log.info("Pipeline processing started for job: {}", jobId);

        Job job = null;
        for (int i = 0; i < 5; i++) {
            job = jobRepository.findById(jobId).orElse(null);
            if (job != null) break;
            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
        if (job == null) {
            log.error("Job not found for queued event: {}", jobId);
            return;
        }

        File workspaceDir = new File(appProperties.getWorkspaceDir(), jobId);

        try {
            // Clean any existing workspace
            if (workspaceDir.exists()) {
                FileSystemUtils.deleteRecursively(workspaceDir);
            }
            workspaceDir.mkdirs();

            String token = connectionService.getDecryptedToken(job.getConnectionId());

            // 1. CLONING
            jobService.updateJobStatus(jobId, JobStatus.CLONING);
            jobService.logStep(jobId, "CLONING", "Cloning repository " + job.getRepoFullName());
            gitService.cloneRepo(job.getRepoFullName(), token, workspaceDir);
            jobService.logStep(jobId, "CLONING", "Repository successfully cloned into workspace");

            // 2. INDEXING
            jobService.updateJobStatus(jobId, JobStatus.INDEXING);
            jobService.logStep(jobId, "INDEXING", "Indexing repository files into vector store");
            int indexedChunks = repoIndexer.indexRepo(jobId, job.getRepoFullName(), workspaceDir);
            jobService.logStep(jobId, "INDEXING", "Indexed " + indexedChunks + " code chunks");

            // 3. RETRIEVING
            jobService.updateJobStatus(jobId, JobStatus.RETRIEVING);
            String issueQuery = job.getIssueTitle() + "\n" + (job.getIssueBody() != null ? job.getIssueBody() : "");
            jobService.logStep(jobId, "RETRIEVING", "Searching top relevant code chunks for issue");
            List<RetrievedChunk> chunks = retrievalService.retrieveRelevantChunks(jobId, issueQuery, appProperties.getRetrievalTopK());
            List<String> retrievedFilePaths = chunks.stream().map(RetrievedChunk::getFilePath).distinct().toList();
            jobService.logStep(jobId, "RETRIEVING", "Retrieved " + chunks.size() + " chunks across " + retrievedFilePaths.size() + " files: " + retrievedFilePaths);

            // 4. RETRY LOOP (GENERATING -> TESTING)
            int maxRetries = appProperties.getMaxRetries();
            boolean testsPassed = false;
            String previousFailureLogs = null;
            PatchDto finalPatch = null;

            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                jobService.updateJobStatus(jobId, JobStatus.GENERATING);
                jobService.logStep(jobId, "GENERATING", "Generating patch with LLM (Attempt " + attempt + "/" + maxRetries + ")");

                String systemPrompt = promptBuilder.buildSystemPrompt();
                String userPrompt = promptBuilder.buildUserPrompt(
                        job.getIssueTitle(),
                        job.getIssueBody(),
                        chunks,
                        workspaceDir,
                        previousFailureLogs,
                        attempt
                );

                String rawPatch = llmService.generatePatch(systemPrompt, userPrompt);
                finalPatch = patchParser.parse(rawPatch);
                patchApplier.applyPatch(workspaceDir, finalPatch);

                // Run sandbox tests
                jobService.updateJobStatus(jobId, JobStatus.TESTING);
                jobService.logStep(jobId, "TESTING", "Executing test suite inside Docker sandbox container (Attempt " + attempt + ")");

                SandboxResult result = sandboxService.runTests(workspaceDir);
                jobService.recordAttempt(jobId, attempt, rawPatch, result.isPassed(), result.getLogs());

                if (result.isPassed()) {
                    jobService.logStep(jobId, "TESTING", "Sandbox tests PASSED (Exit code 0)");
                    testsPassed = true;
                    break;
                } else {
                    jobService.logStep(jobId, "TESTING", "Sandbox tests FAILED (Exit code " + result.getExitCode() + ")");
                    previousFailureLogs = result.getLogs();
                    if (attempt < maxRetries) {
                        jobService.updateJobStatus(jobId, JobStatus.RETRYING);
                        jobService.logStep(jobId, "RETRYING", "Preparing retry attempt " + (attempt + 1) + " with test failure logs");
                    }
                }
            }

            if (!testsPassed) {
                jobService.markJobFailed(jobId, "Sandbox tests failed after " + maxRetries + " attempts.");
                return;
            }

            // 5. CREATING PR
            jobService.updateJobStatus(jobId, JobStatus.CREATING_PR);
            String branchName = "gitfix/issue-" + job.getIssueNumber();
            jobService.logStep(jobId, "CREATING_PR", "Creating branch " + branchName + " and committing changes");

            gitService.checkoutBranch(workspaceDir, branchName);
            String commitMsg = "Fix: " + job.getIssueTitle() + "\n\nCloses #" + job.getIssueNumber();
            gitService.commitAndPush(workspaceDir, token, commitMsg, branchName);

            PullRequestDetails prDetails = PullRequestDetails.builder()
                    .repoFullName(job.getRepoFullName())
                    .issueNumber(job.getIssueNumber())
                    .issueTitle(job.getIssueTitle())
                    .branchName(branchName)
                    .explanation(finalPatch != null ? finalPatch.getExplanation() : "Automated bugfix by GitFix AI")
                    .filesChanged(finalPatch != null ? finalPatch.getFiles().stream().map(PatchDto.FileChange::getFilePath).toList() : List.of())
                    .retrievedFiles(retrievedFilePaths)
                    .build();

            String prUrl = pullRequestService.createPullRequest(token, prDetails);
            jobService.markJobPrCreated(jobId, prUrl);

        } catch (Exception e) {
            log.error("Pipeline failed for job {}: {}", jobId, e.getMessage(), e);
            jobService.markJobFailed(jobId, "Pipeline execution error: " + e.getMessage());
        } finally {
            // Guaranteed cleanup of workspace
            try {
                if (workspaceDir.exists()) {
                    FileSystemUtils.deleteRecursively(workspaceDir);
                    log.info("Cleaned up workspace for job: {}", jobId);
                }
            } catch (Exception ce) {
                log.warn("Failed to clean up workspace for job {}: {}", jobId, ce.getMessage());
            }
        }
    }
}
