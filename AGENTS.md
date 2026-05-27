# AGENTS.md — VibeGuard AI Agent Context & Rules

## Project Overview
**VibeGuard** is a microservices-based context and security platform for AI-assisted development. It helps developers manage AI coding context files (like `AGENTS.md` and `.cursorrules`) and dynamically scans AI-generated code for security vulnerabilities.

---

## Tech Stack & Port Mappings

| Service | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **api-gateway** | NestJS / Redis / TypeORM | `3000` | Entry point, authentication, rate limiting, and request routing |
| **context-service** | NestJS / PostgreSQL / TypeORM | `3001` | Generates, stores, versions, and shares context template files |
| **security-scanner** | Java Spring Boot 3 / Kafka / JPA | `8080` | Runs static analysis on code snippets to detect vulnerabilities |
| **analytics-service** | NestJS / TimescaleDB (PostgreSQL) | `3002` | Consumes events to calculate metrics, trends, and popular templates |
| **notification-service** | NestJS / PostgreSQL / Kafka | `3003` | Sends critical security notifications via in-app feeds and Slack |
| **frontend** | Next.js 15 (App Router) / Tailwind | `4000` | Web dashboard, Monaco editor, and charts |
| **Kafka UI** | Kafka-UI Dashboard | `8090` | Kafka developer UI for topic and event visualization |

---

## Core Commands

- **Install monorepo deps:** `pnpm install`
- **Start all services in parallel (development):** `pnpm dev`
- **Build all TypeScript services & frontend:** `pnpm build`
- **Run NestJS unit tests:** `pnpm test`
- **Run Spring Boot JUnit tests:** `mvn -f services/security-scanner/pom.xml test`
- **Run E2E integration tests:** `pnpm --filter e2e test`
- **Run regression test suite:** `pnpm test:regression` (or `pnpm test:regression --e2e` to include live E2E)
- **Build all Docker containers:** `docker compose build`
- **Spin up production Docker stack:** `docker compose up -d`

---

## Development Conventions

### Naming Conventions
- **Files & Directories:** `kebab-case` (e.g. `auth-controller.ts`, `security-scanner/`)
- **JS/TS variables & functions:** `camelCase` (e.g. `getUserById`)
- **JS/TS Classes, Interfaces, Enums:** `PascalCase` (e.g. `AuthService`)
- **Java Classes, Interfaces, Enums:** `PascalCase` (e.g. `RuleEngine`)
- **PostgreSQL Tables & Columns:** `snake_case` (e.g. `template_star`, `author_id`)

### Response Format Standard
All REST APIs must return the standard format:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

### Kafka Topic Convention
Topics are formatted as: `vibeguard.<service>.<event>`
- E.g., `vibeguard.scanner.requested`
- E.g., `vibeguard.scanner.completed`
- E.g., `vibeguard.context.template_starred`

### Environment Variable Standards
- Naming format: `SCREAMING_SNAKE_CASE` (e.g. `PORT`, `DATABASE_URL`)
- Group environment variables clearly by service block in `.env` and `.env.example`.

### Docker Architecture
- Shared Docker Network: `vibeguard-net` (bridge)
- Health checks must verify Kafka and PostgreSQL container readiness.

### Git Branching Strategy
Prefix branch names as:
- `feat/` for new features
- `fix/` for bug fixes
- `chore/` for dependencies, config, and scaffolding

---

## AI Agent Guardrails (Andrej Karpathy Rules)

All AI agents (Codex, Cursor, Codex, Kiro, Antigravity) working in this repository must strictly adhere to the following rules:

1. **Think Before Coding:** Stop and state assumptions before writing code. Ask the user for clarification if instructions are ambiguous. Recommend simpler solutions instead of building complex features by default.
2. **Simplicity First:** Write the minimum amount of code required to implement a feature. Avoid premature optimizations, speculative abstractions, or building "future-proof" structures.
3. **Surgical Changes:** Keep edits minimal and highly focused. Only modify code directly related to the task. Never perform unsolicited refactoring on neighboring files.
4. **Goal-Driven Verification:** Verify your changes. Compile the project, check for lint errors, and write test assertions. Do not conclude a task until all tests pass successfully.

---

## Agent Optimization & Memory Protocols

### Command Output Compression (RTK-style)
To save context window tokens, prefix or pipe terminal outputs through the RTK-style compressor helper:
```bash
./scripts/rtk-compress.sh <command>
# Example: ./scripts/rtk-compress.sh pnpm test
```

### Workspace Skills Playbooks
Refer to the `.agent/skills/` directory for task-specific instructions:
- [bootstrap-mono/SKILL.md](file:///Users/longhang/personal_repos/VibeGuard/.agent/skills/bootstrap-mono/SKILL.md) — package/dependency management
- [docker-services/SKILL.md](file:///Users/longhang/personal_repos/VibeGuard/.agent/skills/docker-services/SKILL.md) — docker orchestration
- [verify-health/SKILL.md](file:///Users/longhang/personal_repos/VibeGuard/.agent/skills/verify-health/SKILL.md) — health endpoint validations

### Persistent Memory (Codex-mem style)
To prevent the "blank slate" problem, maintain state across agent sessions:
1. **Architectural Decisions:** Read and update [.agent/memory/decisions.md](file:///Users/longhang/personal_repos/VibeGuard/.agent/memory/decisions.md) whenever a major structural change is proposed or finalized.
2. **Session Observations:** At the end of your run, append a structured JSON line describing the session's action to [.agent/memory/session-log.jsonl](file:///Users/longhang/personal_repos/VibeGuard/.agent/memory/session-log.jsonl).
   - Format: `{"timestamp": "ISO", "phase": 0, "action": "Scaffold monorepo", "status": "completed", "filesModified": [...]}`

---

## Known Limitations & Technical Debt

1. **Kafka Integration Testing**: The tests for NestJS microservices and consumers currently use mock-based structures rather than Testcontainers. Integrating `@testcontainers/kafka` would improve integration test coverage.
2. **Java Scanner Rule Engine AST**: The static code scanner uses compiled regular expression patterns. While high-performance, it does not build a full AST parse tree (e.g. using ANTLR or Spoon), which could lead to false positives on complex formatting.
3. **Zustand Persistence Isolation**: Zustand stores credentials in localStorage. In a multi-tenant production environment, httpOnly cookies would be preferred for token storage.

---

## Changelog of Architectural Decisions

- **2026-05-26**: *Initialized Monorepo & Scaffolding*. Defined package structures (`pnpm-workspace.yaml`), Docker network (`vibeguard-net`), and ports layout.
- **2026-05-26**: *Auth & Gateway Implementation*. Configured Winston JSON logger, Redis throttlers, and custom Axios API client with automatic token refreshing.
- **2026-05-27**: *Microservices & Kafka Integration*. Implemented Java Spring Boot rule engine, NestJS notification feeds, and TimescaleDB event ingestion.
- **2026-05-27**: *Dynamic Routing Rewrite*. Injected `/api` prefixer in frontend interceptors and dynamic pathRewrite in gateway `ProxyMiddleware` to match downstream controller endpoints.
- **2026-05-27**: *Next.js Standalone Containerization*. Configured `output: 'standalone'` in `next.config.ts` and re-architected Dockerfile build/run sequence.
- **2026-05-27**: *Test Suite Refactoring*. Added Supertest HTTP integration tests in gateway, MockMvc in Spring Boot scanner controller, React Testing Library suite for the frontend gauge, and a unified `run-regression-suite.sh` runner script.
