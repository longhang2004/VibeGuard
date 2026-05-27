FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api-gateway ./services/api-gateway
RUN pnpm install --filter api-gateway... --frozen-lockfile
RUN pnpm --filter api-gateway build

FROM node:20-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /usr/src/app/services/api-gateway/dist ./services/api-gateway/dist
RUN pnpm install --filter api-gateway... --prod --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "--filter", "api-gateway", "start:prod"]
