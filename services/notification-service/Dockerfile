FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/notification-service ./services/notification-service
RUN pnpm install --filter notification-service... --frozen-lockfile
RUN pnpm --filter notification-service build

FROM node:20-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/notification-service/package.json ./services/notification-service/
COPY --from=builder /usr/src/app/services/notification-service/dist ./services/notification-service/dist
RUN pnpm install --filter notification-service... --prod --frozen-lockfile
EXPOSE 3003
CMD ["pnpm", "--filter", "notification-service", "start:prod"]
