package com.gitfix.indexing;

import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Set;

@Component
public class FileFilter {

    private static final long MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB limit per file

    private static final Set<String> IGNORED_DIRECTORIES = Set.of(
            ".git",
            ".mvn",
            ".idea",
            ".vscode",
            ".settings",
            "target",
            "build",
            "out",
            "dist",
            "node_modules",
            "vendor",
            "coverage",
            ".gradle"
    );

    private static final Set<String> IGNORED_EXTENSIONS = Set.of(
            ".class", ".jar", ".war", ".ear", ".nar",
            ".zip", ".tar", ".gz", ".7z", ".rar",
            ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".exe", ".dll", ".so", ".dylib", ".bin",
            ".ttf", ".woff", ".woff2", ".eot",
            ".mp3", ".mp4", ".mov", ".avi",
            ".pyc", ".pyo"
    );

    public boolean shouldIndex(File file, File rootDir) {
        if (file.isDirectory()) {
            return false;
        }

        // Check file size
        if (file.length() > MAX_FILE_SIZE_BYTES || file.length() == 0) {
            return false;
        }

        // Check if any parent directory is in IGNORED_DIRECTORIES
        String relativePath = rootDir.toPath().relativize(file.toPath()).toString().replace('\\', '/');
        for (String segment : relativePath.split("/")) {
            if (IGNORED_DIRECTORIES.contains(segment)) {
                return false;
            }
        }

        // Check file extension
        String fileName = file.getName().toLowerCase();
        for (String ext : IGNORED_EXTENSIONS) {
            if (fileName.endsWith(ext)) {
                return false;
            }
        }

        return true;
    }
}
