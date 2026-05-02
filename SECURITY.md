# 安全策略 | Security Policy

**中文** | [English](#english)

## 报告漏洞

如果您发现了安全漏洞，请 **不要** 在公开的 Issue 或讨论区中披露。

请通过以下方式私下报告：

- **邮箱**: [security@example.com]（请替换为实际邮箱）
- **主题**: `[SECURITY] Blog Go Next - 漏洞描述`

我们会在 48 小时内确认收到报告，并在 7 天内提供初步评估和修复时间表。

## 支持的版本

| 版本 | 支持状态 |
|------|----------|
| main 分支 | ✅ 活跃支持 |
| 最新 Release | ✅ 活跃支持 |
| 旧版本 | ❌ 仅接受严重漏洞修复 |

## 安全特性

本项目实现了以下安全机制：

### 认证与授权

- **JWT 认证**：访问令牌 6 小时有效期，支持主动撤销（Token Version 机制）
- **RBAC 权限**：基于 Casbin 的角色访问控制，Admin 角色可绕过所有检查
- **密码安全**：bcrypt 哈希存储，密码最小 8 字符

### 请求保护

- **速率限制**：
  - `/register`: 3 次/分钟
  - `/login`: 5 次/分钟
  - `/users/code`: 10 次/小时
  - 基于 Redis Lua 原子脚本实现，fail-open 策略
- **CORS**：已配置跨域策略
- **输入验证**：所有 HTTP 请求均经过参数绑定和校验

### 数据保护

- **SQL 注入防护**：使用 GORM 参数化查询
- **XSS 防护**：前端使用 React 自动转义，后端对富文本进行过滤
- **文件上传**：MIME 嗅探 + 扩展名白名单，**无病毒扫描**（生产环境建议增加）
- **敏感信息**：禁止在日志中输出密码、Token 等敏感字段

### 基础设施

- **Docker Compose**：所有服务隔离运行
- **环境变量**：JWT_SECRET 必须通过 `.env` 注入，缺失则拒绝启动
- **数据库**：PostgreSQL 独立容器，默认不暴露公网

## 已知限制

- 文件上传 **无病毒扫描**，生产环境建议增加 ClamAV 等扫描服务
- 大图上传 **无自动压缩**，建议配合 CDN 图片处理
- Elasticsearch IK 分词器 **未预装**，中文搜索可能不够精准

## 负责任披露

我们承诺：

1. **及时响应**：48 小时内确认收到报告
2. **透明沟通**：定期更新修复进度
3. **致谢**：在修复后公开致谢报告者（经其同意）
4. **不追究**：对遵守本政策的善意安全研究人员不采取法律行动

## 安全更新

安全修复将通过以下渠道发布：

1. GitHub Security Advisories
2. Release Notes 中的 `Security` 标签
3. 项目主页公告

---

<a name="english"></a>

## Reporting Vulnerabilities

If you discover a security vulnerability, please **do not** disclose it in public issues or discussions.

Please report privately via:

- **Email**: [security@example.com] (replace with actual email)
- **Subject**: `[SECURITY] Blog Go Next - Vulnerability Description`

We will acknowledge receipt within 48 hours and provide an initial assessment and fix timeline within 7 days.

## Supported Versions

| Version | Support Status |
|---------|---------------|
| main branch | ✅ Actively supported |
| Latest Release | ✅ Actively supported |
| Older versions | ❌ Critical fixes only |

## Security Features

This project implements the following security mechanisms:

### Authentication & Authorization

- **JWT Authentication**: 6-hour access token expiry with active revocation (Token Version mechanism)
- **RBAC**: Role-based access control via Casbin, Admin role bypasses all checks
- **Password Security**: bcrypt hashing, minimum 8 characters

### Request Protection

- **Rate Limiting**:
  - `/register`: 3/min
  - `/login`: 5/min
  - `/users/code`: 10/hour
  - Redis Lua atomic script, fail-open strategy
- **CORS**: Configured cross-origin policy
- **Input Validation**: All HTTP requests undergo parameter binding and validation

### Data Protection

- **SQL Injection Prevention**: GORM parameterized queries
- **XSS Prevention**: React automatic escaping on frontend, rich text filtering on backend
- **File Upload**: MIME sniffing + extension whitelist, **no virus scanning** (recommended for production)
- **Sensitive Data**: Passwords, tokens, and other sensitive fields are prohibited from logs

### Infrastructure

- **Docker Compose**: All services run in isolation
- **Environment Variables**: JWT_SECRET must be injected via `.env`, startup fails if missing
- **Database**: PostgreSQL in isolated container, not exposed to public network by default

## Known Limitations

- File uploads have **no virus scanning**; consider adding ClamAV for production
- Large image uploads have **no automatic compression**; consider CDN image processing
- Elasticsearch IK analyzer **not pre-installed**; Chinese search may be less precise

## Responsible Disclosure

We commit to:

1. **Timely Response**: Acknowledge reports within 48 hours
2. **Transparent Communication**: Regular updates on fix progress
3. **Credit**: Publicly acknowledge reporters (with their consent)
4. **No Legal Action**: No legal action against good-faith security researchers following this policy

## Security Updates

Security fixes will be released through:

1. GitHub Security Advisories
2. `Security` labels in Release Notes
3. Project homepage announcements
