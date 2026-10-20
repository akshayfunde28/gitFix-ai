package com.gitfix.agent;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PatchDto {

    private String explanation;
    @Builder.Default
    private List<FileChange> files = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FileChange {
        /**
         * Relative path from repo root (e.g. src/main/java/com/example/MyService.java)
         */
        private String filePath;

        /**
         * The full new content of the file.
         */
        private String content;

        /**
         * Action: "MODIFY", "CREATE", or "DELETE"
         */
        @Builder.Default
        private String action = "MODIFY";
    }
}
