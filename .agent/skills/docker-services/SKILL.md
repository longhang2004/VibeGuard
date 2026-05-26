# Skill: Local Development Docker Services

This skill outlines how to spin up, teardown, and verify the background dependencies (Postgres, Redis, Kafka) for VibeGuard.

## Context
VibeGuard depends on PostgreSQL, Redis, and Kafka + Zookeeper. We orchestrate these using `docker-compose.yml` in the root.

## Procedures

### 1. Spin up Services in Background
```bash
docker compose up -d
```
Always wait ~10–15 seconds for Kafka and Zookeeper to negotiate and start listening on port 9092.

### 2. Verify Container Health
Run:
```bash
docker compose ps
```
Look for `(healthy)` in the Status column for `vibeguard-postgres` and `vibeguard-kafka`.

### 3. Check Logs
If a service fails or is slow to boot, check logs:
```bash
docker compose logs -f <service-name>
# e.g., docker compose logs -f kafka
```

### 4. Teardown Infrastructure
To stop containers and release ports:
```bash
docker compose down
```
To also purge database/volume data (warning: resets DB):
```bash
docker compose down -v
```
