package com.gitfix.agent;

import com.gitfix.retrieval.RetrievedChunk;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class PromptBuilder {

    public String buildSystemPrompt() {
        return """
                You are GitFix AI, an autonomous software engineering assistant.
                Your task is to fix a reported GitHub issue in a repository and ensure all tests pass.

                STRICT RULES:
                1. Make MINIMAL, surgical changes directly addressing the issue.
                2. Do not introduce unrelated formatting, renames, or refactoring.
                3. Ensure your fix compiles and satisfies tests. If existing tests are wrong or missing, update or add tests appropriately.
                4. Always provide the FULL NEW CONTENT for each changed file, not diffs.
                5. Output MUST be valid JSON adhering strictly to the following schema with NO extra commentary outside the JSON block:

                ```json
                {
                  "explanation": "Clear explanation of why this bug occurred and how your changes fix it",
                  "files": [
                    {
                      "filePath": "relative/path/to/File.java",
                      "content": "// Full new content of the file",
                      "action": "MODIFY"
                    }
                  ]
                }
                ```
                """;
    }

    public String buildUserPrompt(
            String issueTitle,
            String issueBody,
            List<RetrievedChunk> chunks,
            File workspaceDir,
            String previousFailureLogs,
            int attemptNo
    ) {
        StringBuilder sb = new StringBuilder();

        sb.append("### GITHUB ISSUE\n");
        sb.append("**Title**: ").append(issueTitle).append("\n");
        sb.append("**Description**:\n").append(issueBody != null ? issueBody : "(No description provided)").append("\n\n");

        sb.append("### REPOSITORY STRUCTURE\n");
        sb.append(buildRepoTree(workspaceDir)).append("\n\n");

        sb.append("### RETRIEVED RELEVANT CODE CONTEXT\n");
        if (chunks == null || chunks.isEmpty()) {
            sb.append("(No specific code chunks retrieved)\n\n");
        } else {
            for (int i = 0; i < chunks.size(); i++) {
                RetrievedChunk chunk = chunks.get(i);
                sb.append("--- Snippet ").append(i + 1).append(": ").append(chunk.getFilePath())
                  .append(" (Score: ").append(String.format("%.3f", chunk.getScore() != null ? chunk.getScore() : 0.0)).append(") ---\n")
                  .append(chunk.getContent()).append("\n\n");
            }
        }

        if (attemptNo > 1 && previousFailureLogs != null && !previousFailureLogs.isBlank()) {
            sb.append("### PREVIOUS ATTEMPT FAILURE LOGS (ATTEMPT ").append(attemptNo - 1).append(")\n");
            sb.append("The previous patch failed with the following test/build errors. Please examine these logs carefully and fix the underlying issue:\n");
            sb.append("```\n");
            sb.append(truncateLogs(previousFailureLogs, 3000));
            sb.append("\n```\n\n");
        }

        sb.append("Generate the complete JSON patch now.");
        return sb.toString();
    }

    private String buildRepoTree(File workspaceDir) {
        if (workspaceDir == null || !workspaceDir.exists()) {
            return "(Workspace directory not found)";
        }
        try (Stream<Path> paths = Files.walk(workspaceDir.toPath(), 5)) {
            return paths.filter(p -> !p.toString().contains(".git")
                                  && !p.toString().contains("target")
                                  && !p.toString().contains(".mvn"))
                        .map(p -> workspaceDir.toPath().relativize(p).toString().replace('\\', '/'))
                        .filter(s -> !s.isBlank())
                        .limit(80)
                        .collect(Collectors.joining("\n"));
        } catch (IOException e) {
            return "(Unable to generate repository tree: " + e.getMessage() + ")";
        }
    }

    private String truncateLogs(String logs, int maxLength) {
        if (logs.length() <= maxLength) {
            return logs;
        }
        return logs.substring(logs.length() - maxLength); // Keep the tail where errors typically reside
    }
}
