FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend ./frontend
RUN pnpm install --filter frontend... --frozen-lockfile
RUN pnpm --filter frontend build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build output (contains node_modules and relative workspaces)
COPY --from=builder /usr/src/app/frontend/.next/standalone ./

# Copy public assets and static resources
COPY --from=builder /usr/src/app/frontend/public ./frontend/public
COPY --from=builder /usr/src/app/frontend/.next/static ./frontend/.next/static

EXPOSE 4000
CMD ["node", "frontend/server.js"]
