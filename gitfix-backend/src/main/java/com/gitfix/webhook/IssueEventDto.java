package com.gitfix.webhook;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class IssueEventDto {

    private String action;
    private IssueDto issue;
    private RepositoryDto repository;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IssueDto {
        private Integer number;
        private String title;
        private String body;
        private List<LabelDto> labels;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LabelDto {
        private String name;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RepositoryDto {
        @JsonProperty("full_name")
        private String fullName;
    }

    public boolean hasLabel(String labelName) {
        if (issue == null || issue.getLabels() == null || labelName == null) {
            return false;
        }
        return issue.getLabels().stream()
                .anyMatch(l -> labelName.equalsIgnoreCase(l.getName()));
    }
}
