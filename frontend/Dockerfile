FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE=/api/v1
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# BACKEND_URL for Next.js rewrites — must be set at build time for standalone mode
ARG BACKEND_URL=http://localhost:8080
ENV BACKEND_URL=${BACKEND_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# 运行镜像
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "server.js"]
