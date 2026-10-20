# GitFix AI — Autonomous GitHub Issue-to-PR Agent

GitFix AI is a production-style, autonomous software engineering agent built from scratch in Spring Boot 3 with Java 21. It monitors GitHub issues, understands bug reports, indexes the target codebase with semantic vector search, uses local LLMs to generate surgical code patches, validates them in isolated Docker sandbox containers, and automatically submits a tested Pull Request.

---

## 🏗️ Architecture & Pipeline

```
GitHub Issue Event
  │
  ▼
Webhook (HMAC-SHA256 signature verification & label filter: "gitfix")
  │
  ▼
Create Job (QUEUED) ➔ Asynchronous Execution
  │
  ▼
[CLONING] Shallow clone repo into workspace/<jobId> using decrypted PAT
  │
  ▼
[INDEXING] Chunk source files & generate embeddings into PostgreSQL pgvector
  │
  ▼
[RETRIEVING] Semantic similarity search on issue description ➔ Top-K relevant snippets
  │
  ▼
[GENERATING] PromptBuilder (issue + retrieved code + repo tree) ➔ Ollama LLM ➔ JSON patch
  │
  ▼
Apply Patch (Strict path traversal verification)
  │
  ▼
[TESTING] Isolated Docker sandbox container executes `mvn clean test` (resource-capped)
  ├── ❌ FAIL ➔ Feed test failure logs back into LLM, regenerate patch (up to 3 retries)
  └── ✅ PASS ➔ Proceed to PR
  │
  ▼
[CREATING_PR] Create branch gitfix/issue-<n>, commit, push, and open PR via GitHub API
  │
  ▼
[PR_CREATED] Human reviews & merges (Never auto-merged)
  │
  ▼
Cleanup: Docker container & workspace directory guaranteed deleted
```

---

## 🚀 Tech Stack

- **Java 21 LTS** & **Spring Boot 3.3.4**
- **PostgreSQL 16 + pgvector** (single database for jobs, attempts, logs, and vector store)
- **Spring AI** (`spring-ai-ollama`, `spring-ai-pgvector-store`)
- **Ollama** (local `qwen2.5-coder:7b` chat model and `nomic-embed-text` 768-dim embeddings)
- **JGit** (in-process shallow cloning, branch checkout, commit, push)
- **Kohsuke GitHub API** (issue inspection, automated PR creation, label tagging, comments)
- **docker-java** (isolated sandbox execution with CPU/memory limits and guaranteed container cleanup)
- **Flyway** (automated database migrations)
- **AES-256 GCM** (zero plaintext tokens in database)

---

## ⚙️ Environment Configuration

Create a `.env` file in `gitfix-backend/` (or copy from `.env.example`):

```bash
# Database (Docker container port 5433 to avoid conflicts with local Postgres 18)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=gitfix
DB_USER=postgres
DB_PASSWORD=root
DB_URL=jdbc:postgresql://localhost:5433/gitfix

# Ollama / LLM / Embeddings
OLLAMA_BASE_URL=http://localhost:11434
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5-coder:7b
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=768

# Security & Encryption (256-bit AES key in Base64)
ENCRYPTION_KEY=on7pdSJ1mYPADmmNKG4752ZPxq/lI0rEqciKmludMF4=

# Application & Workspace
WORKSPACE_DIR=./workspace
MAX_RETRIES=3
RETRIEVAL_TOP_K=8
SANDBOX_TIMEOUT_SECONDS=300

# Public URL (for external GitHub Webhooks via ngrok)
PUBLIC_BASE_URL=http://localhost:8080
GITHUB_TRIGGER_LABEL=gitfix
```

---

## 🛠️ Quick Start

### 1. Start Docker Services
```bash
docker compose up -d
```
This spins up:
- `gitfix-postgres` on `localhost:5433` (PostgreSQL 16 with pgvector)
- `gitfix-ollama` on `localhost:11434` (Ollama LLM engine)

### 2. Pull Ollama Models (automated in setup)
```bash
docker exec -it gitfix-ollama ollama pull nomic-embed-text
docker exec -it gitfix-ollama ollama pull qwen2.5-coder:7b
```

### 3. Build & Run Backend
```bash
mvn clean install
mvn spring-boot:run
```

The server starts at `http://localhost:8080`.

---

## 🔌 REST API Endpoints

Refer to [`gitfix-api.http`](gitfix-api.http) for runnable requests.

### GitHub Connections
- `POST /api/connections`: Register repository and PAT (validates token with GitHub, encrypts via AES-GCM, generates webhook secret).
- `GET /api/connections`: List all connections (never reveals tokens).
- `GET /api/connections/{id}`: Get connection details.
- `DELETE /api/connections/{id}`: Delete a connection.
- `POST /api/connections/{id}/webhook`: Automatically register GitHub webhook on target repo using `PUBLIC_BASE_URL`.

### Jobs & Pipeline
- `POST /api/jobs/manual`: Manually trigger job for an issue: `{"connectionId": "...", "issueNumber": 1}`.
- `GET /api/jobs`: List all jobs with statuses and metadata.
- `GET /api/jobs/{id}`: Get job status and details.
- `GET /api/jobs/{id}/logs`: Get step-by-step pipeline execution logs.
- `GET /api/jobs/{id}/attempts`: Get patch and test results for each retry attempt.
- `POST /api/jobs/{id}/retry`: Retry a failed job.

### Webhook
- `POST /api/webhook/github/{connectionId}`: GitHub webhook listener (verifies HMAC-SHA256, filters label `gitfix`, returns HTTP 202 Accepted immediately).
