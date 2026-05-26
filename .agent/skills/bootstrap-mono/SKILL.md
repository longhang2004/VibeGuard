# Skill: Monorepo Package Management (pnpm)

This skill describes how to run workspace tasks and manage dependencies in the VibeGuard monorepo.

## Context
The repository utilizes `pnpm` workspace features. We have several Node.js/NestJS applications and a Next.js 15 application alongside a Java Maven project.

## Procedures

### 1. Bootstrapping the Monorepo
Always run this from the root directory:
```bash
pnpm install
```

### 2. Installing Dependencies
To add a dependency to a specific package, use the `--filter` flag:
```bash
# Example: Add axios to frontend
pnpm --filter frontend add axios

# Example: Add class-validator to api-gateway as dependency
pnpm --filter api-gateway add class-validator

# Example: Add dev dependency to context-service
pnpm --filter context-service add -D @types/jest
```

### 3. Running Scripts across Workspaces
- Run dev servers in parallel:
  ```bash
  pnpm dev
  ```
- Build all projects:
  ```bash
  pnpm build
  ```
- Test all projects:
  ```bash
  pnpm test
  ```
- Lint all projects:
  ```bash
  pnpm lint
  ```
