# VibeGuard Architectural Decision Records (ADR)

This file tracks important design decisions, dependencies, and architectural patterns adopted over the course of VibeGuard's development.

## ADR 01: Monorepo Architecture & Package Management
- **Date:** 2026-05-26
- **Status:** Approved
- **Decisions:**
  1. We use a **monorepo** structure under the root directory.
  2. We leverage **`pnpm` workspaces** for Node.js modules (`services/*`, `frontend`) to enable shared dependencies, lockfile hoisting, and parallel execution.
  3. We group backend services under `services/` and the client app under `frontend/`.

## ADR 02: Stack Configuration per Service
- **Date:** 2026-05-26
- **Status:** Approved
- **Decisions:**
  - **`api-gateway`**: NestJS, Typescript Strict, Redis caching/rate limiting, TypeORM, PostgreSQL.
  - **`context-service`**: NestJS, Typescript Strict, PostgreSQL, Kafka events.
  - **`security-scanner`**: Java 21, Spring Boot 3.x, Maven, Spring Kafka, Flyway, Spring Data JPA.
  - **`analytics-service`**: NestJS, TimescaleDB (hypertable partitioned by timestamp), Kafka consumers.
  - **`notification-service`**: NestJS, PostgreSQL (for storing in-app notifications), Kafka consumers.
  - **`frontend`**: Next.js 15 App Router, Tailwind CSS, TanStack Query, Zustand, Monaco Editor.

## ADR 03: Communication Protocol
- **Date:** 2026-05-26
- **Status:** Approved
- **Decisions:**
  1. **HTTP/REST** is used for ingress communication (frontend -> api-gateway -> downstream services).
  2. **Kafka** (broker `vibeguard-kafka`) is used for async, event-driven integration (e.g. scanner completed, templates starred).
  3. **Redis** is utilized for caching (trending templates) and rate-limiting auth routes.

## ADR 04: AI Agent Behavior Rules & Workspace Tools
- **Date:** 2026-05-26
- **Status:** Approved
- **Decisions:**
  1. Integrated the 4 Andrej Karpathy behavior guidelines in `CLAUDE.md`.
  2. Created `.agent/skills/` playbooks for quick tool alignment.
  3. Configured `codegraph` for symbol indexing.
  4. Established `scripts/rtk-compress.sh` to shrink command line tokens.
