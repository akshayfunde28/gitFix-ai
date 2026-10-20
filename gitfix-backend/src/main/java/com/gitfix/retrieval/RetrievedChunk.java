package com.gitfix.retrieval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetrievedChunk {
    private String filePath;
    private String content;
    private Double score;
    private Integer chunkIndex;
    private Integer startLine;
    private Integer endLine;
}
