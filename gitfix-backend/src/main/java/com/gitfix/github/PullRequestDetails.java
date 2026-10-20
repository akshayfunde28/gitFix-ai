package com.gitfix.github;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestDetails {
    private String repoFullName;
    private int issueNumber;
    private String issueTitle;
    private String branchName;
    private String baseBranch;
    private String explanation;
    private List<String> filesChanged;
    private List<String> retrievedFiles;
    private String testLogsSummary;
}
