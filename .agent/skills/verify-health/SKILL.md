# Skill: Microservice Health Verification

This skill defines the process to verify that each VibeGuard service is up, running, and listening on its assigned port.

## Context
Every microservice in VibeGuard is required to expose a `/health` endpoint returning `{ "status": "ok", "service": "<name>" }`.

## Ports Mapping Table
- `api-gateway`: 3000
- `context-service`: 3001
- `security-scanner`: 8080
- `analytics-service`: 3002
- `notification-service`: 3003
- `frontend`: 4000

## Verification Procedure

Run the following curl commands to inspect the state of each service:

```bash
# 1. API Gateway
curl http://localhost:3000/health

# 2. Context Service
curl http://localhost:3001/health

# 3. Security Scanner
curl http://localhost:8080/health

# 4. Analytics Service
curl http://localhost:3002/health

# 5. Notification Service
curl http://localhost:3003/health
```

Expected Response Body:
```json
{ "status": "ok", "service": "<service-name>" }
```
If a service returns a 500, a connection refused error, or a different response format, it is considered unhealthy.
