-- V1: Initial schema for GitFix AI
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GitHub Connections (stores encrypted PAT and per-connection webhook secret)
CREATE TABLE IF NOT EXISTS github_connections (
    id VARCHAR(36) PRIMARY KEY,
    repo_full_name VARCHAR(255) NOT NULL,
    encrypted_token TEXT NOT NULL,
    webhook_secret VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connections_repo ON github_connections(repo_full_name);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(36) PRIMARY KEY,
    connection_id VARCHAR(36) REFERENCES github_connections(id) ON DELETE SET NULL,
    repo_full_name VARCHAR(255) NOT NULL,
    issue_number INTEGER NOT NULL,
    issue_title TEXT,
    issue_body TEXT,
    status VARCHAR(50) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    pr_url VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_repo_issue ON jobs(repo_full_name, issue_number);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Job Logs
CREATE TABLE IF NOT EXISTS job_logs (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    step VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);

-- Job Attempts
CREATE TABLE IF NOT EXISTS job_attempts (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    attempt_no INTEGER NOT NULL,
    patch TEXT,
    test_passed BOOLEAN NOT NULL DEFAULT FALSE,
    test_logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_attempts_job_id ON job_attempts(job_id);

-- Vector Store for embeddings (Spring AI PgVectorStore with 768 dimensions for nomic-embed-text)
CREATE TABLE IF NOT EXISTS vector_store (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content text,
    metadata json,
    embedding vector(768)
);

CREATE INDEX IF NOT EXISTS vector_store_embedding_idx ON vector_store USING hnsw (embedding vector_cosine_ops);
