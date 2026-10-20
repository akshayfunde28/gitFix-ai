package com.gitfix.git;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class GitService {

    private static final Logger log = LoggerFactory.getLogger(GitService.class);

    /**
     * Clones a repository with depth 1 into the target directory using the provided PAT token.
     */
    public void cloneRepo(String repoFullName, String token, File targetDir) {
        String repoUri = "https://github.com/" + repoFullName + ".git";
        log.info("Cloning repository {} into {}", repoFullName, targetDir.getAbsolutePath());

        try {
            if (!targetDir.exists()) {
                targetDir.mkdirs();
            }

            Git.cloneRepository()
                    .setURI(repoUri)
                    .setDirectory(targetDir)
                    .setDepth(1)
                    .setCredentialsProvider(createCredentialsProvider(token))
                    .call()
                    .close();

            log.info("Successfully cloned {}", repoFullName);
        } catch (GitAPIException e) {
            log.error("Failed to clone {}: {}", repoFullName, e.getMessage(), e);
            throw new IllegalStateException("Git clone failed: " + e.getMessage(), e);
        }
    }

    /**
     * Creates and checks out a new branch.
     */
    public void checkoutBranch(File repoDir, String branchName) {
        log.info("Creating and checking out branch {} in {}", branchName, repoDir.getAbsolutePath());
        try (Git git = Git.open(repoDir)) {
            git.checkout()
                    .setCreateBranch(true)
                    .setName(branchName)
                    .call();
            log.info("Successfully checked out branch {}", branchName);
        } catch (Exception e) {
            log.error("Failed to create branch {}: {}", branchName, e.getMessage(), e);
            throw new IllegalStateException("Git branch creation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Stages all changes, creates a commit, and pushes to remote.
     */
    public void commitAndPush(File repoDir, String token, String commitMessage, String branchName) {
        log.info("Committing and pushing branch {} from {}", branchName, repoDir.getAbsolutePath());
        try (Git git = Git.open(repoDir)) {
            // Stage all files (tracked and untracked)
            git.add().addFilepattern(".").call();

            // Commit
            git.commit()
                    .setMessage(commitMessage)
                    .setAuthor("GitFix AI", "bot@gitfix.ai")
                    .call();

            // Push branch to remote
            git.push()
                    .setRemote("origin")
                    .add(branchName)
                    .setCredentialsProvider(createCredentialsProvider(token))
                    .call();

            log.info("Successfully pushed branch {} to remote", branchName);
        } catch (Exception e) {
            log.error("Failed to commit and push branch {}: {}", branchName, e.getMessage(), e);
            throw new IllegalStateException("Git commit/push failed: " + e.getMessage(), e);
        }
    }

    private UsernamePasswordCredentialsProvider createCredentialsProvider(String token) {
        // GitHub recommends passing the PAT as the password with username "oauth2".
        // This is strictly required for fine-grained PATs (github_pat_...) and also works for classic PATs.
        return new UsernamePasswordCredentialsProvider("oauth2", token);
    }
}
