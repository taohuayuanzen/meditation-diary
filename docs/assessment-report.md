# 联结·冥想日记 — 技术架构与上架评估报告

> **文档性质**：架构评估与可行性分析  
> **评估日期**：2026-06-03  
> **适用项目**：联结·冥想日记（H5 + 微信小程序）  
> **评估范围**：阿里云自建服务端方案、微信小程序个人开发者上架可行性

---

## 一、项目概述

联结·冥想日记是一款面向禅修者的个人冥想记录工具，核心功能包括：冥想计时、心情标记（5 类 47 词）、冥想日记按月浏览、统计日历与心情散点图、冥想数据分享。

**当前状态**：纯前端实现，数据存储于 `localStorage`，零后端依赖。  
**目标状态**：后端服务化 + 微信小程序上架，支持多端数据同步。

---

## 二、阿里云自建服务端方案

### 2.1 技术栈定版

| 层级 | 选型 | 版本 | 选型理由 |
|------|------|------|----------|
| 运行时 | Node.js | 22 LTS | 长期支持，生态成熟 |
| 后端框架 | Fastify | v5 | Node.js 服务端生态最优，插件丰富（JWT、CORS、限流），结构化日志（Pino）内置 |
| ORM | Drizzle ORM | latest | 轻量（~40KB）、类型安全、SQL-like 语法，无代码生成 |
| 数据库 | PostgreSQL | 16 | JSONB 原生支持（心情数据）、时区处理优于 MySQL |
| 认证 | JWT | — | 跨平台统一（H5 + 小程序均不支持 Cookie，JWT 是唯一可行方案） |
| 密码哈希 | bcrypt | — | 12 轮 cost，行业通行标准 |
| 请求校验 | Zod | v3 | Schema 校验，与 Drizzle 共享类型定义 |
| 容器化 | Docker Compose | — | 统一管理 Node + PG + Nginx，环境一致性，迁移简便 |
| 反向代理 | Nginx | latest | 静态托管 + API 代理 + SSL 终止 |
| SSL 证书 | Let's Encrypt + certbot | — | 免费自动续签 |
| 前端构建 | Vite | v6 | 原生 JS 项目打包成本最低 |

> **架构师决策变更说明**：JWT 在单服务器场景下不如 Session 安全，但考虑到跨平台兼容性（小程序不支持 Cookie），JWT 是唯一可行方案。后续可通过短 token 有效期 + refresh token 轮换机制降低风险。

### 2.2 项目结构

```
meditation-diary/
├── client/                     ← 前端（Vite 构建）
│   ├── index.html              ← 首页
│   ├── meditate.html           ← 冥想准备
│   ├── timer.html              ← 计时器
│   ├── reflection.html         ← 复盘
│   ├── journal.html            ← 日记
│   ├── profile.html            ← 我的
│   ├── settings.html           ← 设置
│   ├── type-prefs.html         ← 类型偏好
│   ├── login.html              ← 登录页（新增）
│   ├── register.html           ← 注册页（新增）
│   ├── css/
│   │   ├── style.css
│   │   └── icons.css
│   ├── js/
│   │   ├── constants.js
│   │   ├── api.js              ← 新增：后端请求封装
│   │   ├── auth.js             ← 新增：JWT 管理
│   │   ├── store.js            ← 改造：localStorage → api.js
│   │   ├── session.js          ← 保留：页面间状态桥接
│   │   ├── utils.js
│   │   ├── audio.js
│   │   ├── home.js
│   │   ├── meditate.js
│   │   ├── timer.js
│   │   ├── reflection.js
│   │   ├── journal.js
│   │   ├── profile.js
│   │   └── settings.js
│   ├── audio/
│   └── vite.config.js
│
├── server/                     ← 后端（Fastify）
│   ├── src/
│   │   ├── index.ts            ← 入口：Fastify app + 路由挂载
│   │   ├── routes/
│   │   │   ├── auth.ts         ← POST /api/auth/register, /login, /refresh
│   │   │   ├── entries.ts      ← CRUD /api/entries
│   │   │   └── settings.ts     ← GET/PUT /api/settings
│   │   ├── middleware/
│   │   │   ├── auth.ts         ← JWT 验证中间件
│   │   │   ├── error.ts        ← 全局错误处理
│   │   │   └── rate-limit.ts   ← 简易限流
│   │   ├── db/
│   │   │   ├── index.ts        ← Drizzle 客户端初始化
│   │   │   ├── schema.ts       ← 表定义
│   │   │   └── migrate.ts      ← 迁移脚本
│   │   └── lib/
│   │       ├── jwt.ts          ← 签发/验证 JWT
│   │       └── password.ts     ← bcrypt 哈希/比对
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                    ← 环境变量（不提交）
│
├── nginx/
│   └── meditation.conf         ← Nginx 配置
│
├── docker/
│   ├── Dockerfile              ← 后端镜像
│   └── docker-compose.yml      ← 全栈编排
│
├── scripts/
│   ├── deploy.sh               ← 一键部署
│   ├── backup.sh               ← pg_dump 定时备份
│   └── setup-server.sh         ← 服务器初始化
│
└── package.json                ← workspace 根配置
```

### 2.3 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt 哈希
  nickname    VARCHAR(50) DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 冥想记录
CREATE TABLE entries (
  id          VARCHAR(20) PRIMARY KEY,         -- 保持原 ID 格式
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TIMESTAMPTZ NOT NULL,
  type        VARCHAR(50) NOT NULL,
  mood_before JSONB,
  mood_after  JSONB,
  duration    INTEGER NOT NULL,
  insight     TEXT DEFAULT '',
  sound       VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 用户设置
CREATE TABLE user_settings (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled_types JSONB NOT NULL DEFAULT '[]',
  last_setup    JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_entries_user_date ON entries(user_id, date DESC);
CREATE INDEX idx_entries_user_type ON entries(user_id, type);
```

### 2.4 API 设计

#### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册（邮箱+密码） | 无 |
| POST | `/api/auth/login` | 登录，返回 JWT | 无 |
| POST | `/api/auth/refresh` | 刷新 access_token | refresh_token |
| POST | `/api/auth/logout` | 登出 | JWT |

#### 冥想记录

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/entries?month=2026-06` | 按月查询 | JWT |
| POST | `/api/entries` | 新增记录 | JWT |
| GET | `/api/entries/:id` | 单条记录 | JWT + 属主校验 |
| DELETE | `/api/entries/:id` | 删除记录 | JWT + 属主校验 |

#### 设置与统计

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/settings` | 获取用户设置 | JWT |
| PUT | `/api/settings` | 更新设置 | JWT |
| PUT | `/api/settings/last-setup` | 更新上次选择 | JWT |
| GET | `/api/stats` | 总天数/分钟/连续/本月 | JWT |
| GET | `/api/stats/calendar?month=2026-06` | 月历冥想日标记 | JWT |

### 2.5 认证策略

```
注册：POST /api/auth/register { email, password, nickname }
  → bcrypt.hash(password, 12) → INSERT users → 签发 JWT
  → 返回 { access_token, refresh_token, user }

登录：POST /api/auth/login { email, password }
  → SELECT user → bcrypt.compare → 签发 JWT
  → 返回 { access_token, refresh_token, user }

每次请求：Authorization: Bearer <access_token>
  → jwt.verify → req.user = { id, email }
  → 所有数据查询 WHERE user_id = req.user.id

Token 策略：
  access_token:  7天有效
  refresh_token: 30天有效
  过期后前端自动调 /api/auth/refresh 续签
```

### 2.6 前端改造要点

**api.js — 请求封装（跨平台统一）**

```js
const API_BASE = '/api';

async function request(path, options = {}) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request(path, options);
    redirectToLogin();
    return;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

**离线兼容策略**

```js
export async function loadEntries() {
  try {
    const data = await api.getEntries(currentMonth);
    localStorage.cache('entries', data);   // 成功时缓存
    return data;
  } catch {
    return localStorage.cache('entries');   // 离线回退
  }
}
```

### 2.7 Docker Compose 部署

```yaml
# docker-compose.yml
services:
  app:
    build: ./server
    environment:
      - DATABASE_URL=postgresql://meditation:xxx@db:5432/meditation_diary
    depends_on:
      - db
    restart: always
    ports:
      - "127.0.0.1:3000:3000"

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./client/dist:/var/www/meditation
      - certbot-data:/etc/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    restart: always

volumes:
  pgdata:
  certbot-data:
```

### 2.8 Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/meditation/client/dist;
        try_files $uri $uri/ /index.html;
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 2.9 数据库备份

```bash
#!/bin/bash
# backup.sh — cron 每日 3:00 执行
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="meditation_diary_${TIMESTAMP}.sql.gz"

pg_dump -U meditation meditation_diary | gzip > "${BACKUP_DIR}/${FILENAME}"
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete
# ossutil cp ${BACKUP_DIR}/${FILENAME} oss://your-bucket/backups/
```

### 2.10 服务器规格建议

| 项目 | 推荐规格 | 说明 |
|------|----------|------|
| ECS | 1C2G（ecs.t6-c1m2.large） | 初始配置，可在线升配 |
| 系统盘 | 40G SSD | 数据量小，暂不需数据盘 |
| 带宽 | 3Mbps 固定 | 文本 API 为主，流量小 |
| 地域 | 华东1（杭州）/ 华北2（北京） | 靠近用户 |
| OS | Ubuntu 24.04 LTS | 长期支持 |

### 2.11 费用估算

| 项目 | 规格 | 月费 |
|------|------|------|
| ECS | 1C2G / 3Mbps | ¥60-90 |
| 域名 | .com | ¥6/月 |
| SSL | Let's Encrypt | 免费 |
| OSS 备份 | <1GB | ¥1-3 |
| **合计** | | **约 ¥70-100/月** |

---

## 三、微信小程序上架评估

### 3.1 硬门槛核验

| 条件 | 项目情况 | 小程序要求 | 结论 |
|------|----------|-----------|------|
| ICP 备案 | ✅ 已完成 | 必须 | 通过 |
| HTTPS | ✅ Nginx + Let's Encrypt | 全链路 HTTPS | 通过 |
| 域名白名单 | 可添加 | 最多 20 个 | 通过 |
| 实名认证 | 个人身份证 | 必须 | 通过 |

### 3.2 类目选择

| 功能 | 对应类目 | 个人可否 | 备注 |
|------|----------|----------|------|
| 冥想活动记录 | 工具 → 日记 | ✅ | 核心功能 |
| 日记浏览（按月/筛选） | 工具 → 日记 | ✅ | 纯个人工具 |
| 冥想数据分享 | 工具 → 效率 | ✅ | 结构化数据分享，非社交 |
| 提示音播放 | 工具 → 效率 | ✅ | 功能音效 |
| 心情标记 | 工具 → 日记 | ✅ | 自我记录，非诊断 |
| 统计/日历/散点图 | 工具 → 效率 | ✅ | 数据可视化 |
| 计时器 | 工具 → 效率 | ✅ | 计时功能 |

**推荐主类目**：工具 → 日记

### 3.3 审核风险排查

| 风险点 | 触发条件 | 项目情况 | 风险等级 | 应对 |
|--------|----------|----------|----------|------|
| "冥想"关键词联想宗教 | 应用名/简介含"修行""禅修" | 品牌名"联结"，简介强调"记录工具" | 🟡 低 | 简介用"记录工具""日记本"，避免"修行""觉醒" |
| 心情选择器涉医疗 | 标注"情绪评估""心理分析" | 文案用"此刻感受"，无分析结论 | 🟡 低 | UI 明确标注"自我记录，非诊断" |
| 数据分享涉 UGC | 分享用户生成内容 | 仅冥想数据（结构化图表），不含 UGC 文字 | 🟢 无 | 冥想数据分享不涉及 UGC 审查 |
| 音频涉引导语 | 含冥想引导/催眠内容 | 提示音（木鱼/引磬/颂钵），非引导语 | 🟢 无 | 功能音效，不触发审查 |
| 社交功能 | 关注/组队/社区 | 明确无 | 🟢 无 | 无社交功能，降低审核复杂度 |
| 医疗属性 | 诊断/治疗/咨询 | 明确无 | 🟢 无 | 纯记录工具，不涉及健康指导 |

**审核提交文案建议**：

```
小程序名称：联结冥想日记
简介：个人冥想记录工具，记录冥想时长与心情变化
类目：工具-日记
描述：纯本地记录工具，帮助用户记录每日冥想活动，
     包括冥想类型、时长、前后心情标记，支持月度回顾。
     无社交功能，无健康指导，所有数据仅限个人查看。
```

### 3.4 个人开发者功能权限

| 能力 | 个人 | 企业 | 项目是否需要 |
|------|------|------|-------------|
| wx.login() 静默登录 | ✅ | ✅ | ✅ 需要 |
| getPhoneNumber 手机号 | ❌ | ✅ | ❌ 不需要 |
| 微信支付 | ❌ | ✅ | ❌ 不需要 |
| 分享到朋友圈 | ✅ | ✅ | ❌ 不需要 |
| 订阅消息 | ✅ | ✅ | ⚠️ 可选（冥想提醒）|
| 云开发 | ✅ | ✅ | ❌ 自建后端 |
| 客服消息 | ✅ | ✅ | ❌ 不需要 |
| 广告组件 | ✅ | ✅ | ❌ 不需要 |

**结论**：个人身份完全够用，所需功能均有权限。

### 3.5 小程序特有约束

| 约束 | 影响 | 应对 |
|------|------|------|
| 后台运行 ≤5 分钟 | 锁屏/切后台后计时器暂停 | 服务端记录开始时间，回前台计算差值；或提示用户保持前台 |
| 主包 ≤2MB | 音频文件可能超限 | 3 个 mp3 共 ~350KB，远小于限制，可直接打包 |
| wx.request 并发 ≤10 | 冥想日记几乎不可能触发 | 无需处理 |
| localStorage 上限 10MB | 数据量远低于此 | 无需处理 |
| Cookie 不支持 | Session + Cookie 方案不可用 | 统一用 JWT，wx.request header 携带 |

### 3.6 音频文件策略

| 音频 | 预估大小 | 策略 |
|------|----------|------|
| 木鱼（短促） | ~50KB | 打包进小程序 |
| 引磬（1-2s） | ~100KB | 打包进小程序 |
| 颂钵（3-5s） | ~200KB | 打包进小程序 |
| **合计** | **~350KB** | 远 < 2MB，直接打包 |

---

## 四、跨平台统一技术方案

### 4.1 认证统一：JWT

| 场景 | 认证方式 | 原因 |
|------|----------|------|
| H5 网页 | JWT（Authorization header） | 浏览器原生支持 |
| 微信小程序 | JWT（wx.request header） | 小程序不支持 Cookie，JWT 是唯一可行方案 |

> **决策说明**：JWT 在单服务器场景下不如 Session 安全，但跨平台约束使 JWT 成为必要选择。通过短有效期（7 天）+ refresh token（30 天）+ 自动续签机制控制风险。

### 4.2 前端架构：uni-app

| 方案 | H5 复用 | 小程序复用 | 维护成本 | 推荐 |
|------|---------|-----------|---------|------|
| 原生 WXML 重写 | 0% | 100% | 两套代码 | ❌ |
| uni-app | ~80% | 100% | 一套代码 | ✅ |
| Taro | ~80% | 100% | 一套代码 | ⚠️ |

**推荐 uni-app**：
- Vue 语法，学习成本低
- 原生 JS 迁移到 Vue 比 React（Taro）更自然
- 社区最大，冥想类小程序案例丰富
- 条件编译处理平台差异：`#ifdef H5` / `#ifdef MP-WEIXIN`

### 4.3 平台差异适配

| 功能 | H5 方案 | 小程序方案 |
|------|---------|-----------|
| 登录 | 邮箱+密码表单 | wx.login() → openid → 自动创建/关联账号 |
| 音频播放 | `<audio>` / Web Audio | `wx.createInnerAudioContext()` |
| 数据缓存 | localStorage | `wx.setStorageSync()` |
| 分享 | Canvas 生成图 + 复制 | `wx.shareAppMessage()` + `wx.saveImageToPhotosAlbum()` |
| 计时器 | setInterval | setInterval（需处理后台限制） |

---

## 五、风险矩阵

### 5.1 技术风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 1 | JWT 无法主动失效 | 🟡 中 | 用户改密码后旧 token 仍有效 | 改密码时更新用户版本号，JWT 校验版本号；短期 token + 自动续签 |
| 2 | RLS 配置错误 = 数据泄露 | 🟡 中 | Drizzle 不自动启用 RLS | 迁移脚本显式 `enable row level security`，审核每张表策略 |
| 3 | 数据库连接池耗尽 | 🟡 中 | 高并发未设连接池 | Drizzle 显式配置 `max: 20` 连接池 |
| 4 | 旧用户 localStorage 数据迁移 | 🟡 中 | 现有用户数据需导入服务端 | 提供一次性导出/导入工具，JSON 格式 |
| 5 | 邮箱验证邮件进垃圾箱 | 🟡 中 | 国内邮件服务商过滤严格 | 注册后立即可用，邮箱验证仅用于找回密码 |
| 6 | 小程序后台 5 分钟限制 | 🟡 中 | 计时器锁屏后暂停 | 服务端记录开始时间，回前台校准 |

### 5.2 审核风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 7 | "冥想"关键词联想宗教 | 🟡 低 | 部分审核员敏感度不一 | 简介强调"记录工具""日记本" |
| 8 | 心情标记涉医疗 | 🟡 低 | 文案不当可能被误判 | UI 标注"自我记录，非诊断" |
| 9 | 类目变更被要求 | 🟢 低 | 审核员建议换类目 | 工具-日记类目匹配度高，概率低 |

### 5.3 运维风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 10 | 服务器单点故障 | 🟡 中 | 无负载均衡，单实例 | 阿里云 ECS 快照 + 自动备份；PM2 崩溃重启 |
| 11 | 磁盘空间耗尽 | 🟡 中 | 日志/备份未清理 | 日志轮转 + 30 天备份保留策略 |
| 12 | SSL 证书过期 | 🟢 低 | certbot 自动续签，偶有失败 | cron 定时检查证书有效期，过期前告警 |

---

## 六、实施路径

### 阶段 1：H5 服务端化（当前重点）

| 任务 | 产出 | 预估工时 |
|------|------|----------|
| P0 后端骨架 | server/ 目录 + Fastify + Drizzle + PG 建表 + 基础 CRUD | 3-4 天 |
| P1 认证系统 | 注册/登录/JWT 中间件 + 前端 login/register 页面 | 1-2 天 |
| P2 数据对接 | store.js → api.js 改造 + 离线兼容 | 2-3 天 |
| P3 部署上线 | ECS 初始化 + Docker Compose + Nginx + SSL | 1-2 天 |
| P4 旧数据迁移 | localStorage 导出 → 导入工具 | 1 天 |

### 阶段 2：微信小程序（H5 稳定后启动）

| 任务 | 产出 | 预估工时 |
|------|------|----------|
| uni-app 环境搭建 | 项目初始化 + Vite 适配 | 0.5 天 |
| 页面迁移 | 8 个页面 → uni-app 组件（复用设计稿和 JS 逻辑）| 3-4 天 |
| 登录改造 | wx.login() 替代邮箱登录（保留邮箱绑定做跨端）| 1 天 |
| 音频适配 | 小程序音频 API 替换 | 0.5 天 |
| 分享功能 | `wx.shareAppMessage()` + `wx.saveImageToPhotosAlbum()` | 1 天 |
| 提交审核 | 工具-日记类目，准备审核材料 | 0.5 天 |

### 阶段 3：统一维护

| 任务 | 说明 |
|------|------|
| 后端 API 迭代 | 统一服务 H5 + 小程序，无需分叉 |
| 前端条件编译 | uni-app `#ifdef` 处理平台差异 |
| 用户量监控 | PG 查询统计，评估升配时机 |
| 企业主体升级 | 用户量/付费需求触发后，迁移至企业号 |

---

## 七、总费用估算

| 项目 | 月费 |
|------|------|
| 阿里云 ECS（1C2G / 3Mbps） | ¥60-90 |
| 域名（.com） | ¥6 |
| SSL（Let's Encrypt） | 免费 |
| OSS 备份 | ¥1-3 |
| 微信小程序认证（一次性） | ¥0（个人） |
| **合计（月度）** | **约 ¥70-100/月** |

---

## 八、最终可行性结论

| 维度 | 结论 |
|------|------|
| **阿里云自建服务端** | ✅ 完全可行。技术选型成熟，Docker Compose 部署标准化，1C2G 起步足够，月费可控 |
| **微信小程序上架** | ✅ 完全可行。硬门槛满足，类目匹配度高，个人开发者权限足够，审核风险可控 |
| **跨平台统一** | ✅ 可行。uni-app 一套代码双端输出，JWT 认证双端兼容，后端 API 零分叉 |
| **最大工作量** | 前端重写（uni-app），约 3-4 天 |
| **最大风险** | JWT 无法主动失效（可控，通过版本号机制缓解） |
| **建议启动时机** | 现在即可开始 P0 阶段（后端骨架搭建） |

---

## 九、关键决策清单

| # | 决策项 | 建议 | 状态 |
|---|--------|------|------|
| 1 | 后端框架 | Fastify（替代 Hono） | 待确认 |
| 2 | 认证方案 | JWT（替代 Session） | 已确认（跨平台约束） |
| 3 | 容器化 | Docker Compose（替代 PM2） | 待确认 |
| 4 | ECS 起步规格 | 1C2G（替代 2C4G） | 待确认 |
| 5 | 前端跨端框架 | uni-app（替代原生重写） | 待确认 |
| 6 | 是否保留离线能力 | 是（localStorage 缓存 + API 优先） | 已确认 |
| 7 | 是否支持手机号登录 | 否（个人开发者无权限） | 已确认 |
| 8 | 是否接入微信支付 | 否（个人开发者无权限） | 已确认 |
| 9 | 小程序音频策略 | 打包进主包（~350KB < 2MB） | 已确认 |
| 10 | 旧用户数据迁移 | 提供一次性 JSON 导出/导入工具 | 待确认 |

---

*本报告基于 2026-06-03 的技术环境评估，后续如有政策或技术栈变更，需重新评估。*
