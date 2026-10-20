package com.gitfix.agent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class PatchApplier {

    private static final Logger log = LoggerFactory.getLogger(PatchApplier.class);

    /**
     * Applies all file modifications in PatchDto to the target workspace.
     * Enforces strict path normalization to block any path traversal attempts.
     */
    public void applyPatch(File workspaceDir, PatchDto patch) {
        if (workspaceDir == null || !workspaceDir.exists()) {
            throw new IllegalArgumentException("Workspace directory does not exist: " + workspaceDir);
        }

        Path workspacePath = workspaceDir.toPath().toAbsolutePath().normalize();
        log.info("Applying {} file changes to workspace: {}", patch.getFiles().size(), workspacePath);

        for (PatchDto.FileChange change : patch.getFiles()) {
            String rawPath = change.getFilePath();

            // Block path traversal
            Path targetPath = workspacePath.resolve(rawPath).normalize();
            if (!targetPath.startsWith(workspacePath)) {
                log.error("SECURITY ALERT: Path traversal attempt blocked for path: {}", rawPath);
                throw new SecurityException("Path traversal attempt detected: " + rawPath);
            }

            try {
                if ("DELETE".equalsIgnoreCase(change.getAction())) {
                    log.info("Deleting file: {}", targetPath);
                    Files.deleteIfExists(targetPath);
                } else {
                    log.info("Writing file: {}", targetPath);
                    if (targetPath.getParent() != null) {
                        Files.createDirectories(targetPath.getParent());
                    }
                    Files.writeString(targetPath, change.getContent(), StandardCharsets.UTF_8);
                }
            } catch (IOException e) {
                log.error("Failed to apply change to file {}: {}", targetPath, e.getMessage(), e);
                throw new IllegalStateException("Failed to write patched file: " + targetPath + " - " + e.getMessage(), e);
            }
        }

        log.info("Successfully applied all changes in patch");
    }
}
