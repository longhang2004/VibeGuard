FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/analytics-service ./services/analytics-service
RUN pnpm install --filter analytics-service... --frozen-lockfile
RUN pnpm --filter analytics-service build

FROM node:20-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/analytics-service/package.json ./services/analytics-service/
COPY --from=builder /usr/src/app/services/analytics-service/dist ./services/analytics-service/dist
RUN pnpm install --filter analytics-service... --prod --frozen-lockfile
EXPOSE 3002
CMD ["pnpm", "--filter", "analytics-service", "start:prod"]
