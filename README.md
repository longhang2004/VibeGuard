# VibeGuard

VibeGuard is a context and security platform built to streamline and secure AI-assisted software development. It functions as a secure microservices-based gateway that allows engineering teams to centralize, version, and share AI developer rules files (such as `CLAUDE.md` and `.cursorrules`), while scanning AI-generated code blocks in real-time for potential security vulnerabilities before they are merged.

By acting as a proxy layer between the client and downstream agents, VibeGuard interceptively monitors code updates, runs multi-rule AST-based security matching, publishes telemetry events through Apache Kafka, and feeds interactive dashboard charts. Additionally, the workspace includes pre-configured hooks, playbooks, memory logs, and output filters designed to optimize the performance, costs, and token efficiency of LLM coding agents.

---

## System Architecture

```
                    ┌─────────────────────────┐
                    │   Frontend Dashboard    │
                    │      (Next.js 15)       │
                    └────────────┬────────────┘
                                 │ HTTP (Port 4000)
                                 ▼
                    ┌─────────────────────────┐
                    │       API Gateway       │ ◄─────── Rate Limiting / Blacklist
                    │    (NestJS on Port 3000)│         (Redis Cache on Port 6379)
                    └────┬──────────────┬─────┘
                         │              │
        HTTP (Port 3001) │              │ HTTP (Port 8080)
                         ▼              ▼
  ┌─────────────────────────┐        ┌─────────────────────────┐
  │     Context Service     │        │    Security Scanner     │
  │  (NestJS on Port 3001)  │        │ (Spring Boot Port 8080) │
  └──────────┬──────────────┘        └──────────┬──────────────┘
             │                                  │
             │ Publish Event                    │ Publish Event
             │ (context.template_created)       │ (scanner.completed)
             ▼                                  ▼
      ┌────────────────────────────────────────────────┐
      │          Kafka Broker (Port 9092)              │
      └──────┬──────────────────────────────────┬──────┘
             │                                  │
             │ Consume Event                    │ Consume Event
             ▼                                  ▼
  ┌─────────────────────────┐        ┌─────────────────────────┐
  │    Analytics Service    │        │  Notification Service   │
  │  (NestJS on Port 3002)  │        │  (NestJS on Port 3003)  │
  └──────────┬──────────────┘        └──────────┬──────────────┘
             │                                  │
             ▼ Persist Metrics                  ▼ Persist Logs
  ┌─────────────────────────┐        ┌─────────────────────────┐
  │      TimescaleDB        │        │    PostgreSQL DB        │
  │    (Port 5432 / PG)     │        │      (Port 5432)        │
  └─────────────────────────┘        └─────────────────────────┘
```

---

## Tech Stack Overview

| Service | Technologies | Ingress Port | Purpose |
| :--- | :--- | :--- | :--- |
| **api-gateway** | NestJS, TypeScript, Redis, TypeORM, Winston | `3000` | Authenticates users, rate-limits requests, routes requests downstream. |
| **context-service** | NestJS, TypeScript, PostgreSQL, TypeORM, Kafka | `3001` | Generates context playbooks and saves versions in PostgreSQL. |
| **security-scanner** | Spring Boot 3, Java 21, Spring Kafka, Flyway, JPA | `8080` | Evaluates submitted code scripts against static vulnerability rules. |
| **analytics-service** | NestJS, TypeScript, TimescaleDB, Kafka | `3002` | Tracks security score trends, total scans, and starred templates. |
| **notification-service** | NestJS, TypeScript, PostgreSQL, Kafka, Slack HTTP | `3003` | Creates internal notification feeds and pushes critical alerts to Slack. |
| **frontend** | Next.js 15, Zustand, React Query, Monaco, Recharts | `4000` | Displays scanner status, template wizard, and analytics. |

---

## AI Agent Workspace Optimizations

To improve developer agent (Codex, Cursor, Claude, Antigravity) performance and efficiency, the repository exposes the following local structures:

1. **Andrej Karpathy Behavioral Guidelines (`CLAUDE.md`)**
   - Instructs agents to think before coding, build simple, surgical changes, and perform testing iterations prior to concluding.
2. **RTK Output Compression Helper (`scripts/rtk-compress.sh`)**
   - Intercepts shell execution outputs and filters empty lines, progress loaders, and verbose warnings to reduce context window token usage by 60–90%.
     ```bash
     ./scripts/rtk-compress.sh pnpm test
     ```
3. **Workspace Skills (`.agent/skills/`)**
   - Contains step-by-step operating playbooks for package operations, docker management, and service health checks.
4. **Local Memory Journaling (`.agent/memory/`)**
   - Records key architectural decisions (`decisions.md`) and logs agent milestones (`session-log.jsonl`) to preserve session context.
5. **AST Symbol Intelligence (`.codegraph/config.json`)**
   - Configures language mappings and scopes for `codegraph` to quickly index source graphs.

---

## Getting Started

### Prerequisites
- [Node.js v20 LTS](https://nodejs.org)
- [pnpm](https://pnpm.io)
- [Java 21 JRE/JDK](https://adoptium.net)
- [Docker & Docker Compose](https://www.docker.com)

### 1. Initialize Configuration
```bash
# Clone the repository
git clone https://github.com/longhang/VibeGuard.git
cd VibeGuard

# Copy environment variables
cp .env.example .env
```

### 2. Start Background Services
Spin up PostgreSQL, Redis, Kafka, Zookeeper, and Kafka UI:
```bash
docker compose up -d
```
*Wait ~10–15 seconds for containers to initialize and report healthy.*

### 3. Bootstrap Codebases
Install dependencies across the monorepo workspaces:
```bash
pnpm install
```

### 4. Run Development Servers
Start all microservices and the Next.js frontend in parallel:
```bash
pnpm dev
```

---

## Health Verification

Verify that all servers are listening and returning healthy status indicators:

- **API Gateway:** `http://localhost:3000/health`
- **Context Service:** `http://localhost:3001/health`
- **Security Scanner:** `http://localhost:8080/health`
- **Analytics Service:** `http://localhost:3002/health`
- **Notification Service:** `http://localhost:3003/health`
- **Frontend Dashboard:** `http://localhost:4000/health`

---

## Local Development Guide

To run a single service locally (without running all services inside Docker), set the service's specific environment variables in your terminal, then launch it:

```bash
# Example: Running the context service locally
cd services/context-service
pnpm dev
```

### Running Tests
- Test all services: `pnpm test`
- Test context-service only: `pnpm --filter context-service test`
- Test java security-scanner: `cd services/security-scanner && mvn test`

---

## Contributing & Roadmap

### Branching and Commits
- Prefix branches: `feat/`, `fix/`, `chore/`
- Standard commit format: `feat(scanner): add CORS wildcard regex rules`

### Phase 2 Roadmap
- [ ] GitHub App integration for auto-scanning Pull Requests on push
- [ ] VS Code / Cursor Extension to pull team template rules directly into the workspace
- [ ] Team workspaces and organization scopes for template sharing
