# 故障排查 | Troubleshooting

## 启动问题

### 后端无法启动

**症状**: `docker compose up` 后 backend 容器反复重启

**排查步骤**:

1. 检查日志：
   ```bash
   docker compose logs backend -f
   ```

2. 常见错误：
   - `JWT_SECRET is required`: 未设置 JWT_SECRET，检查 `.env` 文件
   - `connection refused` (database): PostgreSQL 尚未就绪，等待几秒后自动重试
   - `dial tcp: lookup postgres: no such host`: Docker 网络问题，尝试 `docker compose down && docker compose up -d`

3. 检查端口占用：
   ```bash
   # 检查 8080 端口是否被占用
   lsof -i :8080
   ```

### 前端无法启动

**症状**: `npm run dev` 失败或页面无法访问

**排查步骤**:

1. 检查 Node 版本：
   ```bash
   node -v  # 需要 v18+
   ```

2. 清理依赖重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 检查端口占用：
   ```bash
   lsof -i :3000
   ```

### 数据库连接失败

**症状**: 后端日志显示数据库连接错误

**解决方法**:

1. 检查 PostgreSQL 容器状态：
   ```bash
   docker compose ps postgres
   docker compose logs postgres
   ```

2. 验证连接参数：
   ```bash
   docker compose exec postgres psql -U blog -d blog -c "\dt"
   ```

3. 检查环境变量是否正确加载

## 运行时问题

### 500 内部服务器错误

**排查步骤**:

1. 查看后端详细日志：
   ```bash
   docker compose logs backend -f --tail=100
   ```

2. 检查数据库连接是否正常
3. 检查 Redis 连接是否正常
4. 检查 Elasticsearch 是否可用

### 前端 API 请求失败

**症状**: 前端页面加载但数据为空，浏览器控制台显示请求错误

**排查步骤**:

1. 检查后端是否运行：`curl http://localhost:8080/health`
2. 检查网络面板：
   - 请求是否发送到正确地址
   - 是否有 CORS 错误
   - 响应状态码是什么

3. 检查 `.env.local` 中的 `BACKEND_URL` 配置

### 登录失败

**症状**: 无法登录管理后台

**排查步骤**:

1. 确认已执行 seed 创建管理员：
   ```bash
   docker compose exec postgres psql -U blog -d blog -c "SELECT * FROM tb_user_auth;"
   ```

2. 检查密码是否正确（区分大小写）
3. 检查后端日志是否有认证错误
4. 清除浏览器 Cookie/LocalStorage 后重试

## 性能问题

### 页面加载缓慢

**后端排查**:
- 检查数据库慢查询日志
- 检查是否有 N+1 查询问题
- 检查 Redis 缓存命中率

**前端排查**:
- 检查网络面板，看哪些资源加载慢
- 检查是否有过大的图片未优化
- 检查是否有过多的 API 请求

### 数据库查询慢

**解决方法**:

1. 检查索引：
   ```sql
   SELECT schemaname, tablename, attname AS column, n_distinct 
   FROM pg_stats 
   WHERE tablename = 'your_table';
   ```

2. 使用 `EXPLAIN ANALYZE` 分析慢查询
3. 为常用查询条件添加索引

## 数据问题

### 数据丢失

**紧急处理**:

1. **立即停止服务**，避免数据覆盖
2. 检查是否有备份可恢复
3. 检查 PostgreSQL WAL 日志是否可恢复

### 数据不一致

**症状**: 统计数字不匹配、关联数据异常

**排查**:

1. 检查是否有并发写入冲突
2. 检查事务是否正确使用
3. 检查缓存和数据库是否一致（可清空 Redis 重建）

## Docker 问题

### 容器无法通信

**症状**: 后端无法连接数据库/Redis

**解决方法**:

```bash
# 重建网络
docker compose down
docker network prune  # 谨慎使用
docker compose up -d

# 检查容器间连通性
docker compose exec backend ping postgres
docker compose exec backend ping redis
```

### 磁盘空间不足

**排查**:

```bash
# 查看 Docker 磁盘使用
docker system df

# 清理未使用数据
docker system prune -a  # 谨慎使用，会删除未使用的镜像/容器/网络

# 查看卷占用
docker volume ls
docker volume inspect blog-go-next_postgres_data
```

## 日志收集

收集问题排查所需的日志：

```bash
# 后端日志
docker compose logs backend --tail=500 > backend.log

# 前端构建日志
cd frontend && npm run build 2>&1 | tee build.log

# 数据库日志
docker compose logs postgres --tail=500 > postgres.log

# 系统信息
docker version > docker-info.txt
docker compose version >> docker-info.txt
docker info >> docker-info.txt
```

## 获取帮助

如果以上方法无法解决问题，请：

1. 收集相关日志
2. 提交 [GitHub Issue](https://github.com/yourusername/blog-go-next/issues)，包含：
   - 问题描述
   - 复现步骤
   - 环境信息（OS、Docker 版本、Go/Node 版本）
   - 相关日志片段
