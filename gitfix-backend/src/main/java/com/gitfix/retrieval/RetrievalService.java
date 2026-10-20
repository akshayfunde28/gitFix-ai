package com.gitfix.retrieval;

import com.gitfix.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RetrievalService {

    private static final Logger log = LoggerFactory.getLogger(RetrievalService.class);

    private final VectorStore vectorStore;
    private final AppProperties appProperties;

    public List<RetrievedChunk> retrieveRelevantChunks(String jobId, String query, Integer customTopK) {
        int topK = (customTopK != null && customTopK > 0) ? customTopK : appProperties.getRetrievalTopK();
        log.info("Searching top-{} relevant chunks for job {} with query length {}", topK, jobId, query.length());

        FilterExpressionBuilder b = new FilterExpressionBuilder();
        SearchRequest searchRequest = SearchRequest.query(query)
                .withTopK(topK)
                .withSimilarityThreshold(0.3)
                .withFilterExpression(b.eq("jobId", jobId).build());

        List<Document> documents;
        try {
            documents = vectorStore.similaritySearch(searchRequest);
        } catch (Exception e) {
            log.warn("Vector search with filter expression failed, falling back to simple search: {}", e.getMessage());
            // Fallback: search without filter and filter in memory by jobId
            documents = vectorStore.similaritySearch(SearchRequest.query(query).withTopK(topK * 2)).stream()
                    .filter(d -> jobId.equals(d.getMetadata().get("jobId")))
                    .limit(topK)
                    .toList();
        }

        List<RetrievedChunk> chunks = new ArrayList<>();
        for (Document doc : documents) {
            String filePath = String.valueOf(doc.getMetadata().getOrDefault("filePath", "unknown"));
            Integer chunkIndex = doc.getMetadata().get("chunkIndex") instanceof Number n ? n.intValue() : 0;
            Integer startLine = doc.getMetadata().get("startLine") instanceof Number n ? n.intValue() : null;
            Integer endLine = doc.getMetadata().get("endLine") instanceof Number n ? n.intValue() : null;
            Object rawScore = doc.getMetadata().get("distance");
            if (rawScore == null) {
                rawScore = doc.getMetadata().get("score");
            }
            Double score = (rawScore instanceof Number n) ? n.doubleValue() : null;

            chunks.add(RetrievedChunk.builder()
                    .filePath(filePath)
                    .content(doc.getContent())
                    .score(score)
                    .chunkIndex(chunkIndex)
                    .startLine(startLine)
                    .endLine(endLine)
                    .build());

            log.info("Retrieved chunk: {} (lines {}-{}) score: {}", filePath, startLine, endLine, score);
        }

        return chunks;
    }
}
