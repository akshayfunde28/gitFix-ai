package com.gitfix.indexing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class Chunker {

    private static final int DEFAULT_CHUNK_LINES = 60;
    private static final int DEFAULT_OVERLAP_LINES = 15;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeChunk {
        private int chunkIndex;
        private String content;
        private int startLine;
        private int endLine;
    }

    public List<CodeChunk> chunkLines(String text, String filePath) {
        List<CodeChunk> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }

        String[] lines = text.split("\r?\n", -1);
        int totalLines = lines.length;

        // If file is short, keep as single chunk
        if (totalLines <= DEFAULT_CHUNK_LINES) {
            String content = buildChunkContent(lines, 0, totalLines, filePath);
            chunks.add(new CodeChunk(0, content, 1, totalLines));
            return chunks;
        }

        int chunkIndex = 0;
        int start = 0;

        while (start < totalLines) {
            int end = Math.min(start + DEFAULT_CHUNK_LINES, totalLines);
            String content = buildChunkContent(lines, start, end, filePath);
            chunks.add(new CodeChunk(chunkIndex++, content, start + 1, end));

            if (end >= totalLines) {
                break;
            }
            start += (DEFAULT_CHUNK_LINES - DEFAULT_OVERLAP_LINES);
        }

        return chunks;
    }

    private String buildChunkContent(String[] lines, int start, int end, String filePath) {
        StringBuilder sb = new StringBuilder();
        sb.append("// File: ").append(filePath)
          .append(" (Lines ").append(start + 1).append("-").append(end).append(")\n");

        for (int i = start; i < end; i++) {
            sb.append(lines[i]).append("\n");
        }
        return sb.toString();
    }
}
