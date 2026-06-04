# 联结·冥想日记 — 技术架构与上架评估报告

> **文档性质**：架构评估与可行性分析  
> **评估日期**：2026-06-03  
> **适用项目**：联结·冥想日记（微信小程序端）  
> **评估范围**：阿里云轻量服务器自建服务端方案、微信小程序个人开发者上架可行性、个体户升级路径

---

## 一、项目概述

联结·冥想日记是一款面向禅修者的个人冥想记录工具，核心功能包括：冥想计时、心情标记（5 类 47 词）、冥想日记按月浏览、统计日历与心情散点图、冥想数据分享。

**当前状态**：纯前端 Demo 实现，8 个静态 HTML 页面，数据存储于 `localStorage`，零后端依赖。**项目尚未发布上架，无存量用户数据。**  
**目标状态**：以微信小程序为唯一终端，阿里云轻量服务器自建后端，支持在线同步与离线使用。

---

## 二、阿里云轻量服务器自建方案

### 2.1 技术栈定版

| 层级 | 选型 | 版本 | 选型理由 |
|------|------|------|----------|
| 运行时 | Node.js | 22 LTS | 长期支持，生态成熟 |
| 后端框架 | Fastify | v5 | Node.js 服务端生态最优，插件丰富（JWT、CORS、限流），结构化日志（Pino）内置 |
| ORM | Drizzle ORM | latest | 轻量（~40KB）、类型安全、SQL-like 语法，无代码生成 |
| 数据库 | PostgreSQL | 16 | JSONB 原生支持（心情数据）、时区处理优于 MySQL |
| 认证 | JWT | — | 小程序不支持 Cookie，JWT 是唯一可行方案 |
| 密码哈希 | bcrypt | — | 12 轮 cost，行业通行标准 |
| 请求校验 | Zod | v3 | Schema 校验，与 Drizzle 共享类型定义 |
| 容器化 | Docker Compose | — | 统一管理 Node + PG + Nginx，环境一致性，迁移简便 |
| 反向代理 | Nginx | latest | API 代理 + SSL 终止 |
| SSL 证书 | Let's Encrypt + certbot | — | 免费自动续签 |
| 前端框架 | uni-app | — | 一套代码输出微信小程序，Vue 语法，条件编译处理平台差异 |

### 2.2 项目结构

```
meditation-diary/
├── miniprogram/                  ← 微信小程序端（uni-app）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index/            ← 首页（时段问候、本周7点、每日金句）
│   │   │   ├── meditate/         ← 冥想准备（类型/时长/提示音）
│   │   │   ├── timer/            ← 计时器（沉浸式）
│   │   │   ├── reflection/       ← 复盘（心情+感悟）
│   │   │   ├── journal/          ← 日记（按月浏览/筛选）
│   │   │   ├── profile/          ← 我的（统计/日历/散点图）
│   │   │   ├── settings/         ← 设置
│   │   │   └── login/            ← 登录页（微信授权 + 邮箱绑定）
│   │   ├── components/           ← 公共组件
│   │   ├── utils/
│   │   │   ├── api.js            ← 后端请求封装
│   │   │   ├── auth.js           ← JWT 管理
│   │   │   ├── store.js          ← 离线存储（wx.setStorageSync）
│   │   │   └── constants.js      ← 类型/心情/提示音常量
│   │   ├── App.vue
│   │   └── main.js
│   ├── static/
│   │   └── audio/                ← 提示音 mp3（~350KB）
│   ├── manifest.json
│   ├── pages.json
│   └── uni.scss
│
├── server/                       ← 后端（Fastify）
│   ├── src/
│   │   ├── index.ts              ← 入口：Fastify app + 路由挂载
│   │   ├── routes/
│   │   │   ├── auth.ts           ← POST /api/auth/register, /login, /refresh
│   │   │   ├── entries.ts        ← CRUD /api/entries
│   │   │   └── settings.ts       ← GET/PUT /api/settings
│   │   ├── middleware/
│   │   │   ├── auth.ts           ← JWT 验证中间件
│   │   │   ├── error.ts          ← 全局错误处理
│   │   │   └── rate-limit.ts     ← 简易限流
│   │   ├── db/
│   │   │   ├── index.ts          ← Drizzle 客户端初始化
│   │   │   ├── schema.ts         ← 表定义
│   │   │   └── migrate.ts        ← 迁移脚本
│   │   └── lib/
│   │       ├── jwt.ts            ← 签发/验证 JWT
│   │       └── password.ts       ← bcrypt 哈希/比对
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                      ← 环境变量（不提交）
│
├── nginx/
│   └── meditation.conf           ← Nginx 配置（仅 API + SSL）
│
├── docker/
│   ├── Dockerfile                ← 后端镜像
│   └── docker-compose.yml        ← 全栈编排
│
├── scripts/
│   ├── deploy.sh                 ← 一键部署
│   └── backup.sh                 ← pg_dump 定时备份
│
└── package.json                  ← workspace 根配置
```

### 2.3 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid      VARCHAR(100) UNIQUE,            -- 微信 openid（主标识）
  email       VARCHAR(255) UNIQUE,            -- 可选绑定邮箱
  password    VARCHAR(255),                   -- bcrypt 哈希（邮箱登录用）
  nickname    VARCHAR(50) DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 冥想记录
CREATE TABLE entries (
  id          VARCHAR(20) PRIMARY KEY,
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
| POST | `/api/auth/wechat` | 微信静默登录（code → openid → JWT） | 无 |
| POST | `/api/auth/register` | 注册/绑定邮箱+密码 | JWT |
| POST | `/api/auth/login` | 邮箱登录 | 无 |
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
| GET | `/api/stats` | 总天数/分钟/连续/本月 | JWT |
| GET | `/api/stats/calendar?month=2026-06` | 月历冥想日标记 | JWT |

### 2.5 认证策略

```
微信登录：POST /api/auth/wechat { code }
  → 调用微信 auth.code2Session 获取 openid
  → openid 存在 → 直接签发 JWT
  → openid 不存在 → 自动创建用户 → 签发 JWT
  → 返回 { access_token, refresh_token, user }

邮箱绑定：POST /api/auth/register { email, password }
  → 当前已登录用户绑定邮箱（用于找回密码）
  → bcrypt.hash → UPDATE users → 返回结果

每次请求：Authorization: Bearer <access_token>
  → jwt.verify → req.user = { id, openid }
  → 所有数据查询 WHERE user_id = req.user.id

Token 策略：
  access_token:  7天有效
  refresh_token: 30天有效
  过期后自动调 /api/auth/refresh 续签
```

### 2.6 离线使用方案

小程序端采用 **"本地优先 + 后台同步"** 策略：

```js
// store.js — 离线兼容
const STORAGE_KEY = 'meditation_entries';

export async function loadEntries(month) {
  // 优先返回本地缓存，同时触发后台同步
  const local = wx.getStorageSync(STORAGE_KEY) || [];
  
  // 网络可用时同步服务端数据
  if (isOnline()) {
    try {
      const server = await api.getEntries(month);
      wx.setStorageSync(STORAGE_KEY, server);
      return server;
    } catch {
      return local; // 同步失败返回本地
    }
  }
  
  return local;
}

export async function saveEntry(entry) {
  // 1. 立即写入本地
  const entries = wx.getStorageSync(STORAGE_KEY) || [];
  entries.unshift(entry);
  wx.setStorageSync(STORAGE_KEY, entries);
  
  // 2. 后台尝试同步
  if (isOnline()) {
    try {
      await api.saveEntry(entry);
    } catch {
      // 同步失败标记待同步队列
      markPendingSync(entry.id);
    }
  } else {
    markPendingSync(entry.id);
  }
}

// 应用启动 / 网络恢复时同步待同步队列
export async function syncPending() {
  const pending = getPendingSync();
  for (const entry of pending) {
    try {
      await api.saveEntry(entry);
      clearPendingSync(entry.id);
    } catch {
      break; // 失败保留在队列
    }
  }
}
```

**离线能力覆盖**：

| 功能 | 离线可用 | 说明 |
|------|----------|------|
| 冥想计时 | ✅ | 纯本地逻辑，无需网络 |
| 心情标记 | ✅ | 本地存储 |
| 日记浏览 | ✅ | 读取本地缓存 |
| 统计/日历 | ✅ | 本地计算 |
| 数据同步 | ⚠️ 需网络 | 网络恢复后自动同步 |
| 首次登录 | ❌ 需网络 | 必须服务端鉴权 |

### 2.7 Docker Compose 部署

```yaml
# docker-compose.yml
services:
  app:
    build: ./server
    environment:
      - DATABASE_URL=postgresql://meditation:xxx@db:5432/meditation_diary
      - WECHAT_APPID=wx20d0d976
      - WECHAT_SECRET=xxx
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
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # API 代理
    location / {
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
    server_name api.your-domain.com;
    return 301 https://$host$request_uri;
}
```

> 注意：Nginx 仅需托管 API，无需托管前端静态文件（小程序代码包在微信客户端运行）。

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
| 服务器 | 阿里云轻量应用服务器 2C2G | 轻量服务器性价比高，预装应用镜像，适合单体部署 |
| 系统盘 | 50G SSD | 轻量服务器标配 |
| 带宽 | 3Mbps 峰值带宽 | 文本 API 为主，流量小 |
| 地域 | 华东1（杭州）/ 华北2（北京） | 靠近用户 |
| OS | Ubuntu 24.04 LTS | 长期支持 |

> **为何选轻量而非 ECS**：
> - 轻量 2C2G 月费约 ¥40-60，比 ECS 1C2G 更便宜
> - 预装 Docker 镜像，一键部署
> - 流量包模式适合 API 低频调用场景
> - 无需额外购买云盘和带宽包

### 2.11 费用估算

| 项目 | 规格 | 月费 |
|------|------|------|
| 阿里云轻量服务器（2C2G） | 3Mbps 峰值带宽 + 50G SSD | ¥40-60 |
| 域名（.com） | — | ¥6 |
| SSL（Let's Encrypt） | — | 免费 |
| OSS 备份（可选） | <1GB | ¥1-3 |
| 微信小程序认证（一次性） | 个人 | ¥0 |
| **合计（月度）** | | **约 ¥50-70/月** |

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

| 能力 | 个人 | 企业/个体户 | 项目是否需要 |
|------|------|-------------|-------------|
| wx.login() 静默登录 | ✅ | ✅ | ✅ 需要 |
| getPhoneNumber 手机号 | ❌ | ✅ | ❌ 不需要 |
| 微信支付 | ❌ | ✅ | ❌ 暂不需要 |
| 分享到朋友圈 | ✅ | ✅ | ❌ 不需要 |
| 订阅消息 | ✅ | ✅ | ⚠️ 可选（冥想提醒）|
| 云开发 | ✅ | ✅ | ❌ 自建后端 |
| 客服消息 | ✅ | ✅ | ❌ 不需要 |
| 广告组件 | ✅ | ✅ | ❌ 不需要 |

**结论**：个人身份完全够用，所需功能均有权限。

### 3.5 小程序特有约束

| 约束 | 影响 | 应对 |
|------|------|------|
| 后台运行 ≤5 分钟 | 锁屏/切后台后计时器暂停 | 本地记录开始时间，回前台计算差值；或提示用户保持前台 |
| 主包 ≤2MB | 音频文件可能超限 | 3 个 mp3 共 ~350KB，远小于限制，可直接打包 |
| wx.request 并发 ≤10 | 冥想日记几乎不可能触发 | 无需处理 |
| localStorage 上限 10MB | 数据量远低于此 | 无需处理 |
| Cookie 不支持 | Session 方案不可用 | 统一用 JWT，wx.request header 携带 |

### 3.6 音频文件策略

| 音频 | 预估大小 | 策略 |
|------|----------|------|
| 木鱼（短促） | ~50KB | 打包进小程序 |
| 引磬（1-2s） | ~100KB | 打包进小程序 |
| 颂钵（3-5s） | ~200KB | 打包进小程序 |
| **合计** | **~350KB** | 远 < 2MB，直接打包 |

---

## 四、个体户升级路径评估

### 4.1 升级触发条件

| 场景 | 说明 |
|------|------|
| 接入微信支付 | 用户购买 VIP 会员、解锁高级功能 |
| 接入手机号登录 | 提升登录转化率，中老年用户更习惯 |
| 开通微信搜一搜品牌专区 | 需要企业/个体户资质 |
| 使用直播组件 | 冥想直播课程 |
| 数据合规要求 | 用户量达到监管关注阈值 |

### 4.2 个体户 vs 个人开发者权限对比

| 能力 | 个人 | 个体户（企业主体） | 升级收益 |
|------|------|-------------------|----------|
| wx.login() | ✅ | ✅ | — |
| 邮箱登录 | ✅ | ✅ | — |
| getPhoneNumber | ❌ | ✅ | 手机号一键登录，转化率提升 |
| 微信支付 | ❌ | ✅ | VIP 会员、付费课程变现 |
| 微信广告 | ❌ | ✅ | 流量变现 |
| 订阅消息 | ✅ | ✅ | — |
| 直播组件 | ❌ | ✅ | 直播冥想课程 |
| 附近的小程序 | ❌ | ✅ | 本地流量曝光 |
| 小程序关联公众号 | 5 个 | 50 个 | 矩阵运营 |

### 4.3 个体户认证流程

```
1. 注册个体工商户（当地市场监管局或线上平台）
   → 营业执照（约 3-7 个工作日）
   → 经营范围：软件开发、互联网信息服务、健康咨询（非医疗）

2. 小程序主体迁移
   → 微信公众平合：设置 → 主体信息 → 账号迁移
   → 需要：原管理员确认 + 新主体营业执照 + 300 元迁移费
   → 迁移期间小程序无法发布新版本（约 1-3 天）

3. 开通微信支付
   → 微信支付商户平台注册（用个体户营业执照）
   → 费率：0.6%（标准）
   → 审核周期：1-7 个工作日

4. 域名备案主体变更
   → 如域名当前备案为个人，需变更为个体户主体
   → 阿里云备案系统提交变更申请
   → 审核周期：7-20 个工作日
```

### 4.4 个体户升级成本

| 项目 | 费用 |
|------|------|
| 个体工商户注册 | ¥0-200（代办费，自办免费） |
| 小程序主体迁移 | ¥300（微信官方） |
| 微信支付开户 | ¥0 |
| 域名备案变更 | ¥0 |
| 会计记账（可选） | ¥100-200/月 |
| **合计（一次性）** | **约 ¥300-500** |

### 4.5 升级建议

| 阶段 | 用户量 | 建议 |
|------|--------|------|
| 冷启动期 | < 1000 | 个人主体足够，聚焦产品打磨 |
| 增长期 | 1000-10000 | 评估付费需求，如有变现计划提前准备个体户注册 |
| 变现期 | > 10000 | 必须升级个体户，开通微信支付和手机号登录 |

> **建议**：个人主体先行上线，积累用户和验证需求。当确认有付费变现计划时，提前 1 个月启动个体户注册和主体迁移，避免影响业务。

---

## 五、风险矩阵

### 5.1 技术风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 1 | JWT 无法主动失效 | 🟡 中 | 用户改密码后旧 token 仍有效 | 改密码时更新用户版本号，JWT 校验版本号；短期 token + 自动续签 |
| 2 | RLS 配置错误 = 数据泄露 | 🟡 中 | Drizzle 不自动启用 RLS | 迁移脚本显式 `enable row level security`，审核每张表策略 |
| 3 | 数据库连接池耗尽 | 🟡 中 | 高并发未设连接池 | Drizzle 显式配置 `max: 20` 连接池 |
| 4 | 离线同步冲突 | 🟡 中 | 多设备同时离线编辑同一记录 | 服务端以最后写入时间为准；或引入版本号机制 |
| 5 | 小程序后台 5 分钟限制 | 🟡 中 | 计时器锁屏后暂停 | 本地记录开始时间，回前台校准 |

### 5.2 审核风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 6 | "冥想"关键词联想宗教 | 🟡 低 | 部分审核员敏感度不一 | 简介强调"记录工具""日记本" |
| 7 | 心情标记涉医疗 | 🟡 低 | 文案不当可能被误判 | UI 标注"自我记录，非诊断" |
| 8 | 类目变更被要求 | 🟢 低 | 审核员建议换类目 | 工具-日记类目匹配度高，概率低 |

### 5.3 运维风险

| # | 风险 | 等级 | 说明 | 应对 |
|---|------|------|------|------|
| 9 | 服务器单点故障 | 🟡 中 | 无负载均衡，单实例 | 阿里云轻量服务器快照 + 自动备份 |
| 10 | 磁盘空间耗尽 | 🟡 中 | 日志/备份未清理 | 日志轮转 + 30 天备份保留策略 |
| 11 | SSL 证书过期 | 🟢 低 | certbot 自动续签，偶有失败 | cron 定时检查证书有效期 |

---

## 六、实施路径

### 阶段 1：后端搭建（当前重点）

| 任务 | 产出 | 预估工时 |
|------|------|----------|
| P0 后端骨架 | server/ 目录 + Fastify + Drizzle + PG 建表 + 基础 CRUD | 3-4 天 |
| P1 认证系统 | 微信登录 + 邮箱绑定 + JWT 中间件 | 1-2 天 |
| P2 API 联调 | 全部接口调通 + 离线同步逻辑 | 2-3 天 |
| P3 部署上线 | 轻量服务器初始化 + Docker Compose + Nginx + SSL | 1-2 天 |

### 阶段 2：小程序开发（后端稳定后启动）

| 任务 | 产出 | 预估工时 |
|------|------|----------|
| uni-app 环境搭建 | 项目初始化 + 微信小程序配置 | 0.5 天 |
| 页面开发 | 8 个页面（复用 Demo 设计稿和逻辑）| 5-7 天 |
| 离线功能 | 本地存储 + 同步队列 + 冲突处理 | 2-3 天 |
| 音频适配 | 小程序音频 API + 提示音打包 | 0.5 天 |
| 分享功能 | `wx.shareAppMessage()` + 图片生成 | 1 天 |
| 提交审核 | 工具-日记类目，准备审核材料 | 0.5 天 |

### 阶段 3：运营迭代

| 任务 | 说明 |
|------|------|
| 数据监控 | PG 查询统计，评估用户增长和服务器负载 |
| 功能迭代 | 基于用户反馈持续优化 |
| 个体户升级 | 确认付费需求后，启动主体迁移和微信支付接入 |

---

## 七、总费用估算

| 项目 | 月费 |
|------|------|
| 阿里云轻量服务器（2C2G） | ¥40-60 |
| 域名（.com） | ¥6 |
| SSL（Let's Encrypt） | 免费 |
| OSS 备份（可选） | ¥1-3 |
| 微信小程序认证（一次性） | ¥0（个人） |
| **合计（月度）** | **约 ¥50-70/月** |

---

## 八、最终可行性结论

| 维度 | 结论 |
|------|------|
| **阿里云轻量服务器自建** | ✅ 完全可行。轻量服务器性价比高，Docker Compose 部署标准化，月费 ¥50-70 |
| **微信小程序上架** | ✅ 完全可行。硬门槛满足，类目匹配度高，个人开发者权限足够，审核风险可控 |
| **离线使用** | ✅ 可行。本地优先 + 后台同步，计时/记录/浏览均支持离线 |
| **个体户升级** | ✅ 路径清晰。个人先行，付费需求确认后迁移，成本约 ¥300-500 |
| **最大工作量** | 小程序开发（uni-app），约 7-10 天 |
| **最大风险** | JWT 无法主动失效（可控，通过版本号机制缓解） |
| **建议启动时机** | 现在即可开始 P0 阶段（后端骨架搭建） |

---

## 九、关键决策清单

| # | 决策项 | 建议 | 状态 |
|---|--------|------|------|
| 1 | 后端框架 | Fastify | 待确认 |
| 2 | 认证方案 | JWT（微信静默登录为主，邮箱可选绑定） | 已确认 |
| 3 | 容器化 | Docker Compose | 待确认 |
| 4 | 服务器 | 阿里云轻量服务器 2C2G | 已确认 |
| 5 | 前端框架 | uni-app（仅微信小程序） | 已确认 |
| 6 | 离线能力 | 本地优先 + 后台同步 | 已确认 |
| 7 | 手机号登录 | 否（个人开发者无权限，个体户后可接入） | 已确认 |
| 8 | 微信支付 | 否（个体户后接入） | 已确认 |
| 9 | 小程序音频策略 | 打包进主包（~350KB < 2MB） | 已确认 |
| 10 | 旧数据迁移 | 不需要（项目未发布，无存量用户） | 已确认 |

---

*本报告基于 2026-06-03 的技术环境评估，后续如有政策或技术栈变更，需重新评估。*
