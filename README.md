# ReachInbox Onebox - Starter Implementation

This repository is a **starter, working skeleton** for the ReachInbox assignment (Associate Backend Engineer).
It includes:
- IMAP IDLE sync skeleton (TypeScript, Node.js) using `node-imap`
- Elasticsearch & Qdrant docker-compose (for indexing and vectors)
- Minimal TypeScript backend with endpoints for searching and listing emails
- Simple static frontend (HTML + JS) to view/search emails
- Stubbed AI categorization & RAG pipeline (placeholders and instructions)

**Important:** This is a starter implementation to get you running quickly. You must install dependencies and provide IMAP account credentials (two test accounts) to run the IMAP sync live.

## What is included
- `docker-compose.yml` — Elasticsearch (7.17.1) and Qdrant services.
- `backend/` — Typescript Node app skeleton
- `frontend/` — Simple static UI to talk to backend
- `.env.example` — environment variables template

## Quick setup (tested locally)
1. Install Docker and Docker Compose.
2. Start the persistence services:
   ```bash
   docker-compose up -d
   ```
3. Backend setup
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env to add your IMAP accounts and webhooks
   npm run build
   npm run start
   ```
   - The backend runs on port 3000 by default.
4. Open the frontend: `frontend/index.html` in a browser (or serve it with `npx serve frontend`)

## Notes and Next Steps
- IMAP: Add at least two IMAP account credentials in `.env` (see `.env.example`). The code uses `node-imap` and keeps IDLE connections alive with a watchdog.
- Elasticsearch: make sure it's healthy at `http://localhost:9200`. The backend will create the `emails` index on startup if missing.
- AI / Gemini: The `backend/src/llm.ts` contains stubs. Replace with real Gemini/OpenAI integration and credentials.
- RAG/Vector DB: Qdrant is included; embedding generation and storage are scaffolded but need your API integration.

This package aims to be a complete, runnable starting point — extend and polish each module to finish the assignment requirements.
#
