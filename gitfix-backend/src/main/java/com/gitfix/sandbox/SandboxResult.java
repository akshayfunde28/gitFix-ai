package com.gitfix.sandbox;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SandboxResult {
    private int exitCode;
    private boolean passed;
    private String logs;
    private long durationMs;
}
