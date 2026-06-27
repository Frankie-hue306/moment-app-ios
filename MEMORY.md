# MEMORY.md - 长期记忆

## 已学习的 Skills 知识库

通过学习 `.agents/skills/` 目录下的所有 SKILL.md，我掌握了以下能力：

### 🎨 设计类
- **apple-ui-designer** — Apple 人机界面设计规范
- **building-native-ui** — Expo 原生 UI 构建
- **frontend-design** — 前端视觉设计指导（差异化设计、字体、色彩系统）
- **mobile-ios-design** — iOS 移动端设计
- **ui-ux-pro-max** — UI/UX 设计最佳实践
- **brainstorming** — 创意构思流程：先探索→问问题→提方案→写设计文档→再实施

### 📱 移动开发
- **capacitor-push-notifications** — Capacitor 推送通知
- **expo-deployment** — Expo 部署

### 🖥️ 后端/数据库
- **neon-postgres** — Neon Postgres 数据库
- **nodejs-backend-patterns** — Node.js 后端模式
- **prisma-database-setup** — Prisma 数据库设置

### ⚛️ 前端/React
- **react-state-management** — React 状态管理

### 🧪 测试
- **playwright-cli** — 浏览器自动化测试 CLI（Playwright 命令集）
- **test-driven-development** — TDD 红绿重构循环，先写测试再写代码

### 📊 股票/金融
- **a-stock-data** — A股全栈数据工具包（行情/研报/信号/资金面/新闻/公告七层）
- **sector-analyst** — 行业板块轮动分析
- **stock-research-executor** — 8 阶段投资尽调执行引擎

### 🌐 浏览器自动化
- **bb-browser** — 带登录态的浏览器自动化（site 系统支持 36+ 平台）
- **gstack** — 无头浏览器 QA 测试框架

### 📄 文档处理
- **docx** — Word 文档创建/编辑/分析（docx-js + XML 编辑）
- **summarize** — URL/视频/PDF 摘要生成 CLI

### 🎤 多媒体
- **speech-to-text** — ElevenLabs Scribe v2 语音转文字
- **text-to-speech** — ElevenLabs 文字转语音（70+ 语言）
- **camsnap** — RTSP/ONVIF 摄像头抓拍与录制

### 🔧 开发工具
- **skill-creator** — 创建/编辑/验证 SKILL.md 技能文件
- **find-skills** — 发现和安装社区技能
- **self-improve** — 自主进化代码改进引擎（锦标赛选择机制）
- **self-improving-agent** — 通用自我改进代理（多记忆架构）
- **planning-with-files** — 用 Markdown 文件做工作记忆（类 Manus 模式）
- **proactive-agent** — 主动式代理（WAL 协议、工作缓冲区、压缩恢复）
- **firecrawl-scraper** — 深度网页抓取

### 🔐 安全/认证
- **two-factor-authentication-best-practices** — 2FA 最佳实践

### 🌍 其他
- **agency-agents-zh-skill** — 中文代理技能
- **humanizer-zh** — 去除 AI 写作痕迹（中文）
- **using-superpowers** — 如何正确使用 Skills 的规则

---

## v279 改动清单（2026-06-27）
### 后端 (json-server.js)
1. 🔴 **图片改为文件存储** — Base64 不再塞进 db.json，改为写入 `uploads/` 目录，db.json 只存路径
2. 🔴 **验证码登录** — 新增 `/api/sms/send` 接口，6 位验证码 5 分钟有效期；开发模式日志直接显示验证码
3. 🔴 **Token 过期机制** — 新增 `tokenCreatedAt` 字段，90 天有效期，过期自动登出
4. 🔴 **Token 走 Header** — 新增 `x-auth-token` header 方式，不再只依赖 query 参数（同时兼容旧版）
5. 🔴 **数据目录可配** — `DATA` 路径支持 `MOMENT_DATA_DIR` 环境变量覆盖
6. 🟡 **兼容旧数据** — `/api/image/:id` 同时支持新文件路径和旧 dataUrl 两种存储方式

### 前端 (index.html)
1. 🔴 **验证码登录 UI** — 登录页新增验证码输入框 + 获取验证码按钮（60s 倒计时）
2. 🔴 **头像/昵称同步服务器** — 编辑昵称调用 `/api/user/nickname`，登录时从服务器拉取头像昵称
3. 🔴 **图片压缩上传** — 新增 `compressForUpload()` 函数，上传前压缩到 1200px 以内
4. 🔴 **API 地址可配置** — `API` 变量支持 `localStorage('mv_api')` 覆盖，不再硬编码
5. 🟡 **Token 走 header** — `api()` 函数改用 `x-auth-token` header 传输 token
6. 🟢 **版本号统一 v279** — 标题、关于页、landing 页全部同步

### 第二批改动（剩余的）
7. 🟡 **修复前端连续签到算法** — `calcLocalStreak()` 真正按日期排序、逐日检查连续性，而不是简单算首尾天数差
8. 🟢 **图片缓存 LRU 限制** — `_imgCache` 最多 30 条，超出时淘汰最旧并释放 blob URL
9. 🟢 **Gallery 接口修复** — 后端 `/api/gallery` 返回 `imagePath` 格式的 URL，与前端新字段 `imageUrl` 对齐

### 版本号
- 版本从 v278 → v279

### 腾讯云部署
- **服务器**: 81.70.102.36 (Ubuntu 22.04)
- **数据目录**: `/opt/moment/data/`（JSON 文件存储）
- **进程管理**: pm2 (moment-server)
- **Nginx**: 80 → 3000 反代
- **旧数据**: SQLite → JSON 迁移完成（36用户/21动态）

### v279 第二次审查发现的待修复问题（已全部修复）
- ✅ `nextId` 和 `Date.now()` 用户ID冲突
- ✅ avatar 迁移到文件存储
- ✅ Gallery 接口字段名对齐（dataUrl → imageUrl）
- ✅ Nginx 加 gzip + WebSocket
- ✅ sw.js 缓存策略改为 network-first

### v279 第三次审查修复（2026-06-28 全面审计）
- ✅ **后端**
  - Gallery 字段名 `dataUrl` → `imageUrl`（前端对应去掉 `||sm.dataUrl`）
  - Explore 接口增加 `id` 字段（filmstrip 点赞、查看详情正常工作）
  - `/api/stranger` 增加 `id` 字段
  - `imgUrl()` 路径拼接修复：`path.basename()` 提取文件名而非直接拼接
  - Like 兼容旧数据：同时支持 `id` 字段和 `userId+momentId` 匹配
  - 删除第 273-280 行重复的 `/api/image/uploads/:name` 路由
  - 新增 `/api/account/delete` 路由（之前缺失，前端调用会 404）
  - `SAVE()` 函数每次写入前确保目录存在（防止运行时目录被删）
- ✅ **前端**
  - `api()` 函数去掉 `userId=` query 参数（auth 已走 header）
  - 所有 `body` 参数去掉冗余的 `userId`/`token`（共修复 8 处：report/nickname/like/upload/preferences/deleteAccount/photoPublic）
  - `viewStrangerMoment` 和 `viewFilmPhoto` 中的 like query 去掉 `userId=`
  - `refreshGallery` 数据映射去掉 `sm.dataUrl`（只认 `imageUrl`）
- ✅ **SW**
  - `fetch` 事件只处理 GET 请求（不再拦截 POST/PUT/DELETE）
- ✅ **Landing**
  - TestFlight 占位链接替换为真实链接（`WI5dxMFT`）
  - 根目录 `index.html` 版本号 v278 → v279
- ✅ **三端同步**：moment/ + moment-app/www/ + moment-server/public/

## 个人档案
- **语言偏好**: 中文（zh-CN）
- **项目**: Moment App（Capacitor + Web + Node.js + JSON文件存储）
- **技能来源**: `.agents/skills/` 目录（35 个 skills 全部学习完毕）
- **Moment App 审核状态**: 已提交审核（iOS/Android）
