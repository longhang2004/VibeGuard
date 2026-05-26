# VibeGuard — AI Agent Build Prompts (Phase by Phase)

> **Project:** VibeGuard — Context & Security Platform for AI-Assisted Development  
> **Stack:** NestJS · Java Spring Boot · Next.js 15 · Kafka · Docker · PostgreSQL · Redis  
> **How to use:** Feed each phase prompt to your AI agent (Claude Code, Cursor, etc.) at the start of that phase. Always attach the generated `CLAUDE.md` from Phase 0 as persistent context.

---

## PHASE 0 — Project Bootstrap & CLAUDE.md

> **Goal:** Set up the repo structure, CLAUDE.md, and all foundational configs before writing any service code.

```
You are a senior backend architect. I am building a project called **VibeGuard** — a microservices platform that helps developers manage AI coding context files (CLAUDE.md, .cursorrules) and auto-scan AI-generated code for security vulnerabilities.

## Your task for this phase:

1. Scaffold the monorepo with the following structure:
   ```
   vibeguard/
   ├── CLAUDE.md                    # persistent context file (create this first)
   ├── docker-compose.yml
   ├── docker-compose.dev.yml
   ├── .env.example
   ├── .gitignore
   ├── README.md
   ├── services/
   │   ├── api-gateway/             # NestJS
   │   ├── context-service/         # NestJS + PostgreSQL
   │   ├── security-scanner/        # Java Spring Boot
   │   ├── analytics-service/       # NestJS + TimescaleDB
   │   └── notification-service/    # NestJS + Kafka consumer
   └── frontend/                    # Next.js 15
   ```

2. Create `CLAUDE.md` at root with the following sections:
   - Project overview & purpose
   - Full tech stack per service
   - Naming conventions (camelCase for JS/TS, PascalCase for Java classes, kebab-case for file names)
   - API response format standard: `{ success, data, error, meta }`
   - Kafka topic naming convention: `vibeguard.<service>.<event>` (e.g. `vibeguard.scanner.completed`)
   - Git branch strategy: `feat/`, `fix/`, `chore/` prefixes
   - Environment variable naming: `SCREAMING_SNAKE_CASE`, grouped by service
   - Docker network name: `vibeguard-net`
   - Ports: gateway=3000, context=3001, scanner=8080, analytics=3002, notification=3003, frontend=4000

3. Create `docker-compose.yml` that includes:
   - PostgreSQL (port 5432, database: vibeguard)
   - Redis (port 6379)
   - Kafka + Zookeeper (Kafka port 9092)
   - Kafka UI (port 8090) for local dev visibility
   - All services above with correct port mappings
   - A shared `vibeguard-net` Docker network
   - Health checks for Kafka and PostgreSQL

4. Create `.env.example` with all required variables grouped by service.

5. Initialize each service folder with a minimal `package.json` (for NestJS) or `pom.xml` (for Java), plus a placeholder `src/main.ts` or `src/main/java/.../Application.java`.

## Constraints:
- Do NOT write business logic yet — only scaffolding and config.
- Every NestJS service must use Typescript strict mode.
- Java service must use Spring Boot 3.x with Maven.
- All services must have a `/health` endpoint returning `{ status: "ok", service: "<name>" }`.
- Use Node 20 LTS and Java 21 as base Docker images.

Start by creating `CLAUDE.md`, then proceed with the scaffolding.
```

---

## PHASE 1 — API Gateway Service (NestJS)

> **Goal:** Build the entry point — authentication, routing, rate limiting, request logging.

```
## Context
Refer to CLAUDE.md for all conventions. The project is VibeGuard. This phase builds the `api-gateway` service only.

## Your task:

Build the `services/api-gateway` NestJS service with the following:

### 1. Auth Module
- JWT-based authentication (access token: 15min, refresh token: 7days)
- Endpoints:
  - `POST /auth/register` — email + password, returns tokens
  - `POST /auth/login` — returns tokens
  - `POST /auth/refresh` — refresh access token
  - `POST /auth/logout` — invalidate refresh token (store in Redis blacklist)
- Password hashing with bcrypt (salt rounds: 12)
- Store users in PostgreSQL via TypeORM
- User entity: `id (uuid), email, passwordHash, createdAt, updatedAt`

### 2. Proxy / Route Module
- Use `http-proxy-middleware` or NestJS `HttpModule` to forward requests to downstream services:
  - `/api/context/**` → `context-service:3001`
  - `/api/scanner/**` → `security-scanner:8080`
  - `/api/analytics/**` → `analytics-service:3002`
- Attach authenticated user id as `X-User-Id` header before forwarding
- Strip the `/api` prefix before forwarding

### 3. Rate Limiting
- Use `@nestjs/throttler` with Redis store
- Limits: 100 req/min per IP globally, 10 req/min for `/auth/login`

### 4. Request Logging Middleware
- Log: method, path, statusCode, responseTime, userId (if authenticated)
- Use a structured JSON logger (use `pino` or `winston`)
- Do NOT log request/response bodies

### 5. Global Exception Filter
- Catch all unhandled exceptions
- Return standard format: `{ success: false, error: { code, message } }`
- Map HttpException status codes correctly

### 6. Swagger
- Enable `@nestjs/swagger` at `/docs`
- All endpoints must have `@ApiOperation`, `@ApiResponse` decorators

## Constraints:
- Follow the API response format from CLAUDE.md: `{ success, data, error, meta }`
- Write unit tests for AuthService (register, login, refresh logic) using Jest
- Use `class-validator` + `class-transformer` for all DTOs
- No business logic belongs here — gateway only routes and authenticates
```

---

## PHASE 2 — Context Service (NestJS)

> **Goal:** The core service — generate, store, version, and share context template files.

```
## Context
Refer to CLAUDE.md. This phase builds `services/context-service` only. Auth is handled by the gateway — this service trusts the `X-User-Id` header.

## Your task:

Build the `services/context-service` NestJS service with the following:

### 1. Data Models (TypeORM + PostgreSQL)

**Template entity:**
- `id (uuid), name, description, techStack (jsonb), projectType (enum), content (text), authorId (uuid), isPublic (boolean), starCount (int), createdAt, updatedAt`
- projectType enum: `NESTJS_MONOLITH | JAVA_SPRING | NEXTJS_FRONTEND | FULLSTACK | MICROSERVICES | OTHER`

**TemplateVersion entity:**
- `id (uuid), templateId, version (semver string), content (text), changelog, createdAt`
- Always create a new version record on content update (never mutate content in-place)

**TemplateStar entity:**
- `id (uuid), templateId, userId (uuid), createdAt`
- Unique constraint on (templateId, userId)

### 2. Endpoints

**Template CRUD:**
- `POST /templates` — create template, auto-creates version `1.0.0`
- `GET /templates` — list public templates, with filters: `projectType`, `techStack[]`, pagination
- `GET /templates/:id` — get template detail with latest version content
- `PUT /templates/:id` — update template (owner only), creates new version, accepts `changelog` in body
- `DELETE /templates/:id` — soft delete (owner only)

**Version history:**
- `GET /templates/:id/versions` — list all versions
- `GET /templates/:id/versions/:version` — get content at specific version

**Community:**
- `POST /templates/:id/star` — star a template
- `DELETE /templates/:id/star` — unstar
- `GET /templates/trending` — top 10 by starCount in last 7 days

**Generator:**
- `POST /templates/generate` — accepts `{ techStack: string[], projectType, conventions?: object }` and returns a ready-to-use CLAUDE.md content string using a predefined generation engine (no AI call needed — use template interpolation logic)

### 3. Generation Engine
Build a `TemplateGeneratorService` that:
- Has a map of base templates per `projectType`
- Interpolates `techStack`, `conventions`, `projectName` into the template
- Produces valid markdown output that follows the CLAUDE.md structure defined in CLAUDE.md

### 4. Kafka Events
Publish to Kafka when:
- `vibeguard.context.template_created` — after new template created
- `vibeguard.context.template_starred` — after star action (for analytics)

### 5. Caching
- Cache `GET /templates/trending` in Redis with 10-minute TTL
- Cache individual template content with 5-minute TTL, invalidate on update

## Constraints:
- Validate all input with `class-validator`
- Write unit tests for `TemplateGeneratorService`
- Pagination must use cursor-based approach (use `createdAt` + `id` as cursor)
- Never expose `authorId` in list responses — use `isOwner: boolean` derived from `X-User-Id`
```

---

## PHASE 3 — Security Scanner Service (Java Spring Boot)

> **Goal:** The most technically impressive service — scan code for security vulnerabilities.

```
## Context
Refer to CLAUDE.md. This phase builds `services/security-scanner` as a Java 21 + Spring Boot 3.x service. Auth is handled upstream — trust `X-User-Id` header. This service performs static analysis on code snippets.

## Your task:

### 1. Scan API

**Endpoints:**
- `POST /scan` — submit code for scanning
  - Body: `{ code: string, language: "typescript"|"javascript"|"java"|"python", filename?: string }`
  - Returns: `{ scanId, status: "queued" }`
- `GET /scan/:scanId` — get scan result
  - Returns full result with findings when status is `completed`
- `GET /scan/history` — list scans for current user (paginated, from PostgreSQL)

**Scan Result structure:**
```json
{
  "scanId": "uuid",
  "status": "completed",
  "language": "typescript",
  "scannedAt": "ISO timestamp",
  "summary": { "critical": 0, "high": 1, "medium": 2, "low": 3, "score": 74 },
  "findings": [
    {
      "ruleId": "SEC001",
      "severity": "HIGH",
      "title": "Hardcoded Secret Detected",
      "description": "...",
      "line": 14,
      "column": 5,
      "snippet": "...",
      "remediation": "Use environment variables instead."
    }
  ]
}
```

### 2. Detection Rules Engine

Build a `RuleEngine` with the following rules (implement each as a separate `Rule` class implementing a `Rule` interface with `detect(code, language): Finding[]`):

| Rule ID | Severity | Name | Detection Logic |
|---------|----------|------|----------------|
| SEC001 | CRITICAL | Hardcoded Secret | Regex: API keys, tokens, passwords in string literals |
| SEC002 | CRITICAL | SQL Injection Risk | String concatenation in SQL-like patterns |
| SEC003 | HIGH | Missing Auth Check | Functions named `get/post/put/delete` with no auth guard pattern |
| SEC004 | HIGH | CORS Wildcard | `origin: '*'` or `allowedOrigins("*")` |
| SEC005 | HIGH | Eval Usage | `eval(`, `Function(` calls |
| SEC006 | MEDIUM | Console Log in Code | `console.log(` left in non-test files |
| SEC007 | MEDIUM | TODO/FIXME Security | Comments containing `TODO: auth`, `FIXME: security` |
| SEC008 | LOW | Weak Hashing | MD5 or SHA1 usage |

### 3. Async Processing with Kafka
- `POST /scan` immediately publishes to topic `vibeguard.scanner.requested` and returns `scanId`
- A `KafkaConsumer` picks up the job, runs the `RuleEngine`, saves result to PostgreSQL
- Publishes `vibeguard.scanner.completed` with `{ scanId, userId, summary }` after completion
- `GET /scan/:scanId` polls PostgreSQL for the result

### 4. Score Calculation
- Start at 100
- CRITICAL finding: -25 each
- HIGH: -10 each
- MEDIUM: -5 each
- LOW: -2 each
- Minimum score: 0

### 5. Storage
- PostgreSQL with Spring Data JPA
- Entities: `Scan`, `Finding`
- Store full `code` input only if length < 50,000 chars (truncate + flag otherwise)

## Constraints:
- Use Spring Kafka for both producer and consumer
- All regex patterns must be compiled as static constants (not compiled per call)
- Rule classes must be Spring `@Component` and auto-discovered via `List<Rule>` injection
- Write unit tests for each Rule class covering at least 2 true positive and 1 false negative case
- Use Flyway for database migrations
```

---

## PHASE 4 — Analytics Service & Notification Service (NestJS)

> **Goal:** Consume Kafka events, persist analytics, send alerts.

```
## Context
Refer to CLAUDE.md. This phase builds two lightweight NestJS services:
1. `services/analytics-service` — consumes Kafka events, stores metrics
2. `services/notification-service` — consumes events, sends Slack/email notifications

---

## PART A: Analytics Service

### Kafka Consumers
Consume the following topics and persist to TimescaleDB (use PostgreSQL + hypertable extension):
- `vibeguard.context.template_created` → record `{ userId, projectType, techStack[], timestamp }`
- `vibeguard.context.template_starred` → record `{ templateId, timestamp }`
- `vibeguard.scanner.completed` → record `{ userId, language, score, criticalCount, highCount, timestamp }`

### Endpoints
- `GET /analytics/scans/summary` — for authenticated user: total scans, avg score, most common vulnerability
- `GET /analytics/scans/trend` — scan score over time (last 30 days), returns time-series array
- `GET /analytics/templates/popular` — top templates by star events in last 7 days
- `GET /analytics/global/stats` — public: total scans run, total templates, avg security score globally

### TimescaleDB Setup
- Create a `scan_metrics` hypertable partitioned by `timestamp`
- Index on `userId` and `timestamp`

---

## PART B: Notification Service

### Kafka Consumers
- `vibeguard.scanner.completed`:
  - If `summary.critical > 0` → send alert notification
  - If `summary.score < 50` → send warning notification
- `vibeguard.context.template_starred`:
  - If template author != event userId → notify author "Your template was starred"

### Notification Channels
- **In-app notifications** — store in PostgreSQL table `notifications(id, userId, type, title, message, read, createdAt)`
- **Slack webhook** — send to `SLACK_WEBHOOK_URL` env var (only for critical security alerts)

### Endpoints
- `GET /notifications` — list unread notifications for current user
- `PATCH /notifications/:id/read` — mark as read
- `PATCH /notifications/read-all` — mark all as read

## Constraints for both services:
- Use `@nestjs/microservices` with Kafka transport for consumers
- All consumer handlers must be idempotent (safe to re-process same event)
- Write integration tests for Kafka consumers using `@testcontainers/kafka`
- Notification service must not crash if Slack webhook fails — catch error, log, continue
```

---

## PHASE 5 — Frontend Dashboard (Next.js 15)

> **Goal:** Build the user-facing dashboard — template browser, code scanner, analytics charts.

```
## Context
Refer to CLAUDE.md. This phase builds the `frontend/` Next.js 15 app. It communicates exclusively with the API Gateway at `NEXT_PUBLIC_API_URL`. Use App Router only (no Pages Router).

## Your task:

### 1. Tech Stack
- Next.js 15 with App Router + TypeScript strict
- Tailwind CSS + shadcn/ui component library
- TanStack Query (React Query) v5 for server state
- Zustand for client state (auth tokens, user info)
- Recharts for analytics charts
- Monaco Editor for the code scanner input

### 2. Pages & Layout

**Public pages (no auth required):**
- `/` — Landing page with hero, feature highlights, live global stats (fetch from `/api/analytics/global/stats`)
- `/templates` — Browse public templates, filter by projectType and techStack
- `/templates/[id]` — Template detail page with version history

**Auth pages:**
- `/login` and `/register` — Forms with client-side validation
- Redirect to `/dashboard` after login

**Protected pages (auth required):**
- `/dashboard` — Overview: recent scans, notifications bell, quick actions
- `/dashboard/scanner` — Code scanner: Monaco editor + language selector + scan button, results panel with findings list
- `/dashboard/templates` — My templates CRUD (create, edit, view versions)
- `/dashboard/templates/new` — Template generator wizard (step 1: choose projectType, step 2: select techStack, step 3: add conventions, step 4: preview & save)
- `/dashboard/analytics` — Charts: scan score trend (line chart), vulnerability breakdown (bar chart), scan history table
- `/dashboard/notifications` — Notification inbox

### 3. Key UI Components to build:

**ScanResultPanel:**
- Shows score as a circular gauge (0-100, color: green ≥80, yellow 50-79, red <50)
- Findings grouped by severity with collapsible sections
- Each finding shows: title, severity badge, line number, code snippet, remediation tip

**TemplateCard:**
- Shows name, projectType badge, techStack pills, star count, star/unstar button
- Truncated description with "Copy content" button

**SecurityScoreGauge:**
- SVG-based circular progress, animated on mount

### 4. Auth Flow
- Store access token in memory (Zustand), refresh token in httpOnly cookie
- Axios interceptor: auto-refresh on 401, retry original request once
- Protected routes: use Next.js middleware to redirect unauthenticated users

### 5. Real-time Notifications
- Poll `/api/notifications` every 30 seconds when user is authenticated
- Show unread count badge on notification bell icon
- Toast notification when a new critical scan result arrives

## Constraints:
- No `any` in TypeScript — define proper types for all API responses in `types/api.ts`
- All data fetching must use TanStack Query (no raw `useEffect` + `fetch`)
- Mobile responsive — all pages must work on 375px width
- Use Next.js `loading.tsx` and `error.tsx` for each route segment
- Dark mode support via Tailwind `dark:` classes and `next-themes`
```

---

## PHASE 6 — Integration, Polish & README

> **Goal:** Wire everything together, add E2E tests, write proper documentation.

```
## Context
Refer to CLAUDE.md. All services are built. This final phase integrates, tests, and documents the full system.

## Your task:

### 1. Docker Compose — Production-ready
Update `docker-compose.yml` to:
- Build all services from their Dockerfiles (multi-stage builds)
- Add `depends_on` with `condition: service_healthy` for Kafka and PostgreSQL dependencies
- Add resource limits (memory: 512m for NestJS services, 1g for Java service)
- Ensure all services restart on failure: `restart: unless-stopped`
- Create a `docker-compose.prod.yml` override with `NODE_ENV=production` and no port exposure except gateway (3000) and frontend (4000)

Write a `Dockerfile` for each service:
- NestJS services: multi-stage (build → production), final image based on `node:20-alpine`
- Java service: multi-stage (Maven build → `eclipse-temurin:21-jre-alpine`)
- Next.js: multi-stage with `output: standalone`

### 2. E2E Happy Path Test
Write a single end-to-end test script (`e2e/happy-path.test.ts`) using `axios` + `jest` that:
1. Registers a new user
2. Logs in, stores token
3. Generates a context template via POST /api/context/templates/generate
4. Saves the template
5. Submits a code snippet for scanning (include a hardcoded password in the snippet)
6. Polls scan result until `status === "completed"` (max 15s, poll every 1s)
7. Asserts that `findings` contains at least one `SEC001` (hardcoded secret) finding
8. Asserts `summary.score < 100`

### 3. README.md
Write a comprehensive `README.md` at the repo root:

**Sections:**
- **What is VibeGuard** — 2-paragraph pitch
- **Architecture Diagram** — ASCII diagram of all services + Kafka + databases
- **Tech Stack Table** — service | technology | purpose
- **Getting Started** — prerequisites, `git clone`, `cp .env.example .env`, `docker compose up -d`, then verify all health endpoints
- **API Reference** — link to Swagger at `localhost:3000/docs`
- **Key Features** with screenshots placeholder (add `docs/screenshots/` folder with `.gitkeep`)
- **Development Guide** — how to run a single service locally without Docker
- **Running Tests** — commands per service
- **Contributing** — branch naming, PR template, commit message format
- **Roadmap** — Phase 2 ideas (GitHub App integration, VS Code extension, team workspaces)

### 4. GitHub Actions CI
Create `.github/workflows/ci.yml`:
- Trigger on: push to `main`, pull_request to `main`
- Jobs:
  - `lint-and-test-nestjs`: run for each NestJS service (matrix strategy)
  - `test-java`: run Maven tests for security-scanner
  - `build-frontend`: run `next build`
- Use `docker compose` service for PostgreSQL and Kafka in test environment

### 5. CLAUDE.md Final Update
Update the root `CLAUDE.md` to add:
- Current project status: all phases complete
- Known limitations / technical debt section
- How to run E2E tests
- Changelog of major architectural decisions made during build

## Final checklist before done:
- [ ] All `/health` endpoints return 200
- [ ] `docker compose up` starts cleanly with no errors after 60s
- [ ] E2E happy path test passes
- [ ] Swagger docs accessible at `localhost:3000/docs`
- [ ] README has clear setup instructions a new developer can follow
```

---

## 📎 Persistent CLAUDE.md Reminder

> At the start of **every phase**, prepend this to your agent prompt:

```
Before starting, read the CLAUDE.md file at the root of this repository. 
All naming conventions, API formats, port assignments, Kafka topic patterns, 
and architectural decisions are defined there. Do not deviate from them.
```

---

*Generated for VibeGuard project — May 2026*
