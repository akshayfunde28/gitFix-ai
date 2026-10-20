package com.gitfix.indexing;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class RepoIndexer {

    private static final Logger log = LoggerFactory.getLogger(RepoIndexer.class);
    private static final int BATCH_SIZE = 50;

    private final VectorStore vectorStore;
    private final FileFilter fileFilter;
    private final Chunker chunker;

    /**
     * Walks the cloned repository, chunks relevant files, and indexes embeddings into VectorStore.
     *
     * @param jobId unique job identifier for vector filtering
     * @param repoFullName full repository name (e.g. owner/repo)
     * @param repoDir root directory of the cloned repo
     * @return total number of indexed chunks
     */
    public int indexRepo(String jobId, String repoFullName, File repoDir) {
        log.info("Starting indexing for job {} on repo {}", jobId, repoFullName);

        List<Document> documents = new ArrayList<>();
        List<File> filesToIndex = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(repoDir.toPath())) {
            paths.filter(Files::isRegularFile)
                 .map(Path::toFile)
                 .filter(f -> fileFilter.shouldIndex(f, repoDir))
                 .forEach(filesToIndex::add);
        } catch (IOException e) {
            log.error("Failed to walk repository directory {}: {}", repoDir.getAbsolutePath(), e.getMessage(), e);
            throw new IllegalStateException("Failed to index repository: " + e.getMessage(), e);
        }

        log.info("Discovered {} candidate source files to index", filesToIndex.size());

        for (File file : filesToIndex) {
            String relativePath = repoDir.toPath().relativize(file.toPath()).toString().replace('\\', '/');
            try {
                String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
                List<Chunker.CodeChunk> chunks = chunker.chunkLines(content, relativePath);

                for (Chunker.CodeChunk chunk : chunks) {
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("jobId", jobId);
                    metadata.put("repo", repoFullName);
                    metadata.put("filePath", relativePath);
                    metadata.put("chunkIndex", chunk.getChunkIndex());
                    metadata.put("startLine", chunk.getStartLine());
                    metadata.put("endLine", chunk.getEndLine());

                    Document doc = new Document(chunk.getContent(), metadata);
                    documents.add(doc);
                }
            } catch (Exception e) {
                log.warn("Skipping file {} due to read/chunking error: {}", relativePath, e.getMessage());
            }
        }

        // Store into VectorStore in batches
        for (int i = 0; i < documents.size(); i += BATCH_SIZE) {
            int toIndex = Math.min(i + BATCH_SIZE, documents.size());
            List<Document> batch = documents.subList(i, toIndex);
            vectorStore.add(batch);
            log.info("Indexed vector batch {}/{} ({} chunks) for job {}", toIndex, documents.size(), batch.size(), jobId);
        }

        log.info("Completed indexing {} chunks across {} files for job {}", documents.size(), filesToIndex.size(), jobId);
        return documents.size();
    }
}
