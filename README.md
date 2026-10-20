# gitFix-ai

# GitFix AI — Autonomous GitHub Issue Resolver

> **Autonomous AI-driven GitHub Issue Resolution Pipeline with Docker Sandboxing, pgvector Semantic Retrieval, and React Frontend Dashboard.**

---

## 🌟 Overview

GitFix AI listens to GitHub issue webhooks or manual triggers, isolates the repository in a temporary workspace, indexes code chunks into PostgreSQL with `pgvector` (768 dimensions), uses Ollama (`qwen2.5-coder:7b`) to generate a surgical bug fix, runs tests inside an isolated Docker sandbox (`maven:3.9-eclipse-temurin-21`), retries with compiler failure logs if needed (up to 3 attempts), and automatically opens a verified Pull Request on GitHub.

```
git_ai/
├── API_GUIDE.md          # Complete REST API specification and architecture flow
├── gitfix-backend/       # Spring Boot 3.3.4, Java 21, Spring AI, pgvector, Docker sandbox
└── gitfix-frontend/      # React 19, Vite, Lucide Icons, Cyber-DevTools dark mode dashboard
```

---

## 🚀 Quick Start

### 1. Start Infrastructure (Docker)
```bash
cd gitfix-backend
docker compose up -d
```

### 2. Configure Environment
Copy `.env.example` to `.env` inside `gitfix-backend/`:
```bash
cp .env.example .env
```

### 3. Run Backend (Spring Boot)
```bash
cd gitfix-backend
./mvnw spring-boot:run
```
Backend runs on `http://localhost:8080`.

### 4. Run Frontend (React / Vite)
```bash
cd gitfix-frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🔒 Security
- **Token Security:** GitHub Personal Access Tokens (PAT) are encrypted at rest with **AES-256 GCM** before saving to PostgreSQL and are never returned in any API response.
- **Path Traversal Protection:** All patch paths are normalized and strictly validated to prevent `../` directory escapes.
- **Docker Isolation:** Build and unit tests execute within resource-capped containers with no host access.
