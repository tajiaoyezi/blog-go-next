FROM golang:1.25-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache gcc musl-dev

# 先复制依赖文件，利用 Docker 层缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
# server: 主服务
# migrate: 手动执行 schema 迁移（多副本部署推荐）
# seed: 首次部署创建管理员账号（读取 SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD）
RUN CGO_ENABLED=0 go build -o server ./cmd/server/ && \
    CGO_ENABLED=0 go build -o migrate ./cmd/migrate/ && \
    CGO_ENABLED=0 go build -o seed ./cmd/seed/

# 运行镜像
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /app/server .
COPY --from=builder /app/migrate .
COPY --from=builder /app/seed .
COPY --from=builder /app/config.docker.yaml ./config.yaml

EXPOSE 8080

CMD ["./server"]
