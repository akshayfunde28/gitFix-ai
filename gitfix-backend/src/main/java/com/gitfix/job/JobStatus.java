package com.gitfix.job;

public enum JobStatus {
    QUEUED,
    CLONING,
    INDEXING,
    RETRIEVING,
    GENERATING,
    TESTING,
    RETRYING,
    CREATING_PR,
    PR_CREATED,
    FAILED
}
