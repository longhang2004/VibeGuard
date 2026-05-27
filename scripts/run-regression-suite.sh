#!/bin/bash
set -e

# ANSI escape codes for beautiful styling
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}================================================================${NC}"
echo -e "${BOLD}${BLUE}                  VibeGuard Regression Test Suite                ${NC}"
echo -e "${BOLD}${BLUE}================================================================${NC}"
echo ""

# Exit handler for failures
failure() {
  echo -e "\n${BOLD}${RED}[×] Regression Test Suite Failed!${NC}\n"
  exit 1
}
trap failure ERR

# 1. Run Java Security Scanner tests
echo -e "${BOLD}${YELLOW}1. Running Java Spring Boot & Security Scanner tests...${NC}"
mvn test -f services/security-scanner/pom.xml
echo -e "${GREEN}[✓] Java Scanner tests completed successfully.${NC}"
echo ""

# 2. Run Node.js Workspace tests (NestJS microservices + Next.js frontend component tests)
echo -e "${BOLD}${YELLOW}2. Running Node.js workspace tests (NestJS + Frontend)...${NC}"
pnpm test
echo -e "${GREEN}[✓] Node.js workspace tests completed successfully.${NC}"
echo ""

# 3. Optional E2E tests
if [[ "$1" == "--e2e" ]]; then
  echo -e "${BOLD}${YELLOW}3. Running End-to-End (E2E) integration tests...${NC}"
  pnpm --filter e2e test
  echo -e "${GREEN}[✓] E2E integration tests completed successfully.${NC}"
  echo ""
fi

# Summary
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}          [✓] ALL REGRESSION TESTS COMPLETED SUCCESSFULLY        ${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
