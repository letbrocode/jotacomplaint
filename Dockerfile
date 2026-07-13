FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
# Stub env vars so Next.js build succeeds without real secrets
ENV SKIP_ENV_VALIDATION=1
ENV UPSTASH_REDIS_REST_URL=https://fake-docker.upstash.io
ENV UPSTASH_REDIS_REST_TOKEN=fake-docker-token
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install psql client so the startup command can enable pg_trgm before db push
RUN apk add --no-cache postgresql-client

# Only copy what's needed at runtime — keep image lean
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start"]
