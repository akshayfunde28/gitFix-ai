# GitFix AI — API Guide & System Architecture Flow

> **Project Name:** **GitFix AI**  
> **Backend Stack:** Java 21, Spring Boot 3.3.4, PostgreSQL 16 + pgvector, Spring AI, Ollama (`qwen2.5-coder:7b` & `nomic-embed-text`), Docker Sandbox, JGit, Kohsuke GitHub API.  
> **Base URL:** `http://localhost:8080`  
> **Frontend CORS Enabled:** `http://localhost:5173` (Vite / React), `http://localhost:3000` (Create React App / Next.js)

---

## 1. Project Working Flow (How GitFix AI Works)

```mermaid
flowchart TD
    A["GitHub Issue Created or Labeled 'gitfix'"] --> B["Webhook: POST /api/webhook/github/{connectionId}"]
    M["Manual Trigger: POST /api/jobs/manual"] --> C["Create Job (Status: QUEUED)"]
    B -->|Verify HMAC-SHA256 & Label| C
    
    C --> D["[1. CLONING] Shallow clone repo into workspace/<jobId>"]
    D --> E["[2. INDEXING] Parse, chunk & embed code into PgVector (768 dims)"]
    E --> F["[3. RETRIEVING] Semantic similarity search on Issue Text -> Top-K Chunks"]
    F --> G["[4. GENERATING] PromptBuilder -> Ollama LLM (qwen2.5-coder:7b)"]
    G --> H["[5. APPLY PATCH] Parse JSON patch & write files (Path Traversal Protected)"]
    H --> I["[6. TESTING] Isolated Docker Sandbox runs 'mvn clean test'"]
    
    I -->|❌ Tests Fail & Attempt < 3| J["[RETRYING] Feed error logs back to LLM"]
    J --> G
    
    I -->|❌ Tests Fail & Attempt >= 3| K["[FAILED] Mark Job as FAILED + Save Error Logs"]
    
    I -->|✅ Tests Pass| L["[7. CREATING_PR] Create branch gitfix/issue-<n>, Commit & Push"]
    L --> N["[PR_CREATED] Open GitHub PR with diffs, summary & 'Closes #n'"]
    
    N --> Z["Cleanup: Delete Docker container & workspace directory"]
    K --> Z
```

### High-Level Flow Breakdown:
1. **Connection Setup**: You register a target GitHub repo and Personal Access Token (PAT). The PAT is validated with GitHub and encrypted with **AES-256 GCM** before saving in PostgreSQL. The PAT is **never** returned in any response.
2. **Trigger**: An issue is opened or labeled with `gitfix` on GitHub (or triggered via `POST /api/jobs/manual` for local testing).
3. **Workspace Isolation**: JGit shallow-clones the repo into an isolated `workspace/<jobId>` folder.
4. **Semantic Code Indexing**: Files are filtered (skipping `.git`, `target`, binaries) and chunked with 15-line overlap. Chunks are embedded via Ollama `nomic-embed-text` into `PgVectorStore`.
5. **Semantic Retrieval**: The issue title + body are searched against the vector store to locate the exact top-K relevant files and lines.
6. **AI Patch Generation**: Ollama (`qwen2.5-coder:7b`) receives the issue, retrieved code snippets, repo directory tree, and strict surgical edit instructions. It returns a structured JSON patch.
7. **Security-Hardened Patch Application**: The patch applier normalizes all paths to strictly prevent path traversal vulnerabilities (`../`).
8. **Docker Sandbox Execution**: An isolated container (`maven:3.9-eclipse-temurin-21`) mounts the workspace and executes `mvn clean test` with capped memory (2GB) and CPU limits.
9. **Feedback Retry Loop**: If tests fail, the error and compiler logs are fed back to the LLM to refine the patch (up to 3 attempts).
10. **PR Creation**: If tests pass, GitFix creates a `gitfix/issue-<n>` branch, commits, pushes, and opens a Pull Request with the label `gitfix-ai`, explanation, test logs, and `"Closes #n"`.
11. **Guaranteed Cleanup**: The Docker container and local job workspace directory are always deleted.

---

## 2. API Summary Table for Frontend Developers

| Method | Endpoint | Purpose | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/connections` | Connect repository with GitHub PAT | `{ githubToken, repoFullName }` | `201 Created` |
| **GET** | `/api/connections` | List all connected repositories | None | `200 OK` |
| **GET** | `/api/connections/{id}` | Get single connection details | None | `200 OK` |
| **DELETE** | `/api/connections/{id}` | Disconnect/delete a repository | None | `204 No Content` |
| **POST** | `/api/connections/{id}/webhook` | Auto-register GitHub Webhook on repo | None | `200 OK` |
| **POST** | `/api/jobs/manual` | Trigger job manually (by issue number) | `{ connectionId, issueNumber }` | `202 Accepted` |
| **GET** | `/api/jobs` | List all jobs (sorted newest first) | None | `200 OK` |
| **GET** | `/api/jobs/{id}` | Get job details and current status | None | `200 OK` |
| **GET** | `/api/jobs/{id}/logs` | Stream live step-by-step audit logs | None | `200 OK` |
| **GET** | `/api/jobs/{id}/attempts` | Get patch JSON & sandbox test logs per retry | None | `200 OK` |
| **POST** | `/api/jobs/{id}/retry` | Retry a failed job | None | `202 Accepted` |
| **GET** | `/actuator/health` | Backend and DB health check | None | `200 OK` |

---

## 3. Detailed Request and Response Payloads

### 3.1. Register a GitHub Connection

```http
POST /api/connections
Content-Type: application/json
```

**Request Body:**
```json
{
  "repoFullName": "octocat/hello-world",
  "githubToken": "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
}
```

**Response (`201 Created`):**
```json
{
  "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "repoFullName": "octocat/hello-world",
  "webhookSecret": "8f3b20e17c4a9d6e5f8a2c1b9d4e7f3a",
  "createdAt": "2026-10-16T02:15:00.123456Z",
  "updatedAt": "2026-10-16T02:15:00.123456Z"
}
```

---

### 3.2. List All Connections

```http
GET /api/connections
Accept: application/json
```

**Response (`200 OK`):**
```json
[
  {
    "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
    "repoFullName": "octocat/hello-world",
    "webhookSecret": "8f3b20e17c4a9d6e5f8a2c1b9d4e7f3a",
    "createdAt": "2026-10-16T02:15:00.123456Z",
    "updatedAt": "2026-10-16T02:15:00.123456Z"
  }
]
```

---

### 3.3. Auto-Register GitHub Webhook

```http
POST /api/connections/{id}/webhook
Accept: application/json
```

**Response (`200 OK`):**
```json
{
  "message": "Webhook successfully registered on GitHub",
  "hookId": 481920311,
  "webhookUrl": "http://localhost:8080/api/webhook/github/c56a4180-65aa-42ec-a945-5fd21dec0538"
}
```

---

### 3.4. Trigger Job Manually

```http
POST /api/jobs/manual
Content-Type: application/json
```

**Request Body:**
```json
{
  "connectionId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "issueNumber": 42
}
```

**Response (`202 Accepted`):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "connectionId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "repoFullName": "octocat/hello-world",
  "issueNumber": 42,
  "issueTitle": "Issue #42",
  "issueBody": null,
  "status": "QUEUED",
  "attempts": 0,
  "prUrl": null,
  "errorMessage": null,
  "createdAt": "2026-10-16T02:20:00.000Z",
  "updatedAt": "2026-10-16T02:20:00.000Z"
}
```

---

### 3.5. List All Jobs (Dashboard Feed)

```http
GET /api/jobs
Accept: application/json
```

**Response (`200 OK`):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "connectionId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
    "repoFullName": "octocat/hello-world",
    "issueNumber": 42,
    "issueTitle": "NullPointerException in UserService.getUser()",
    "issueBody": "Calling getUser with a null ID throws NPE",
    "status": "PR_CREATED",
    "attempts": 1,
    "prUrl": "https://github.com/octocat/hello-world/pull/43",
    "errorMessage": null,
    "createdAt": "2026-10-16T02:20:00.000Z",
    "updatedAt": "2026-10-16T02:21:45.000Z"
  }
]
```

---

### 3.6. Get Job Details by ID

```http
GET /api/jobs/{id}
Accept: application/json
```

**Response (`200 OK`):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "connectionId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "repoFullName": "octocat/hello-world",
  "issueNumber": 42,
  "issueTitle": "NullPointerException in UserService.getUser()",
  "issueBody": "Calling getUser with a null ID throws NPE",
  "status": "PR_CREATED",
  "attempts": 1,
  "prUrl": "https://github.com/octocat/hello-world/pull/43",
  "errorMessage": null,
  "createdAt": "2026-10-16T02:20:00.000Z",
  "updatedAt": "2026-10-16T02:21:45.000Z"
}
```

---

### 3.7. Get Job Execution Logs (Activity Feed / Console)

```http
GET /api/jobs/{id}/logs
Accept: application/json
```

**Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "QUEUED",
    "message": "Job manually queued for octocat/hello-world #42",
    "timestamp": "2026-10-16T02:20:00.120Z"
  },
  {
    "id": 2,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "CLONING",
    "message": "Cloning repository octocat/hello-world into workspace",
    "timestamp": "2026-10-16T02:20:02.450Z"
  },
  {
    "id": 3,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "INDEXING",
    "message": "Indexed 48 code chunks across 12 files into vector store",
    "timestamp": "2026-10-16T02:20:10.890Z"
  },
  {
    "id": 4,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "RETRIEVING",
    "message": "Retrieved 6 chunks for issue context: [src/main/java/com/example/UserService.java]",
    "timestamp": "2026-10-16T02:20:12.300Z"
  },
  {
    "id": 5,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "GENERATING",
    "message": "Generating patch with LLM (Attempt 1/3)",
    "timestamp": "2026-10-16T02:20:13.100Z"
  },
  {
    "id": 6,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "TESTING",
    "message": "Executing test suite inside Docker sandbox container (Attempt 1)",
    "timestamp": "2026-10-16T02:20:30.000Z"
  },
  {
    "id": 7,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "TESTING",
    "message": "Sandbox tests PASSED (Exit code 0)",
    "timestamp": "2026-10-16T02:20:45.600Z"
  },
  {
    "id": 8,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "CREATING_PR",
    "message": "Creating branch gitfix/issue-42 and committing changes",
    "timestamp": "2026-10-16T02:20:46.000Z"
  },
  {
    "id": 9,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "step": "PR_CREATED",
    "message": "Successfully created PR: https://github.com/octocat/hello-world/pull/43",
    "timestamp": "2026-10-16T02:20:50.200Z"
  }
]
```

---

### 3.8. Get Job Attempts & Diff Inspection

```http
GET /api/jobs/{id}/attempts
Accept: application/json
```

**Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "attemptNo": 1,
    "patch": "{\"explanation\": \"Added null check in getUser() to return Optional.empty() when input id is null.\", \"files\": [{\"filePath\": \"src/main/java/com/example/UserService.java\", \"content\": \"package com.example;\\n...\\n\", \"action\": \"MODIFY\"}]}",
    "testPassed": true,
    "testLogs": "[INFO] Running com.example.UserServiceTest\n[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS",
    "createdAt": "2026-10-16T02:20:45.000Z"
  }
]
```

---

### 3.9. Retry a Failed Job

```http
POST /api/jobs/{id}/retry
Accept: application/json
```

**Response (`202 Accepted`):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "connectionId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "repoFullName": "octocat/hello-world",
  "issueNumber": 42,
  "issueTitle": "Issue #42",
  "status": "QUEUED",
  "attempts": 0,
  "prUrl": null,
  "errorMessage": null,
  "createdAt": "2026-10-16T02:20:00.000Z",
  "updatedAt": "2026-10-16T02:25:00.000Z"
}
```

---

### 3.10. Error Handling Schema (All Endpoints)

If validation fails or an error occurs:

```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-10-16T02:25:10.000Z",
  "validationErrors": {
    "issueNumber": "issueNumber is required",
    "connectionId": "connectionId is required"
  }
}
```

---

## 4. Frontend UI State Guide

### Status Badges:
| Status | Meaning | Recommended UI Color / Icon |
| :--- | :--- | :--- |
| `QUEUED` | Job waiting in async task queue | 🟡 Amber badge ("Queued") |
| `CLONING` | Shallow cloning repository via JGit | 🔵 Blue spinner ("Cloning Repository") |
| `INDEXING` | Parsing & generating vector embeddings | 🟣 Purple spinner ("Indexing Codebase") |
| `RETRIEVING` | Semantic similarity search for issue context | 🔷 Indigo spinner ("Retrieving Relevant Files") |
| `GENERATING` | Ollama LLM writing surgical patch | ✨ Cyan pulse ("AI Generating Fix") |
| `TESTING` | Docker sandbox executing test suite | 🧪 Orange spinner ("Running Docker Tests") |
| `RETRYING` | Tests failed; refining fix with failure logs | 🟠 Amber warning ("Retrying Attempt X/3") |
| `CREATING_PR` | Committing and pushing branch | 🚀 Blue spinner ("Opening Pull Request") |
| `PR_CREATED` | Pull Request created and ready for review | 🟢 Green badge ("PR Created — Human Review") |
| `FAILED` | Exhausted retries or pipeline error | 🔴 Red badge ("Failed — View Logs") |
