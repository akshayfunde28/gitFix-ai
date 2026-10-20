package com.gitfix.sandbox;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.*;
import com.gitfix.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.Closeable;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SandboxService {

    private static final Logger log = LoggerFactory.getLogger(SandboxService.class);

    private static final String DEFAULT_MAVEN_IMAGE = "maven:3.9-eclipse-temurin-21";
    private static final String DEFAULT_GRADLE_IMAGE = "gradle:8.5-jdk21";
    private static final String DEFAULT_NODE_IMAGE = "node:20-alpine";

    private final DockerClient dockerClient;
    private final AppProperties appProperties;

    public SandboxResult runTests(File workspaceDir) {
        long startTime = System.currentTimeMillis();
        BuildStrategy strategy = detectBuildStrategy(workspaceDir);
        log.info("Detected build strategy: {} using image: {} for workspace: {}",
                strategy.name(), strategy.image(), workspaceDir.getAbsolutePath());

        // Pull image if not present
        ensureImageAvailable(strategy.image());

        String containerId = null;
        StringBuilder logBuffer = new StringBuilder();

        try {
            // Mount workspace directory into /app inside container
            String hostPath = workspaceDir.getAbsolutePath();
            Volume containerVolume = new Volume("/app");
            Bind bind = new Bind(hostPath, containerVolume, AccessMode.rw);

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(bind)
                    .withMemory(2L * 1024 * 1024 * 1024) // 2GB memory limit
                    .withCpuQuota(200000L); // Limit to 2 CPU cores

            CreateContainerResponse container = dockerClient.createContainerCmd(strategy.image())
                    .withWorkingDir("/app")
                    .withCmd(strategy.command())
                    .withHostConfig(hostConfig)
                    .exec();

            containerId = container.getId();
            log.info("Created sandbox container: {}", containerId);

            // Start container
            dockerClient.startContainerCmd(containerId).exec();

            // Stream logs
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withFollowStream(true)
                    .exec(new ResultCallback.Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            String msg = new String(frame.getPayload(), StandardCharsets.UTF_8);
                            logBuffer.append(msg);
                        }
                    });

            // Wait for completion with timeout
            int timeout = appProperties.getSandboxTimeoutSeconds();
            WaitContainerResultCallback waitCallback = dockerClient.waitContainerCmd(containerId)
                    .exec(new WaitContainerResultCallback());

            boolean finished = waitCallback.awaitCompletion(timeout, TimeUnit.SECONDS);
            int exitCode = -1;

            if (finished) {
                exitCode = waitCallback.awaitStatusCode();
                log.info("Container {} finished with exit code: {}", containerId, exitCode);
            } else {
                log.warn("Sandbox container {} timed out after {} seconds", containerId, timeout);
                logBuffer.append("\n[ERROR] Sandbox execution timed out after ").append(timeout).append(" seconds.\n");
                try {
                    dockerClient.stopContainerCmd(containerId).withTimeout(5).exec();
                } catch (Exception ignored) {
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            return SandboxResult.builder()
                    .exitCode(exitCode)
                    .passed(exitCode == 0)
                    .logs(logBuffer.toString())
                    .durationMs(duration)
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Sandbox execution interrupted", e);
        } catch (Exception e) {
            log.error("Error executing sandbox container: {}", e.getMessage(), e);
            long duration = System.currentTimeMillis() - startTime;
            return SandboxResult.builder()
                    .exitCode(-1)
                    .passed(false)
                    .logs(logBuffer.toString() + "\nContainer execution failed: " + e.getMessage())
                    .durationMs(duration)
                    .build();
        } finally {
            // ALWAYS remove container in finally block
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                    log.info("Successfully removed sandbox container: {}", containerId);
                } catch (Exception e) {
                    log.warn("Failed to remove container {}: {}", containerId, e.getMessage());
                }
            }
        }
    }

    private void ensureImageAvailable(String imageName) {
        try {
            dockerClient.inspectImageCmd(imageName).exec();
            log.info("Docker image {} already available locally", imageName);
        } catch (Exception e) {
            log.info("Pulling docker image {} ...", imageName);
            try {
                dockerClient.pullImageCmd(imageName)
                        .exec(new ResultCallback.Adapter<PullResponseItem>())
                        .awaitCompletion(5, TimeUnit.MINUTES);
                log.info("Successfully pulled image {}", imageName);
            } catch (Exception pe) {
                log.error("Failed to pull image {}: {}", imageName, pe.getMessage(), pe);
                throw new IllegalStateException("Could not pull sandbox image " + imageName + ": " + pe.getMessage(), pe);
            }
        }
    }

    private BuildStrategy detectBuildStrategy(File workspaceDir) {
        if (new File(workspaceDir, "pom.xml").exists()) {
            return new BuildStrategy("MAVEN", DEFAULT_MAVEN_IMAGE, new String[]{"mvn", "-B", "clean", "test"});
        }
        if (new File(workspaceDir, "build.gradle").exists() || new File(workspaceDir, "build.gradle.kts").exists()) {
            return new BuildStrategy("GRADLE", DEFAULT_GRADLE_IMAGE, new String[]{"gradle", "test"});
        }
        if (new File(workspaceDir, "package.json").exists()) {
            return new BuildStrategy("NPM", DEFAULT_NODE_IMAGE, new String[]{"npm", "test"});
        }
        // Default to Maven
        return new BuildStrategy("MAVEN", DEFAULT_MAVEN_IMAGE, new String[]{"mvn", "-B", "clean", "test"});
    }

    private record BuildStrategy(String name, String image, String[] command) {
    }
}
