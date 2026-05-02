# 常见问题 | FAQ

## 通用问题

### Q: 项目支持哪些部署方式？

A: 支持以下部署方式：
- **Docker Compose**（推荐）：适合开发环境和单机生产部署
- **手动部署**：分别部署前后端和基础设施
- **Kubernetes**：无状态后端设计，支持容器编排

### Q: 如何备份数据？

A: 主要备份以下数据：
- **PostgreSQL**: 使用 `pg_dump` 定期备份
- **上传文件**: 备份 `./uploads` 目录或对象存储 Bucket
- **Redis**: 数据可重建，通常无需备份
- **Elasticsearch**: 使用快照功能备份索引

### Q: 如何升级版本？

A: 升级步骤：
1. 备份数据库
2. 拉取最新代码
3. 执行数据库迁移：`docker compose exec backend ./migrate`
4. 重启服务：`docker compose up -d`

## 后端问题

### Q: 如何修改 JWT 密钥？

A: 修改 `.env` 中的 `JWT_SECRET` 并重启后端服务。**注意**：修改后所有已登录用户将被登出。

### Q: 数据库迁移失败怎么办？

A: 常见原因和解决方法：
- **连接失败**：检查 PostgreSQL 容器是否运行
- **权限不足**：确认数据库用户有创建表的权限
- **版本冲突**：手动执行 `./migrate` 查看详细错误

### Q: 如何添加新的 API 接口？

A: 按照以下步骤：
1. 在 `internal/model/` 定义请求/响应结构体
2. 在 `internal/service/` 实现业务逻辑
3. 在 `internal/handler/` 实现 HTTP handler
4. 在 `internal/handler/route.go` 注册路由

## 前端问题

### Q: 如何修改主题颜色？

A: 修改 `frontend/tailwind.config.ts` 中的颜色配置，或覆盖 CSS 变量。

### Q: 如何添加新的后台页面？

A: 按照以下步骤：
1. 在 `src/app/(admin)/` 下创建新目录
2. 创建 `page.tsx` 页面组件
3. 在菜单配置中添加对应项

### Q: 前端构建失败？

A: 常见解决方法：
- 删除 `node_modules` 和 `package-lock.json`，重新 `npm install`
- 检查 TypeScript 类型错误：`npx tsc --noEmit`
- 检查 Node 版本：`node -v`（需要 18+）

## 性能优化

### Q: 如何优化数据库查询？

A: 建议：
- 为常用查询字段添加索引
- 使用 GORM 的 `Preload` 谨慎处理关联查询
- 分页查询避免大偏移量
- 使用 Redis 缓存热点数据

### Q: 如何优化前端加载速度？

A: 建议：
- 启用 Next.js 图片优化
- 使用 `dynamic import` 懒加载大组件
- 配置 CDN 加速静态资源
- 启用 gzip/brotli 压缩

## 安全

### Q: 如何启用 HTTPS？

A: 生产环境建议：
- 使用 Nginx/Caddy 作为反向代理
- 配置 SSL 证书（Let's Encrypt 免费证书）
- 或部署在支持 HTTPS 的 PaaS 平台

### Q: 如何修改管理员密码？

A: 登录管理后台，在"个人设置"中修改。修改密码会自动使该用户的所有 JWT Token 失效。

## 其他

### Q: 项目是否支持多语言？

A: 当前版本仅支持中文界面。多语言支持计划在后续版本中实现。

### Q: 如何贡献代码？

A: 请参考 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 还有问题？

如果以上未解决您的问题，请：
- 查看 [故障排查](./troubleshooting.md)
- 提交 [GitHub Issue](https://github.com/yourusername/blog-go-next/issues)
- 查看项目 [Discussion](https://github.com/yourusername/blog-go-next/discussions)
