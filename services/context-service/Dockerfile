FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/context-service ./services/context-service
RUN pnpm install --filter context-service... --frozen-lockfile
RUN pnpm --filter context-service build

FROM node:20-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/context-service/package.json ./services/context-service/
COPY --from=builder /usr/src/app/services/context-service/dist ./services/context-service/dist
RUN pnpm install --filter context-service... --prod --frozen-lockfile
EXPOSE 3001
CMD ["pnpm", "--filter", "context-service", "start:prod"]
