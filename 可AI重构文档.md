# pixelflux 可AI重构文档

> **元信息**
> - **一句话定位**：Pixelflux 是一个"一份订阅、所有模型"的 AI 视频生成 SaaS Web 应用（Next.js 16 App Router + Supabase 鉴权 + fal.ai 视频生成 Provider 抽象层），当前为 MVP 阶段：落地页 + 生成工作台 + 生成详情页 + 10 个 API 端点。
> - **生成日期**：2026-07-28
> - **复现深度**：精确级（单凭本文档，AI 可完全复现该项目的全部源码行为、目录结构、依赖版本与配置）
> - **与现有文档的关系**：`README.md` 为 create-next-app 默认模板文档（无项目特定信息，可忽略）；`AGENTS.md` 仅提示"本项目使用 Next.js 16，API 约定可能与训练数据不同，写代码前应查阅 `node_modules/next/dist/docs/`"；`CLAUDE.md` 为空文件（0 字节）。本文档为唯一权威复现依据，与上述文件冲突时以本文档为准。
> - **密钥零收录声明**：本文档不含任何真实密钥/令牌/连接串。`.env.example` 全部键位仅含空占位值，逐字收录于第 2 章。仓库中若存在真实 `.env` 文件（`.gitignore` 已忽略 `.env*`），本文档生成过程未读取。

---

## 1. 项目概述

### 1.1 定位

Pixelflux 是一个 AI 视频生成聚合平台：用户用一个账号（Google OAuth 登录）访问多个上游 AI 视频模型（Kling / Veo / Seedance / Hailuo / Wan / Sora），按 Credits 计费（`creditsPerSecond × duration`）。当前代码实现的真实边界：

- **已实现**：落地页（营销页）、生成工作台（左参数面板 + 右预览区）、生成详情页、Google OAuth 登录闭环、模型注册表（6 个模型硬编码配置）、fal.ai Provider（含无 Key 时的 Mock 模式）、内存版生成记录存储、Credits 余额检查与扣减（读写 Supabase `users` 表）、react-query 轮询机制、37 个 Vitest 测试用例。
- **声明但未实现**（依赖已装/环境变量已留位，但源码零调用）：R2 存储上传、Creem 支付、Resend 邮件、Sentry 监控、next-intl 国际化、zod 校验、react-hook-form 表单。
- **数据层现状**：生成记录存于**进程内存 Map**（重启即失）；Supabase 仅实际读写 `users` 表，但 `types/supabase/index.ts` 已定义 6 张表的完整类型（详见第 4 章）；**仓库内无任何 migration 文件，线上 schema 需导出补录**。

### 1.2 编号功能清单

| 编号 | 功能 | 状态 | 关键文件 |
|---|---|---|---|
| F01 | 落地页（Hero/模型走马灯/特性/用例/流程/FAQ/CTA） | ✅ 已实现 | `src/app/page.tsx` |
| F02 | Google OAuth 登录（发起→回调换 session→跳转 /generate） | ✅ 已实现 | `src/app/api/auth/login/route.ts`、`callback/route.ts` |
| F03 | 登出（signOut + 重定向首页） | ✅ 已实现 | `src/app/api/auth/logout/route.ts` |
| F04 | 当前用户信息查询 | ✅ 已实现 | `src/app/api/auth/me/route.ts` |
| F05 | 全站会话刷新中间件（@supabase/ssr cookie 续期） | ✅ 已实现 | `src/middleware.ts`、`src/lib/supabase/middleware.ts` |
| F06 | 模型列表 API（6 个硬编码模型配置） | ✅ 已实现 | `src/app/api/models/route.ts`、`src/lib/providers/registry.ts` |
| F07 | 发起视频生成（校验→查余额→调 Provider→建记录→扣 Credits） | ✅ 已实现 | `src/app/api/generate/route.ts` |
| F08 | 生成记录列表（分页） | ✅ 已实现（内存版） | `src/app/api/generations/route.ts` |
| F09 | 生成记录详情/状态轮询（处理中时回查 Provider 并落地状态） | ✅ 已实现 | `src/app/api/generations/[id]/route.ts` |
| F10 | 删除生成记录 | ✅ 已实现（内存版） | 同上（DELETE handler） |
| F11 | 生成工作台页（模型选择/Prompt/宽高比/时长/风格/状态机） | ✅ 已实现 | `src/app/generate/page.tsx` |
| F12 | 生成详情页（视频播放/下载/复制 Prompt/删除/重试） | ✅ 已实现 | `src/app/generate/[id]/page.tsx` |
| F13 | fal.ai Provider（真实 API 调用 + Mock 模式 8–15s 模拟完成、5% 失败率） | ✅ 已实现 | `src/lib/providers/fal.ts` |
| F14 | Credits 不足 402 / 未登录 401 / 限流 429 等统一错误协议 | ✅ 已实现 | `src/lib/require-auth.ts` |
| F15 | 订阅/支付（Creem）、Credits 充值 | ❌ 未实现（仅表类型与 env 占位） | — |
| F16 | R2 视频持久化存储 | ❌ 未实现（仅 env 占位） | — |
| F17 | 邮件（Resend）、监控（Sentry）、i18n（next-intl） | ❌ 未实现（仅依赖/env 占位） | — |
| F18 | 模板库（templates 表） | ❌ 未实现（仅表类型定义） | — |
| F19 | 单元/组件测试（37 用例，5 个测试文件） | ✅ 已实现 | `**/__tests__/*` |

---

## 2. 技术栈与环境

### 2.1 精确版本表（逐字对应 package.json）

**dependencies：**

| 包 | 版本 | 在本项目中的实际用途 |
|---|---|---|
| `@hookform/resolvers` | `^5.2.2` | ⚠️ 已安装未使用 |
| `@supabase/ssr` | `^0.10.3` | 浏览器/服务端/中间件三种 Supabase 客户端（cookie 会话） |
| `@supabase/supabase-js` | `^2.105.4` | Supabase 底层 SDK（被 @supabase/ssr 依赖，Database 泛型） |
| `@tanstack/react-query` | `^5.100.10` | 生成请求 mutation + 状态轮询 query |
| `class-variance-authority` | `^0.7.1` | Button/Badge 变体样式（cva） |
| `clsx` | `^2.1.1` | `cn()` 工具函数 |
| `geist` | `^1.7.0` | Geist Sans/Mono 字体（next/font 方式引入） |
| `lucide-react` | `^1.14.0` | 全部图标 |
| `next` | `16.2.6`（精确锁定） | 框架，App Router，turbopack |
| `next-intl` | `^4.11.2` | ⚠️ 已安装未使用（messages/ 目录为空） |
| `react` | `19.2.4`（精确锁定） | — |
| `react-dom` | `19.2.4`（精确锁定） | — |
| `react-hook-form` | `^7.75.0` | ⚠️ 已安装未使用 |
| `tailwind-merge` | `^3.6.0` | `cn()` 工具函数 |
| `zod` | `^4.4.3` | ⚠️ 已安装未使用（**全仓库无任何 zod schema**，API 校验为手写 if 判断） |

**devDependencies：**

| 包 | 版本 | 用途 |
|---|---|---|
| `@tailwindcss/postcss` | `^4` | Tailwind v4 PostCSS 插件 |
| `@testing-library/jest-dom` | `^6.9.1` | 测试断言扩展 |
| `@testing-library/react` | `^16.3.2` | 组件/Hook 测试 |
| `@testing-library/user-event` | `^14.6.1` | 用户交互模拟 |
| `@types/node` | `^20` | — |
| `@types/react` | `^19` | — |
| `@types/react-dom` | `^19` | — |
| `@vitejs/plugin-react` | `^6.0.1` | Vitest React 插件 |
| `@vitest/ui` | `^4.1.6` | `test:ui` 脚本 |
| `eslint` | `^9` | — |
| `eslint-config-next` | `16.2.6`（精确锁定） | — |
| `jsdom` | `^29.1.1` | Vitest DOM 环境 |
| `tailwindcss` | `^4` | Tailwind v4（CSS-first，无 tailwind.config 文件） |
| `typescript` | `^5` | strict 模式 |
| `vitest` | `^4.1.6` | 测试框架 |

### 2.2 npm scripts（逐字收录）

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui"
}
```

安装/运行命令：`npm install` → `npm run dev`（默认 http://localhost:3000）；构建 `npm run build`；生产 `npm run start`；测试 `npm run test:run`；Lint `npm run lint`。

### 2.3 .env.example 全文（逐字收录，共 13 个变量键）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# fal.ai
FAL_API_KEY=

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_PUBLIC_URL=

# Creem.io
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# Sentry
SENTRY_DSN=

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2.4 环境变量键位表

| 键名 | 用途 | 占位值 | 源码实际读取位置 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 空 | `src/lib/supabase/{client,server,middleware}.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 公钥 | 空 | 同上 |
| `FAL_API_KEY` | fal.ai API Key | 空 | ⚠️ **无处读取**。代码实际读 `process.env.FAL_KEY`（`src/lib/providers/fal.ts` 第 15 行），键名不一致是已知缺陷，见第 10 章 |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 访问密钥 ID | 空 | 无处读取（预留） |
| `R2_SECRET_ACCESS_KEY` | R2 私钥 | 空 | 无处读取（预留） |
| `R2_BUCKET_NAME` | R2 桶名 | 空 | 无处读取（预留） |
| `R2_ENDPOINT` | R2 S3 兼容端点 | 空 | 无处读取（预留） |
| `R2_PUBLIC_URL` | R2 公共访问域名 | 空 | 无处读取（预留） |
| `CREEM_API_KEY` | Creem.io 支付 API Key | 空 | 无处读取（预留） |
| `CREEM_WEBHOOK_SECRET` | Creem webhook 签名密钥 | 空 | 无处读取（预留） |
| `RESEND_API_KEY` | Resend 邮件 API Key | 空 | 无处读取（预留） |
| `SENTRY_DSN` | Sentry DSN | 空 | 无处读取（预留） |
| `NEXT_PUBLIC_BASE_URL` | 站点基础 URL | `http://localhost:3000` | `auth/login`（OAuth redirectTo）、`auth/logout`（重定向）、`fal.ts`（webhook_url） |

> 复现时另需在本地 `.env.local` 中补一个 `.env.example` 未列出的键：`FAL_KEY`（代码真实读取的键名），或修正代码统一为 `FAL_API_KEY`。不设置则 fal Provider 走 Mock 模式（推荐开发期行为）。

### 2.5 关键配置文件（逐字收录）

**next.config.ts（全文）：**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
```

**vitest.config.ts（全文）：**

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**vitest.setup.ts（全文）：** `import '@testing-library/jest-dom'`

**postcss.config.mjs（全文）：** `const config = { plugins: { "@tailwindcss/postcss": {} } }; export default config;`

**tsconfig.json 关键点**：`strict: true`、`target: ES2017`、`moduleResolution: bundler`、路径别名 `"@/*": ["./src/*"]` 与 `"@/types/*": ["./types/*"]`（注意：`@/types/supabase` 实际解析到根目录 `types/supabase/index.ts`，因为 paths 中 `@/types/*` 排在 `@/*` 之后但更具体的映射生效——复现时必须同时保留两条映射且顺序一致）。

**eslint.config.mjs**：flat config，组合 `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`，globalIgnores：`.next/**`、`out/**`、`build/**`、`next-env.d.ts`。

**环境要求**：Node.js ≥ 20（@types/node ^20），npm（仓库含 package-lock.json）。无 Docker、无 CI 配置。

<!-- SECTION 2 END -->

---

## 3. 目录结构

带中文注释目录树（排除 `node_modules/`、`.next/`、`.trae/`、空目录 `e/`）：

```
pixelflux/
├── .env.example                 # 环境变量模板（13 键，见 2.3，全部空占位）
├── .gitignore                   # 忽略 node_modules/.next/.env*/coverage 等
├── AGENTS.md                    # AI 代理提示：Next.js 16 API 有破坏性变更，先读 node_modules/next/dist/docs/
├── CLAUDE.md                    # 空文件（0 字节）
├── README.md                    # create-next-app 默认模板 README，无项目信息
├── eslint.config.mjs            # ESLint 9 flat config（next/core-web-vitals + typescript）
├── next-env.d.ts                # Next.js 自动生成类型引用
├── next.config.ts               # 仅 turbopack.root 配置
├── package.json                 # 依赖与脚本（见 2.1/2.2）
├── package-lock.json            # npm 锁文件
├── postcss.config.mjs           # 仅 @tailwindcss/postcss 插件
├── tsconfig.json                # strict + @/* 与 @/types/* 别名
├── vitest.config.ts             # jsdom + globals + @ 别名
├── vitest.setup.ts              # 引入 jest-dom
├── messages/                    # ⚠️ 空目录（next-intl 预留，无任何语言文件）
├── public/                      # create-next-app 默认 SVG（file/globe/next/vercel/window.svg），未被业务引用
├── types/
│   └── supabase/
│       └── index.ts             # Database 接口：6 张表的 Row/Insert/Update 类型（第 4 章逐字收录字段）
└── src/
    ├── middleware.ts            # Next.js 中间件入口：全站 Supabase 会话刷新（第 6.1 章逐字收录）
    ├── app/
    │   ├── favicon.ico          # 站点图标（二进制资产）
    │   ├── globals.css          # Tailwind v4 @theme 设计令牌 + 暗色模式 + 基础样式（第 8.4 章）
    │   ├── layout.tsx           # 根布局：Geist 字体 + metadata + QueryProvider
    │   ├── page.tsx             # 落地页（Server Component，纯静态营销内容）
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── callback/route.ts   # GET：OAuth code 换 session → 重定向
    │   │   │   ├── login/route.ts      # GET：发起 Google OAuth → 重定向上游
    │   │   │   ├── logout/route.ts     # GET：signOut → 重定向首页
    │   │   │   └── me/route.ts         # GET：返回当前用户 or { user: null }
    │   │   ├── generate/route.ts       # POST：发起生成（校验/余额/Provider/扣费）
    │   │   ├── generations/
    │   │   │   ├── route.ts            # GET：分页列出当前用户生成记录
    │   │   │   └── [id]/route.ts       # GET：详情+轮询回查Provider；DELETE：删除
    │   │   └── models/route.ts         # GET：模型列表；POST：405
    │   └── generate/
    │       ├── page.tsx                # 生成工作台（'use client'，核心交互页）
    │       ├── [id]/page.tsx           # 生成详情页（'use client'）
    │       └── __tests__/page.test.tsx # 工作台组件测试（12 用例）
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx       # 顶栏：logo/导航/登录按钮/移动端汉堡菜单
    │   │   └── Footer.tsx       # 页脚：品牌/模型链接/法务链接/版权
    │   ├── providers/
    │   │   └── QueryProvider.tsx # react-query Provider（staleTime 30s, retry 1）
    │   └── ui/
    │       ├── Badge.tsx        # cva 徽章（6 变体）
    │       ├── Button.tsx       # cva 按钮（4 变体×4 尺寸，loading spinner）
    │       ├── Card.tsx         # 卡片族（Card/Header/Title/Description/Content）
    │       └── Skeleton.tsx     # 骨架屏（animate-pulse）
    ├── hooks/
    │   ├── use-generation.ts    # useGenerate（mutation）+ useGenerationPoll（2s 轮询）
    │   └── __tests__/use-generation.test.tsx  # Hook 测试（7 用例）
    └── lib/
        ├── generation-store.ts  # ⚠️ 进程内存 Map 版生成记录 CRUD（非持久化）
        ├── require-auth.ts      # requireAuth + AuthError + handleApiError（错误码协议）
        ├── utils.ts             # cn/formatCredits/formatDuration/formatRelativeTime
        ├── __tests__/
        │   ├── generation-store.test.ts  # 存储测试（9 用例）
        │   └── utils.test.ts             # 时间格式化测试（9 用例）
        ├── providers/
        │   ├── types.ts         # VideoProvider/GenerationParams/ProviderJob/ModelConfig 接口
        │   ├── registry.ts      # Provider 注册表 + MODEL_CONFIGS（6 模型硬编码）
        │   ├── fal.ts           # FalProvider：真实 fal.ai 调用 + Mock 模式
        │   └── __tests__/fal.test.ts     # Provider 测试（9 用例）
        └── supabase/
            ├── client.ts        # createBrowserClient（浏览器端）
            ├── server.ts        # createServerClient + next/headers cookies（RSC/Route）
            └── middleware.ts    # updateSession：中间件会话刷新实现
```

统计：src/ 下 **35 个 .ts/.tsx 文件**（30 个业务文件 + 5 个测试文件）+ globals.css + favicon.ico；加 types/supabase/index.ts 与 9 个根配置文件，合计约 47 个源码/配置文件。其中 src 下 35 文件清单（复现完成后应逐一对应）：`middleware.ts`；`app/`：layout.tsx、page.tsx、8 个 route.ts、generate/page.tsx、generate/[id]/page.tsx、generate/__tests__/page.test.tsx；`components/`：Navbar/Footer/QueryProvider/Badge/Button/Card/Skeleton；`hooks/`：use-generation.ts + 测试；`lib/`：utils/require-auth/generation-store + __tests__×2 + providers（types/registry/fal + 测试）+ supabase（client/server/middleware）。

<!-- SECTION 3 END -->

---

## 4. 数据模型

### 4.1 总述与缺口声明

> ⚠️ **线上 schema 需导出补录**：仓库内**不存在任何 Supabase migration 文件**（无 `supabase/` 目录、无 SQL 文件）。以下表结构完全从 `types/supabase/index.ts` 的 TypeScript 类型定义与源码查询语句反推。**字段类型为推断值（TS string → 需人工判断 uuid/text/timestamptz），主键/外键/默认值/索引/RLS 策略/触发器均无法从代码确定**，复现上线前必须用 `supabase db dump` 或 Dashboard 导出线上真实 schema 补录。

代码实际执行的数据库操作**只有两处**，均在 `src/app/api/generate/route.ts`：

```
supabase.from('users').select('*').eq('id', user.id).maybeSingle()      -- 查余额
supabase.from('users').update({ credits: ... }).eq('id', user.id)      -- 扣 Credits
```

其余 5 张表（subscriptions/credit_transactions/generations/models/templates）仅有类型定义，代码未查询——生成记录当前用内存 Map 替代 `generations` 表。

### 4.2 表结构（从 types/supabase/index.ts 逐字反推）

**表 `users`**（实际使用中；推测与 `auth.users` 1:1，`id` 即 auth uid）：

| 字段 | TS 类型 | 推断 SQL 类型 | Insert 可选性 | 说明 |
|---|---|---|---|---|
| `id` | `string` | `uuid` PK（引用 auth.users.id） | 必填 | 用户 ID |
| `email` | `string \| null` | `text` | 可选 | 邮箱 |
| `credits` | `number` | `integer` | 可选（推断默认 50，落地页文案"50 free credits"） | Credits 余额 |
| `tier` | `'free' \| 'lite' \| 'pro' \| 'premium'` | `text` CHECK 或 enum | 可选（推断默认 'free'） | 订阅档位 |
| `created_at` | `string` | `timestamptz`（推断默认 now()） | 可选 | — |

**表 `subscriptions`**（仅类型定义，未使用）：

| 字段 | TS 类型 | 推断 SQL 类型 |
|---|---|---|
| `id` | `string` | `text` PK（推断为 Creem 订阅 ID，Insert 必填故非自动生成） |
| `user_id` | `string` | `uuid` FK → users.id |
| `tier` | `string` | `text` |
| `status` | `'active' \| 'canceled' \| 'expired'` | `text` CHECK/enum |
| `credits_monthly` | `number` | `integer` |
| `current_start` | `string \| null` | `timestamptz` |
| `current_end` | `string \| null` | `timestamptz` |
| `created_at` | `string` | `timestamptz` default now() |

**表 `credit_transactions`**（仅类型定义，未使用；`id` 在 Insert 中可选 → 推断自动生成 uuid）：

| 字段 | TS 类型 | 推断 SQL 类型 |
|---|---|---|
| `id` | `string` | `uuid` PK default gen_random_uuid() |
| `user_id` | `string` | `uuid` FK → users.id |
| `amount` | `number` | `integer`（正=入账，负=消耗，推断） |
| `type` | `'purchase' \| 'generation' \| 'refund' \| 'bonus'` | `text` CHECK/enum |
| `reference` | `string \| null` | `text`（关联生成/订单 ID，推断） |
| `created_at` | `string` | `timestamptz` default now() |

**表 `generations`**（仅类型定义；当前由内存 Map 替代，字段与内存版 GenerationRecord 对齐但内存版多一个 `params` 对象）：

| 字段 | TS 类型 | 推断 SQL 类型 |
|---|---|---|
| `id` | `string` | `uuid` PK default gen_random_uuid()（Insert 可选） |
| `user_id` | `string` | `uuid` FK → users.id |
| `model_id` | `string` | `text` FK → models.id（推断） |
| `prompt` | `string` | `text` |
| `status` | `'pending' \| 'processing' \| 'completed' \| 'failed'` | `text` CHECK/enum，Insert 默认 'pending'（推断） |
| `credits_cost` | `number` | `integer` |
| `cost_usd` | `number \| null` | `numeric` |
| `result_url` | `string \| null` | `text` |
| `duration_ms` | `number \| null` | `integer` |
| `error_message` | `string \| null` | `text` |
| `created_at` | `string` | `timestamptz` default now() |
| `completed_at` | `string \| null` | `timestamptz` |

**表 `models`**（仅类型定义；当前由 `MODEL_CONFIGS` 硬编码替代；`id` Insert 必填 → 业务主键如 'kling-2.5'）：

| 字段 | TS 类型 | 推断 SQL 类型 |
|---|---|---|
| `id` | `string` | `text` PK（如 'kling-2.5'） |
| `provider` | `string` | `text` |
| `display_name` | `string` | `text` |
| `description` | `string \| null` | `text` |
| `credits_per_second` | `number` | `integer` |
| `is_active` | `boolean` | `boolean` default true（Insert 可选） |
| `sort_order` | `number` | `integer` default 0（Insert 可选） |

**表 `templates`**（仅类型定义，未使用）：

| 字段 | TS 类型 | 推断 SQL 类型 |
|---|---|---|
| `id` | `string` | `uuid` PK default gen_random_uuid()（Insert 可选） |
| `name` | `string` | `text` |
| `description` | `string \| null` | `text` |
| `prompt` | `string` | `text` |
| `model_id` | `string` | `text` FK → models.id |
| `cover_url` | `string \| null` | `text` |
| `usage_count` | `number` | `integer` default 0 |
| `tags` | `string[]` | `text[]` default '{}' |
| `created_at` | `string` | `timestamptz` default now() |

### 4.3 RLS 线索

代码全程使用 **anon key**（无 service_role key），`users` 表的 select/update 均在登录用户 session 下执行 → 线上必然存在 RLS 策略至少允许：`users` 表 `auth.uid() = id` 的 SELECT 与 UPDATE。其余表策略未知，**需随 schema 一并导出补录**。另外 `users` 行的创建时机代码中不存在（OAuth 首次登录后如何插入 users 行未实现）→ 推断线上有 `on auth.users insert` 触发器自动建行并赠送 50 credits，**需导出触发器函数补录**；若无触发器，`generate` 路由中 `userProfile` 为 null 时会**跳过余额检查与扣费**（源码容错行为，见 6.3）。

### 4.4 本地/内存存储结构

**服务端内存存储**（`src/lib/generation-store.ts`）：模块级 `Map<string, GenerationRecord>`，进程重启/热重载即清空。GenerationRecord 结构（逐字）：

```typescript
interface GenerationRecord {
  id: string
  userId: string
  modelId: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  creditsCost: number
  resultUrl: string | null
  durationMs: number | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  params: {
    aspectRatio?: string
    duration?: number
    style?: string
  }
}
```

**fal Provider 内存 Job 表**（`src/lib/providers/fal.ts`）：模块级 `Map<string, FalJob>`，`FalJob = { jobId, params, status, resultUrl?, error?, createdAt: number }`。

**浏览器端**：无 localStorage/sessionStorage 使用；客户端状态仅 react-query 缓存 + useState。Cookie 仅 Supabase 会话 cookie（由 @supabase/ssr 管理，名称形如 `sb-<ref>-auth-token`）。

<!-- SECTION 4 END -->

---

## 5. API 契约

### 5.1 端点总表（8 个 route.ts 文件，10 个 handler，无 Server Actions）

| # | 方法 | 路径 | 鉴权 | 成功响应 | 失败 |
|---|---|---|---|---|---|
| 1 | GET | `/api/auth/login` | 无 | 302 → Google OAuth URL | 500 `{ error: 'Auth initiation failed' }` |
| 2 | GET | `/api/auth/callback?code=&next=` | 无 | 302 → `{origin}{next}`（next 默认 `/generate`） | 302 → `{origin}?error=auth_failed` |
| 3 | GET | `/api/auth/logout` | 无 | 302 → `NEXT_PUBLIC_BASE_URL` 根路径 | — |
| 4 | GET | `/api/auth/me` | 可选 | 200 `{ user: { id, email, name, avatar } }` 或 `{ user: null }` | — |
| 5 | GET | `/api/models` | 无 | 200 `{ items: ModelConfig[] }` | — |
| 6 | POST | `/api/models` | 无 | — | 405 `{ error: 'method_not_allowed' }` |
| 7 | POST | `/api/generate` | 必须 | 201 `{ id, status: 'processing', creditsCost, estimatedSeconds }` | 400/401/402/500 |
| 8 | GET | `/api/generations?page=&limit=` | 必须 | 200 `{ items[], total, page, limit, hasMore }` | 401/500 |
| 9 | GET | `/api/generations/[id]` | 必须 | 200 序列化 GenerationRecord | 401/403/404/500 |
| 10 | DELETE | `/api/generations/[id]` | 必须 | 200 `{ success: true }` | 401/403/404/500 |

### 5.2 请求/响应 shape 细节

**POST /api/generate** 请求体（无 zod，手写校验）：

```jsonc
{
  "modelId": "kling-2.5",        // 必填，须在 MODEL_CONFIGS 中且 isActive
  "prompt": "A sunset...",       // 必填，≤2000 字符
  "params": {                    // 可选
    "aspectRatio": "16:9",
    "duration": 10,              // 缺省 10；creditsCost = creditsPerSecond × duration
    "style": "Cinematic"
  }
}
```

错误响应（详见 5.3 错误码协议）：缺字段 → 400 `{ error: 'missing_fields', message: '请填写模型和 Prompt' }`；超长 → 400 `{ error: 'prompt_too_long', message: 'Prompt 不能超过 2000 字符' }`；模型无效 → 400 `{ error: 'invalid_model', message: '模型不可用' }`；余额不足 → 402 `{ error: 'insufficient_credits', message: 'Credits 不足，去充值', credits: <当前余额>, required: <所需> }`。成功 201：`estimatedSeconds = duration + 10`。

**GET /api/generations**：query 参数 `page`（默认 1）、`limit`（默认 20，上限 50，`Math.min(limit, 50)`）。item shape 与 GenerationRecord 一致（含 params，不含 userId）。

**GET /api/generations/[id]**（轮询端点）：若记录 status 为 `processing|pending`，服务端**同步回查 Provider**（`provider.checkStatus(generation.id)`）：Provider 返回 completed → 更新记录（`resultUrl`、`durationMs = result.duration * 1000`、`completedAt`）后返回；failed → 更新（`errorMessage`，默认 '生成失败'）后返回；Provider 抛异常 → 静默吞掉，返回当前状态。非本人记录 → 403 `{ error: 'forbidden', message: '无权访问' }`（DELETE 为 '无权操作'）；不存在 → 404 `{ error: 'not_found', message: '生成记录不存在' }`。

**GET /api/models** 单项 shape：`{ id, provider, displayName, description, creditsPerSecond, isActive, sortOrder, capabilities: { aspectRatios[], maxDuration, styles[] } }`。

### 5.3 统一错误码协议（src/lib/require-auth.ts 的 handleApiError，逐字语义）

| HTTP | error 码 | message | 触发条件 |
|---|---|---|---|
| 401 | `unauthorized` | `请先登录` | 抛出 `AuthError` |
| 402 | `insufficient_credits` | `Credits 不足，去充值` | Error message === 'insufficient_credits' |
| 429 | `rate_limited` | `操作太快，请稍后再试`（附 `retryAfter: 5`） | Error message === 'rate_limited'（当前无代码抛出，协议预留） |
| 400 | `invalid_model` | `模型不可用` | Error message === 'invalid_model' |
| 500 | `internal_error` | `服务器内部错误` | 其余所有异常（console.error 记录） |

### 5.4 外部服务调用契约

**fal.ai**（唯一有代码实现的外部服务，`src/lib/providers/fal.ts`）：

- 提交生成：`POST https://fal.run/{modelPath}`，Header `Authorization: Key {FAL_KEY}`、`Content-Type: application/json`。请求体（逐字）：`{ prompt, aspect_ratio: params.aspectRatio ?? '16:9', duration: params.duration ?? 10, sync_mode: 'async', webhook_url: '${NEXT_PUBLIC_BASE_URL}/api/webhook/fal' }`。响应取 `data.request_id` 作为 jobId。⚠️ `webhook_url` 指向的 `/api/webhook/fal` 路由**不存在**（未实现，见第 10 章）。
- 查询状态：`GET https://fal.run/requests/{jobId}/status`，Header 同上。`data.status === 'COMPLETED'` 时取 `data.video.url` 与 `data.video.duration ?? 10`；否则视为 processing。
- modelId → fal 模型路径映射（`getFalModel`，逐字）：`'kling-2.5' → '/fal-ai/kling-video/v2.5/standard'`，`'veo-3.1' → '/fal-ai/veo-3.1'`，`'seedance-2' → '/fal-ai/seedance'`，`'hailuo-02' → '/fal-ai/hailuo'`，`'wan-2.6' → '/fal-ai/wan'`，`'sora' → '/fal-ai/sora'`；未知 → 回落 kling 路径。
- **Mock 模式**（无 `FAL_KEY` 时）：生成随机 UUID jobId，`setTimeout` 8000+random×7000 ms 后置为 completed（5% 概率 failed，error='上游 API 超时'）；completed 的 resultUrl 固定为 `https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`。

**Supabase Auth**：`signInWithOAuth({ provider: 'google', options: { redirectTo: '${NEXT_PUBLIC_BASE_URL}/api/auth/callback' } })`（PKCE flow，@supabase/ssr 默认）；回调 `exchangeCodeForSession(code)`；`auth.getUser()` 校验会话；`auth.signOut()` 登出。需在 Supabase Dashboard 启用 Google Provider 并配置 Redirect URL。

**R2 / Creem / Resend / Sentry**：**无任何代码调用**，仅 .env.example 占位。复现时无需实现即可跑通全部现有功能。

<!-- SECTION 5 END -->

---

## 6. 核心业务逻辑

### 6.1 middleware 会话刷新机制（白名单：逐字收录）

**src/middleware.ts（全文）：**

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**src/lib/supabase/middleware.ts（全文）：**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()

  return supabaseResponse
}
```

机制说明：matcher 匹配除静态资源外的全部路径；每个请求创建 Supabase 服务端客户端并调用 `auth.getUser()` —— 该调用会在 access token 过期时自动用 refresh token 换新，并通过 `setAll` 回调把新 cookie 同时写入 request（供下游 RSC 使用）与 response（回写浏览器）。这是 @supabase/ssr 官方标准模式。**注意**：middleware 不做任何路由保护/重定向，未登录访问 `/generate` 页面本身不拦截（API 层用 `requireAuth` 拦截）。

### 6.2 鉴权闭环

1. 用户点击 `/api/auth/login` → 服务端 `signInWithOAuth({ provider: 'google', redirectTo: '${NEXT_PUBLIC_BASE_URL}/api/auth/callback' })` → 302 跳转 Google。
2. Google 授权后回跳 `/api/auth/callback?code=...` → `exchangeCodeForSession(code)` 写入会话 cookie → 302 跳 `next` 参数（默认 `/generate`）；code 缺失或换取失败 → 302 跳 `{origin}?error=auth_failed`。
3. 后续请求由 middleware 静默续期；API 内 `requireAuth()` 调 `auth.getUser()`，无用户则抛 `AuthError('unauthorized')` → `handleApiError` 转 401。
4. 登出：`/api/auth/logout` → `signOut()` → 302 回首页。

### 6.3 视频生成流程（端到端）

```
[前端 /generate 页] handleGenerate
  → useGenerate.mutation：POST /api/generate { modelId, prompt, params }
      服务端顺序：
      1. requireAuth() —— 401 拦截
      2. 手写校验：modelId/prompt 必填(400 missing_fields)；prompt ≤ 2000 (400 prompt_too_long)
      3. MODEL_CONFIGS 查模型且 isActive —— 否则 400 invalid_model
      4. creditsCost = creditsPerSecond × (params.duration ?? 10)
      5. 查 users 表余额：select('*').eq('id', user.id).maybeSingle()
         ⚠️ 若 userProfile 为 null（users 行不存在）→ 跳过余额检查（容错，不报错）
         若 credits < creditsCost → 402 insufficient_credits（附 credits/required）
      6. getProviderByModel(modelId).generate(...) —— 调 fal.ai 或 Mock
         ⚠️ 返回的 provider jobId 被丢弃（见边界条件 B6）
      7. createGeneration(...)：以新 crypto.randomUUID() 为 id 写入内存 Map，status='processing'
      8. 若 userProfile 存在 → update users.credits = credits - creditsCost
      9. 201 { id, status:'processing', creditsCost, estimatedSeconds: duration+10 }
  → onSuccess: setActiveId(data.id)
  → useGenerationPoll(activeId)：每 2s GET /api/generations/{id}
      服务端：status 为 processing/pending 时回查 provider.checkStatus(generation.id)
      → completed：更新 resultUrl/durationMs/completedAt 并返回
      → failed：更新 errorMessage/completedAt 并返回
      → 异常：吞掉，维持现状返回
  → 前端拿到 completed/failed 后 refetchInterval 返回 false 停止轮询
```

### 6.4 支付/积分流程

支付（Creem）**未实现**。积分现状：仅"生成时扣减"，无充值、无失败退款（尽管前端失败文案写着 "Your credits have been refunded"——文案与实现不符，见第 10 章）、无 credit_transactions 流水记录。初始 50 credits 依赖线上数据库默认值/触发器（缺口）。

### 6.5 zod schema 逐字收录

**全仓库不存在任何 zod schema。** `zod@^4.4.3` 与 `@hookform/resolvers`、`react-hook-form` 均在依赖中但源码零 import。API 入参校验全部为手写 if 判断（见 6.3 步骤 2）。复现时保持一致即可；如需增强，可自行补 zod 但非复现必需。

### 6.6 边界条件汇总

| # | 边界条件 | 行为 |
|---|---|---|
| B1 | prompt 为空/仅空白 | 前端 Generate 按钮 disabled（`!prompt.trim()`）；后端 400 missing_fields |
| B2 | prompt > 2000 字符 | 后端 400 prompt_too_long（前端无长度限制 UI） |
| B3 | duration 超过模型 maxDuration | 前端按钮 disabled（opacity-30）；**后端不校验**（可绕过） |
| B4 | users 行不存在（userProfile null） | 跳过余额检查与扣费，生成照常进行 |
| B5 | credits 恰好等于 creditsCost | 通过（判断为 `<` 严格小于） |
| B6 | Provider jobId 与记录 id 不一致 | generate 路由丢弃 provider 返回的 jobId，用自建 UUID 作记录 id；轮询时 `checkStatus(generation.id)` 在 fal 内存 Map 必然未命中 → Mock 模式兜底返回 processing，**轮询永远不会 completed**；真实 API 模式会以错误 id 查 fal 状态接口。核心已知缺陷（第 10 章 K2），复现时原样保留或修复（推荐：generate 路由改用 provider 返回的 jobId 作记录 id） |
| B7 | 轮询目标记录被删除 | GET 404 → react-query 请求失败，前端 poll.data 保持旧值 |
| B8 | 访问他人生成记录 | 403 forbidden |
| B9 | limit 超过 50 | 钳制为 50 |
| B10 | page 超出范围 | 返回空 items，hasMore=false |
| B11 | fal API 非 2xx | generate 抛 `fal.ai API error: {text}` → 500 internal_error |
| B12 | Mock 模式 5% 随机失败 | job.status='failed'，error='上游 API 超时' |
| B13 | OAuth 回调无 code / 换 session 失败 | 302 `?error=auth_failed`（首页不消费该参数，无提示 UI） |
| B14 | 服务器重启 | 内存 Map 清空，所有生成记录丢失（已扣 credits 不返还） |
| B15 | 未登录直接访问 /generate 页面 | 页面可打开（middleware 不拦截），点击 Generate 后 API 401，前端展示错误 |

<!-- SECTION 6 END -->

---

## 7. 核心文件逐一说明【文档主体】

> 按依赖自底向上排列，覆盖全部 **35 个 src 下 .ts/.tsx 文件 + types/supabase/index.ts，共 36 个**（其中 8 个 API 路由合并在 7.9、6 个 UI/布局组件分组在 7.14、5 个测试文件分组在 7.16）。白名单内容（常量表、协议格式、不可推导数据）逐字收录；可推导的 JSX/样式用规格化描述。

### 7.0 文件→小节索引总表（36 文件）

| # | 文件 | 小节 | 一句话职责 |
|---|---|---|---|
| 1 | src/lib/utils.ts | 7.1 | cn + 3 个格式化函数 |
| 2 | src/lib/supabase/client.ts | 7.2 | 浏览器端 Supabase 客户端 |
| 3 | src/lib/supabase/server.ts | 7.2 | RSC/Route 服务端客户端（cookies） |
| 4 | src/lib/supabase/middleware.ts | 7.2/6.1 | updateSession 会话刷新 |
| 5 | src/middleware.ts | 6.1 | 全站中间件入口 + matcher |
| 6 | src/lib/require-auth.ts | 7.3 | requireAuth/AuthError/handleApiError 错误协议 |
| 7 | src/lib/providers/types.ts | 7.5 | VideoProvider/GenerationParams/ProviderJob/ModelConfig 接口 |
| 8 | src/lib/providers/registry.ts | 7.6 | Provider 惰性单例 + MODEL_CONFIGS 6 模型 |
| 9 | src/lib/providers/fal.ts | 7.7 | FalProvider：真实调用 + Mock 模式 |
| 10 | src/lib/generation-store.ts | 7.4 | 内存 Map 版生成记录 CRUD |
| 11–18 | src/app/api/**/route.ts ×8 | 7.9 | 10 个 handler（契约见第 5 章） |
| 19 | src/hooks/use-generation.ts | 7.8 | useGenerate + useGenerationPoll |
| 20 | src/app/layout.tsx | 7.10 | 根布局：Geist 字体/metadata/QueryProvider |
| 21 | src/app/page.tsx | 7.11 | 落地页（含 faqs 逐字） |
| 22 | src/app/generate/page.tsx | 7.12 | 生成工作台（含 4 组常量逐字） |
| 23 | src/app/generate/[id]/page.tsx | 7.13 | 生成详情页 |
| 24–30 | src/components/** ×7 | 7.14 | Button/Badge/Card/Skeleton/Navbar/Footer/QueryProvider |
| 31 | types/supabase/index.ts | 7.15 | Database 6 表类型（字段见 4.2） |
| 32–36 | 5 个测试文件 | 7.16 | 约 37 用例 |

### 7.1 src/lib/utils.ts —— 通用工具

- **职责**：类名合并 + 3 个格式化函数。
- **实现要点**（4 个导出）：
  - `cn(...inputs: ClassValue[])` = `twMerge(clsx(inputs))`。
  - `formatCredits(n: number)` = `new Intl.NumberFormat('en-US').format(n)`（千分位）。
  - `formatDuration(ms: number)`：换算秒；满 1 分钟返回 `M:SS`（秒 `padStart(2,'0')`），否则 `${sec}s`。
  - `formatRelativeTime(date: Date | string)`：与当前时刻差值 → `<1min` 返回 `'Just now'`；`<60min` 返回 `'{m}m ago'`；`<24h` 返回 `'{h}h ago'`；`<7d` 返回 `'{d}d ago'`；否则 `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`（如 `Dec 20, 2023`）。全部 `Math.floor`。
- **边界**：恰 60 分钟 → '1h ago'；恰 24 小时 → '1d ago'；恰 7 天 → 日期格式（测试锁定）。

### 7.2 src/lib/supabase/client.ts / server.ts / middleware.ts —— Supabase 三客户端

- **client.ts**：`createClient()` 返回 `createBrowserClient<Database>(NEXT_PUBLIC_SUPABASE_URL!, NEXT_PUBLIC_SUPABASE_ANON_KEY!)`。当前无组件调用（预留）。
- **server.ts**：`createClient()`（async）：`await cookies()`（next/headers）后返回 `createServerClient<Database>(...)`；cookies 适配器 `getAll` 直读 cookieStore，`setAll` 逐条 `cookieStore.set(name, value, options)` 且整体 try/catch 空吞（RSC 内调 set 会抛错，官方模式）。
- **middleware.ts**：见 6.1 逐字收录。
- **要点**：`Database` 泛型 import 自 `@/types/supabase`（解析到根目录 `types/supabase/index.ts`）。

### 7.3 src/lib/require-auth.ts —— 鉴权与错误协议

- **职责**：`requireAuth()`（`auth.getUser()` 无用户抛 `AuthError('unauthorized')`，有则返回 user）、`AuthError extends Error`（构造器设 `this.name = 'AuthError'`）、`handleApiError(error)` 错误码映射。
- **判定顺序**：AuthError 实例 → 401；Error 且 message 精确等于 `'insufficient_credits'` → 402、`'rate_limited'` → 429（附 `retryAfter: 5`）、`'invalid_model'` → 400；兜底 `console.error('API error:', error)` + 500。响应体与中文文案见 5.3 表（逐字）。
- **边界**：当前无代码路径以 throw 方式触发 402/429（generate 路由直接构造 402 响应，429 纯预留）。

### 7.4 src/lib/generation-store.ts —— 内存生成记录存储

- **职责**：GenerationRecord 的 CRUD + 分页（记录结构已在 4.4 逐字收录）。
- **实现要点**：模块级 `const generations = new Map<string, GenerationRecord>()`。
  - `createGeneration(record)`：Map.set。
  - `getGeneration(id)`：`generations.get(id) ?? null`。
  - `updateGeneration(id, updates: Partial<GenerationRecord>)`：不存在返回 null；浅合并 `{ ...existing, ...updates }` 回写并返回。
  - `listGenerations(userId, page = 1, limit = 20)`：按 userId 过滤 → createdAt **降序** → `offset = (page-1)*limit` 切片 → 返回 `{ items, total, hasMore: offset + limit < total }`。
  - `deleteGeneration(id)`：返回 `Map.delete` 布尔值。
- **边界**：不校验归属（API 层负责）；进程级共享，dev 热重载会清空。

### 7.5 src/lib/providers/types.ts —— Provider 抽象接口（逐字收录）

```typescript
export interface GenerationParams {
  prompt: string
  modelId: string
  aspectRatio?: string
  duration?: number
  imageUrl?: string
  style?: string
}

export interface GenerationResult {
  url: string
  duration: number
  metadata: Record<string, unknown>
}

export interface ProviderJob {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: GenerationResult
  error?: string
}

export interface VideoProvider {
  id: string
  name: string
  generate(params: GenerationParams): Promise<{ jobId: string }>
  checkStatus(jobId: string): Promise<ProviderJob>
  costPerSecond: number
}
```

另有 `ModelConfig` 接口：`{ id, provider, displayName, description: string | null, creditsPerSecond, isActive, sortOrder, capabilities: { aspectRatios: readonly string[], maxDuration: number, styles?: readonly string[] } }`。注意 `imageUrl` 全链路未使用（图生视频预留）。

### 7.6 src/lib/providers/fal.ts —— FalProvider

- **职责**：实现 VideoProvider；真实 fal.ai 调用（有 `FAL_KEY`）与 Mock 模式（无 Key）。
- **常量**：`FAL_API_BASE = 'https://fal.run'`；`FAL_KEY = process.env.FAL_KEY`（⚠️ 与 .env.example 的 `FAL_API_KEY` 不一致）；类属性 `id = 'fal'`、`name = 'Fal.ai'`、`costPerSecond = 0.05`（USD/秒，测试锁定）。内部 `FalJob` 结构见 4.4。
- **generate(params)**：先 `crypto.randomUUID()` 生成本地 jobId。**有 Key**：POST `${FAL_API_BASE}/${getFalModel(params.modelId)}`（请求体/Header 见 5.4 逐字）；非 ok → `throw new Error('fal.ai API error: ' + await response.text())`；成功后向本地 Map 写入 status='processing' 的 job（key=本地 jobId），但**返回 `{ jobId: data.request_id }`**（fal 的 request_id ≠ Map key，原样保留此不一致）。**无 Key（Mock）**：写入 Map 后 `setTimeout(8000 + Math.random() * 7000)` 到时若仍 processing：`Math.random() < 0.05` → failed（error='上游 API 超时'），否则 completed 且 resultUrl 固定为示例视频 URL（见 5.4）；立即返回 `{ jobId }`（本地 UUID）。
- **checkStatus(jobId)**：先查本地 Map —— completed 且有 resultUrl → `{ jobId, status: 'completed', result: { url, duration: params.duration ?? 10, metadata: {} } }`；failed → `{ jobId, status: 'failed', error }`；其他 → processing。Map 未命中且有 Key：GET `${FAL_API_BASE}/requests/${jobId}/status`；非 ok → failed('Failed to check status')；`data.status === 'COMPLETED'` → completed（url=`data.video?.url`，duration=`data.video?.duration ?? 10`，metadata=data）；否则 processing。Map 未命中且无 Key：兜底 `{ jobId, status: 'processing' }`。
- **getFalModel 映射**：见 5.4 逐字收录；未知 modelId 回落 `'/fal-ai/kling-video/v2.5/standard'`。

### 7.7 src/lib/providers/registry.ts —— Provider 注册表与模型配置

- **职责**：惰性单例 Provider Map + `MODEL_CONFIGS` 常量（前后端共用的业务核心数据）。
- **实现要点**：模块级 `let providers: Map | null = null`；`getProvider(id)` 首次调用时 init（仅注册 `'fal' → new FalProvider()`），未知 id 抛 `Unknown provider: {id}`；`getProviderByModel(modelId)` 经硬编码映射（6 个 modelId 全部 → 'fal'）取 Provider，未知抛 `Unknown model: {modelId}`。
- **MODEL_CONFIGS（`as const`，6 项，数据逐字收录）**：

| id | provider | displayName | creditsPerSecond | sortOrder | aspectRatios | maxDuration | styles |
|---|---|---|---|---|---|---|---|
| `kling-2.5` | Kling | Kling 2.5 | 15 | 1 | 16:9, 9:16, 1:1 | 30 | Realistic, Cinematic, Anime |
| `veo-3.1` | Google | Veo 3.1 | 25 | 2 | 16:9, 9:16, 4:3, 21:9 | 60 | Cinematic, Realistic, Fantasy |
| `seedance-2` | Seedance | Seedance 2 | 5 | 3 | 16:9, 9:16, 1:1 | 15 | Realistic, Anime |
| `hailuo-02` | Hailuo | Hailuo 02 | 12 | 4 | 16:9, 9:16 | 20 | Artistic, Cinematic, Anime |
| `wan-2.6` | Wan | Wan 2.6 | 8 | 5 | 16:9, 9:16, 1:1, 4:5 | 25 | Realistic, Cinematic |
| `sora` | OpenAI | Sora | 30 | 6 | 16:9, 9:16, 1:1, 4:3, 21:9 | 60 | Cinematic, Realistic, Fantasy, Anime |

全部 `isActive: true`。description 逐字：kling-2.5 `High-quality text-to-video generation with realistic motion.`；veo-3.1 `Google's most capable video generation model with cinematic quality.`；seedance-2 `Fast video generation with good quality-to-speed ratio.`；hailuo-02 `Specialized in artistic and stylized video content.`；wan-2.6 `Efficient video generation optimized for social media content.`；sora `OpenAI's state-of-the-art video generation model with stunning visual quality.`

### 7.8 src/hooks/use-generation.ts —— 生成 Hook（'use client'）

- **useGenerate()**：`useState<string | null>(null)` 存 activeId；`useMutation`：POST `/api/generate`（JSON body 为 GenerateParams），`!res.ok` 时 `throw new Error(data.error || '生成失败')`（⚠️ 抛的是 error **码**而非 message，前端错误框会显示如 `insufficient_credits`——原样保留）；onSuccess `setActiveId(data.id)`。返回 `{ mutation, activeId, setActiveId }`。
- **useGenerationPoll(id: string | null)**：`useQuery<GenerationStatus>`；queryKey `['generations', 'detail', id]`；queryFn GET `/api/generations/${id}`（非 ok 抛 `'Failed to fetch generation'`）；`enabled: !!id`；`refetchInterval` 回调：无 data → 2000；completed/failed → `false`；否则 2000。
- **导出类型**：`GenerationStatus`（与 API 序列化 shape 一致）、`GenerationResponse = { id, status, creditsCost, estimatedSeconds }`、`GenerateParams = { modelId, prompt, params: { aspectRatio?, duration?, style? } }`。

### 7.9 src/app/api/*（8 个路由文件）—— 文件级补充

各 handler 逻辑已由第 5/6 章完整覆盖，此处只补文件级要点：

- **auth/login/route.ts**（GET）：`signInWithOAuth` 后 `url` 为空 → 500 `{ error: 'Auth initiation failed' }`，否则 `NextResponse.redirect(url)`。
- **auth/callback/route.ts**（GET）：`new URL(request.url)` 取 searchParams/origin；`next` 默认 `'/generate'`。
- **auth/logout/route.ts**（GET）：`NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL))`。
- **auth/me/route.ts**（GET）：user 存在时 `{ user: { id, email, name: user.user_metadata?.full_name, avatar: user.user_metadata?.avatar_url } }`。
- **models/route.ts**：GET 逐字段映射 MODEL_CONFIGS → `{ items }`；POST 恒 405 `{ error: 'method_not_allowed' }`。
- **generate/route.ts**（POST）：整体 try/catch → handleApiError；supabase server client 用**动态 import**（`const { createClient } = await import('@/lib/supabase/server')`，原样保留）；查询结果强转 `(userProfile as unknown as { credits: number } | null)?.credits`；扣费为**非原子**先读后写（无事务/RPC，并发有超扣风险）。
- **generations/route.ts**（GET）：`parseInt(searchParams.get('page') ?? '1', 10)`；`Math.min(parseInt(limit ?? '20'), 50)`。
- **generations/[id]/route.ts**（GET/DELETE）：Next.js 16 风格 `{ params }: { params: Promise<{ id: string }> }` 须 `await params`；`serializeGeneration` 输出剔除 userId。

### 7.10 src/app/layout.tsx —— 根布局

- **职责**：引入 globals.css、Geist 字体变量（`GeistSans.variable` + `GeistMono.variable` 挂 html className）、`<QueryProvider>` 包裹 children。
- **metadata（逐字要点）**：title.default `'Pixelflux — One Subscription, All AI Models'`、template `'%s | Pixelflux'`；description `'Access the best AI video generation models with one subscription. Generate stunning videos with Kling, Veo, Seedance and more.'`；openGraph：title `'Pixelflux — AI Video Generation Platform'`、description `'One subscription, all AI video models. Generate, download, and create.'`、siteName 'Pixelflux'、type 'website'、locale 'en_US'；robots index/follow 均 true。
- html `lang="en"`；body className `min-h-screen bg-surface text-text-primary font-body antialiased`。

### 7.11 src/app/page.tsx —— 落地页（Server Component）

- **职责**：纯静态营销页，8 个区块：Hero、模型走马灯、Generator Preview、Features、Use Cases、How It Works、FAQ、CTA；外包 Navbar/Footer。
- **页面内常量（不可推导数据）**：
  - `models`（6 项）：Kling 2.5/Kling/POPULAR、Veo 3.1/Google/NEW、Seedance 2/Seedance/null、Hailuo 02/Hailuo/null、Wan 2.6/Wan/null、Sora/OpenAI/BETA。badge→Badge variant：POPULAR→default、NEW→success、其他→info。模型卡链接 `/models/{name 小写、空格转连字符}`。
  - `features`（3 项）：Multi-Model Access（icon Video）、Lightning Fast（Zap）、Flexible Parameters（Shapes）。
  - `useCases`（4 项）：Social Media、Advertising、Short Films、E-commerce。
  - `faqs`（4 项，Q/A 逐字）：① `How does the credit system work?` → `Each video generation costs credits based on duration and model. 1 credit ≈ $0.01. Free users get 50 credits to start.` ② `Can I use multiple models?` → `Yes! One subscription covers all models. Pick the best model for each project.` ③ `What happens to my videos?` → `Free users: videos auto-delete after 7 days. Paid users: permanent storage. Download anytime.` ④ `Can I cancel anytime?` → `Absolutely. Cancel anytime — credits last until the end of your billing period.`
  - How It Works 3 步：01 Choose a Model、02 Write Your Prompt、03 Generate & Download。
- **实现要点**：Hero 主标题 "One Subscription, / All AI Models"（第二行 `bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent`）；CTA 链接 `/api/auth/login`（Start Creating Free / Get Started Free）与 `/pricing`（See Pricing，页面未实现）；FAQ 用原生 `<details>/<summary>`，open 时 ArrowRight rotate-90。

### 7.12 src/app/generate/page.tsx —— 生成工作台（核心交互页，'use client'）

- **职责**：左侧 lg:w-[400px] 参数面板（模型下拉/Prompt/宽高比/时长/风格/费用/主按钮）+ 右侧 flex-1 bg-neutral-950 预览区（5 态状态机，见 8.3）。
- **页面常量（逐字）**：
  - `aspectRatios = ['16:9', '9:16', '1:1', '4:3']`（value=label）。
  - `durations = [{5,'5s'},{10,'10s'},{15,'15s'},{30,'30s'}]`。
  - `styles = ['Cinematic','Realistic','Anime','Fantasy','Artistic','Animation']`。
  - `stages`（生成中每 4s 轮播）：`['Analyzing prompt...','Generating frames...','Enhancing quality...','Finalizing...']`。
- **状态**：selectedModel（默认 `MODEL_CONFIGS[0]` 即 kling-2.5）、prompt、aspectRatio('16:9')、duration(10)、style('Cinematic')、modelOpen、stageIndex、copied；派生：`creditsCost = selectedModel.creditsPerSecond * duration`、isGenerating（poll status ∈ processing/pending）、isComplete、isFailed。
- **实现要点**：textarea 自动增高（useEffect：height='auto' → scrollHeight）；时长按钮 `d.value > selectedModel.capabilities.maxDuration` 时 disabled（opacity-30）；模型下拉用 `fixed inset-0 z-10` 透明遮罩点击关闭，列表项显示 `{creditsPerSecond}cr/s`；handleGenerate 要求 `prompt.trim()` 后 mutate；handleRegenerate：`setActiveId(null)` + `setTimeout(handleGenerate, 100)`；handleCopyPrompt：`navigator.clipboard.writeText` + copied 2s；handleDelete：DELETE API 后清 activeId 与 prompt；下载：动态 `<a href={resultUrl} download="pixelflux-{activeId}.mp4">.click()`；完成态左栏出现 "Re-generate" + "View Detail"（→ `/generate/{activeId}`）；失败态文案 `errorMessage || 'Something went wrong. Your credits have been refunded.'` + Try Again（setActiveId(null) 并回填 prompt）；费用行显示 `Cost: {creditsCost} credits` 与 `~{duration + 10}s`；生成中提示 `This usually takes {duration+5}-{duration+15} seconds`，进度条用 `animate-progress` 渐变条。
- **边界**：mutation.isError 时红框显示 `mutation.error.message`（即 error 码，见 7.8）；生成中所有输入控件 disabled。

### 7.13 src/app/generate/[id]/page.tsx —— 生成详情页（'use client'）

- **职责**：按 `useParams().id` 轮询展示单条生成：预览区三态（completed→`<video controls autoPlay loop>`；processing/pending→Loader + 文案（pending 'Starting generation...'，processing 'Generating your video...'）；failed→XCircle + errorMessage）+ 信息区（prompt 作 h1、模型 Badge、状态 Badge、credits、`formatRelativeTime(createdAt)`）+ 操作（Download/Copy Prompt/Delete）+ Details 四格（Model/Status/Duration/Aspect Ratio）+ 失败时 "Retry with Same Prompt"。
- **实现要点**：`isLoading` 时 Skeleton（aspect-video + 两行）；`!isLoading && !generation` 时 "Generation Not Found" 空态 + Create New 按钮；状态 Badge variant：completed→success、failed→error、其余→warning；Duration 显示 `(durationMs/1000).toFixed(1)s`，无则 '-'；Aspect Ratio 取 `params?.aspectRatio || '16:9'`；删除后 `router.push('/generate')`；Retry 链接 `/generate?prompt={encodeURIComponent(prompt)}`（⚠️ 工作台未读取该 query 参数，预留未接线）；返回链接 "Back to Generator" → `/generate`。

### 7.14 纯 UI 组件组（src/components/，7 文件）

- **ui/Button.tsx**：cva；base：`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-100 ease-out focus-visible:outline-2 ... disabled:pointer-events-none disabled:opacity-50`；variant：primary（bg-primary-500 → hover 600 → active 700 + `active:scale-[0.97]`）、secondary（neutral-100 底 + dark: neutral-800）、ghost、link（下划线）；size：sm(h-8 px-3)/md(h-10 px-4，默认)/lg(h-12 px-6)/icon(h-10 w-10)；props 扩展 `loading?: boolean`（禁用并渲染内联 SVG 圆环 spinner）；forwardRef，displayName='Button'；导出 `{ Button, buttonVariants }`。
- **ui/Badge.tsx**：cva；base：`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium`；variant：default（`bg-primary-500/15 text-primary-500`）、success/warning/error/info（各自 `-50` 底 `-600` 字 + dark: `-500/15` 底 `-500` 字）、neutral。
- **ui/Card.tsx**：Card（variant default/hover/highlighted；base `rounded-lg border p-6 transition-all duration-200`；hover 变体 `hover:shadow-lg hover:-translate-y-0.5`）+ CardHeader/CardTitle(h3, text-h4)/CardDescription/CardContent(pt-4) 薄封装。
- **ui/Skeleton.tsx**：`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800` 的 div 透传 props。
- **layout/Navbar.tsx**（'use client'）：`sticky top-0 z-50 bg-surface/80 backdrop-blur-md`；logo "Pixelflux" 渐变字；navLinks：`/models/kling-2.5`(Models)、`/templates`(Templates)、`/pricing`(Pricing)、`/faq`(FAQ)——后三者无页面；props `user?: { id; email?; name?; avatar? } | null`（**所有调用方均未传** → 恒显示 Login + Sign Up，两者都 → `/api/auth/login`；有 user 时显示 Start Creating → `/generate`）；移动端汉堡菜单（useState，Menu/X 切换）。
- **layout/Footer.tsx**（Server Component）：三栏——品牌 + slogan（`One subscription, all AI models. Generate stunning videos with cutting-edge AI technology.`）、Models 链接（/models/kling-2.5、veo-3.1、seedance-2、hailuo-02）、Legal 链接（/privacy、/terms、/faq，均无页面）+ 版权行 `© {new Date().getFullYear()} Pixelflux. All rights reserved.`。
- **providers/QueryProvider.tsx**（'use client'）：useState 惰性建 QueryClient，`defaultOptions.queries = { staleTime: 30 * 1000, retry: 1 }`。

### 7.15 types/supabase/index.ts —— Database 类型

- **职责**：手写（非 supabase gen 生成）的 `Database` 接口，`public.Tables` 下 6 张表各含 Row/Insert/Update 三态类型。字段清单已在 4.2 逐字转录，复现时按 4.2 表格还原 TS 类型即可（Insert 可选字段 = 4.2 中标注"可选"或推断有默认值的字段；Update 全字段可选）。

### 7.16 测试文件组（5 文件，约 37 用例）

- **src/lib/__tests__/utils.test.ts**（10 用例）：formatRelativeTime 全分支 + 60min/24h/7d 边界（vi.useFakeTimers + setSystemTime；断言如 'Just now'、'15m ago'、'2h ago'、'1d ago'、'Dec 20, 2023'）。
- **src/lib/__tests__/generation-store.test.ts**（9 用例）：CRUD + 分页 total/hasMore 三态 + 不存在 id 返回 null/false；beforeEach 用 `listGenerations('user-1', 1, 1000)` 遍历删除清场。
- **src/lib/providers/__tests__/fal.test.ts**（9 用例）：Mock 模式 generate 返回字符串 jobId；新 job processing；`vi.advanceTimersByTime(15000)` 后 completed；未知 jobId → processing；元数据断言 id='fal'/name='Fal.ai'/costPerSecond=0.05。⚠️ "completed" 用例受 5% 随机失败率影响可能偶发失败，重跑即可。
- **src/hooks/__tests__/use-generation.test.tsx**（8 用例，中文用例名）：mock global fetch；activeId 初始 null/手动设置/mutation 成功后设置；mutation 失败抛错；`enabled` 为 false 不请求；请求 URL 含 `/api/generations/gen-123`；failed 状态停止轮询。TestWrapper 用 retry:false 的 QueryClient。
- **src/app/generate/__tests__/page.test.tsx**（11 用例）：vi.mock use-generation（静态返回）与 Navbar/Footer（占位 div）；渲染断言（Model/Kling 2.5/Prompt/placeholder/参数控件/空态文案）；交互（展开模型列表见 Veo 3.1 与 Seedance 2、输入 prompt、点选 5s/9:16/Anime 后 toHaveClass(/bg-primary-500/)）；Generate 按钮：空 prompt disabled、有值 enabled。

<!-- SECTION 7 END -->

---

## 8. UI 与交互

### 8.1 路由表

> **重要事实**：本项目**未接入 next-intl，无 locale 路由段**（无 `[locale]` 目录、无 `i18n.ts`、无 next-intl middleware/plugin 配置）。路由即普通 App Router 平铺结构。

**页面路由（3 个真实页面）：**

| 路径 | 文件 | 渲染方式 | 说明 |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Server Component（纯静态） | 落地页 |
| `/generate` | `src/app/generate/page.tsx` | `'use client'` | 生成工作台 |
| `/generate/[id]` | `src/app/generate/[id]/page.tsx` | `'use client'`（useParams 取 id） | 生成详情页 |

**API 路由（10 个 handler）**：见 5.1 端点总表。

**站内死链清单**（Navbar/Footer/落地页引用但无对应页面文件，点击 404——复现时按此保留，属已知问题 K8）：

| 死链 | 引用位置 |
|---|---|
| `/models/kling-2.5`、`/models/veo-3.1`、`/models/seedance-2`、`/models/hailuo-02` | Navbar（Models）、Footer（Models 栏） |
| `/templates` | Navbar |
| `/pricing` | Navbar、落地页 CTA 区 |
| `/faq` | Navbar、Footer |
| `/privacy`、`/terms` | Footer（Legal 栏） |

### 8.2 国际化（i18n）现状

- `messages/` 目录**存在但为空**（0 个语言文件）；`next-intl` 仅出现在 package.json，源码零 import。
- 实际文案策略（复现时保持一致）：**UI 层全英文硬编码**（页面/组件内联字符串，如 "Enter a prompt to start"、"Generate Video"）；**API 错误层 message 为中文硬编码**（如 `请填写模型和 Prompt`、`Credits 不足，去充值`、`请先登录`，见 5.3），`error` 码为英文 snake_case。
- 若未来接入 next-intl：需补 `src/i18n/request.ts`、`messages/en.json` 等，本文档不虚构其键结构。

### 8.3 页面状态机

**生成工作台 `/generate`（核心状态机，5 态）**：

```
[empty 空态]  预览区显示 Sparkles 图标 + "Enter a prompt to start"
   │  点击 Generate（prompt 非空）→ mutation.mutate
   ▼
[starting]    mutation.isPending=true：按钮 loading，控件 disabled
   │  onSuccess → setActiveId(data.id) → useGenerationPoll 启动（2s 间隔）
   │  onError   → 回到 empty + 红框错误条（mutation.error.message=错误码）
   ▼
[generating]  poll.status ∈ {pending, processing}：Loader 旋转 + stages 文案每 4s 轮播
   │           + animate-progress 渐变进度条 + 预计耗时提示；输入控件保持 disabled
   │  poll 返回 completed → 停止轮询
   │  poll 返回 failed   → 停止轮询
   ▼
[complete]    <video controls autoPlay loop> 播放 resultUrl；左栏出现 Re-generate / View Detail；
              右上 Download / Copy Prompt / Delete
[failed]      XCircle + errorMessage（或默认 "Something went wrong. Your credits have been
              refunded."，⚠️ 实现并未退款，见 K6）+ Try Again（setActiveId(null) 保留 prompt）
```

轮询停止条件（`use-generation.ts`）：`refetchInterval` 回调在 `status ∈ {completed, failed}` 时返回 `false`，否则 2000ms；`enabled: !!activeId`。

**生成详情页 `/generate/[id]`（4 态）**：`isLoading`→Skeleton；`!generation`→Not Found 空态；`generation.status` 三分支（completed 视频 / pending·processing Loader / failed 错误 + Retry）。

**Navbar 登录态**：props `user` 恒未传 → 永远渲染 Login/Sign Up（都指向 `/api/auth/login`）；这是当前实现的真实行为，复现时不要"顺手修好"。

### 8.4 样式约定（globals.css 设计令牌，逐字要点）

Tailwind v4 CSS-first：**无 tailwind.config 文件**，全部令牌在 `src/app/globals.css` 的 `@theme inline` 块中定义（复现时须完整还原以下令牌，否则 `text-h4`、`bg-primary-500`、`animate-progress` 等类名全部失效）：

- **字体**：`--font-display/--font-body = var(--font-geist-sans)`、`--font-mono = var(--font-geist-mono)`（值来自 layout.tsx 中 geist 包注入的 next/font CSS 变量）。
- **字号体系**（每档含 line-height/letter-spacing 伴生变量）：`caption 0.75rem`、`body-sm 0.8125rem`、`body 0.875rem`、`body-lg 1rem`、`h5 1.125rem`、`h4 1.25rem`、`h3 1.5rem`、`h2 1.875rem`、`h1 2.25rem`、`display 3rem`、`display-xl 4rem`；letter-spacing 从 caption 的 `0.02em` 递减至 display-xl 的 `-0.05em`。
- **色板**：`primary-50..950`（indigo 系，500=`#6366f1`、600=`#4f46e5`）；`accent-400/500/600`（violet，500=`#8b5cf6`）；语义色 success/warning/error/info 各 `-50/-500/-600`（500 分别 `#22c55e/#f59e0b/#ef4444/#3b82f6`）；表面/文字/边框语义变量：`surface #ffffff`、`surface-elevated #fafafa`、`surface-overlay rgba(0,0,0,0.6)`、`text-primary #0a0a0a`、`text-secondary #525252`、`text-tertiary #a3a3a3`、`text-disabled #d4d4d4`、`text-on-color #ffffff`、`border-default #e5e5e5`、`border-subtle #f5f5f5`、`border-strong #a3a3a3`、`border-focus #6366f1`。
- **圆角**：`sm 4px / md 6px / lg 8px / xl 12px / 2xl 16px / 4xl 2rem`。
- **阴影**：sm→2xl 五档标准海拔（2xl=`0 25px 50px -12px rgba(0,0,0,0.25)`）。
- **动画令牌**：`--animate-progress: progress 2s ease-in-out infinite`（`@keyframes progress`：width 0%→70%→100%）、`--animate-pulse-slow: pulse 3s ease-in-out infinite`。
- **暗色模式**：类策略（`.dark` 选择器覆盖 surface/text/border/shadow 变量，如 surface→`#0a0a0a`、border-focus→`#818cf8`；阴影透明度加深）。⚠️ 代码中**没有任何切换 `.dark` 类的逻辑**（无 theme toggle、无 next-themes），暗色模式为纯预留。
- **基础样式**：body 用 surface/text-primary/font-body + 抗锯齿；`* { border-color: var(--color-border-default) }`；`::selection` primary-500 底白字；`:focus-visible` 2px primary 外框（`:focus:not(:focus-visible)` 去外框）；`prefers-reduced-motion: reduce` 时动画/过渡压至 0.01ms；webkit 滚动条 6px、thumb 为 border-default 圆角 3px、hover 变 border-strong。
- **组件层约定**：全部组件用 `cn()`（clsx + tailwind-merge）合并类名；变体一律 cva；间距/布局全部内联 Tailwind 类，无 CSS Modules、无 styled-components、globals.css 之外无任何 .css 文件。

### 8.5 关键交互细节速查表（与 7.12/7.13 对应，验收时逐项核对）

| 交互 | 精确行为 |
|---|---|
| Prompt 输入框 | textarea 自动增高（useEffect：height='auto' → scrollHeight） |
| 模型下拉 | 展开时渲染 `fixed inset-0 z-10` 透明遮罩，点击任意处关闭；列表项展示 `{creditsPerSecond}cr/s` |
| 时长按钮 | `d.value > selectedModel.capabilities.maxDuration` 时 disabled + `opacity-30` |
| 选中态样式 | 时长/宽高比/风格按钮选中时含 `bg-primary-500`（测试断言依赖此类名） |
| 费用行 | `Cost: {creditsPerSecond × duration} credits` + `~{duration + 10}s` |
| 生成中提示 | `This usually takes {duration+5}-{duration+15} seconds`；stages 文案每 4s 轮播 |
| Copy Prompt | `navigator.clipboard.writeText` → 按钮变 "Copied" 2s 后复原 |
| Download | 动态创建 `<a href={resultUrl} download="pixelflux-{id}.mp4">` 并 `.click()` |
| Re-generate | `setActiveId(null)` + `setTimeout(handleGenerate, 100)` |
| Try Again（失败态） | `setActiveId(null)`，**保留** prompt 输入 |
| Delete | 工作台：DELETE 后清 activeId 与 prompt；详情页：DELETE 后 `router.push('/generate')` |
| 移动端导航 | Navbar 汉堡按钮 useState 切换，Menu/X 图标互换 |
| 错误展示 | mutation 失败：工作台红框显示 `mutation.error.message`（即错误码字符串，非中文 message，见 7.8） |

<!-- SECTION 8 END -->

---

## 9. 从零复现步骤

### 9.0 前置条件

- Node.js ≥ 20，npm（项目用 package-lock.json，不用 pnpm/yarn）。
- Supabase 账号（免费档即可）+ Google Cloud Console 账号（建 OAuth Client）。
- 可选：fal.ai 账号（不配则自动走 Mock 模式，开发期推荐不配）。

### 步骤 1：创建项目骨架

```bash
npx create-next-app@16.2.6 pixelflux --typescript --eslint --app --src-dir --no-tailwind --turbopack
cd pixelflux
```

然后按第 3 章目录树补建目录：`messages/`（空）、`types/supabase/`、`src/components/{layout,providers,ui}/`、`src/hooks/`、`src/lib/{providers,supabase,__tests__}/`、`src/app/api/...`、`src/app/generate/[id]/`。删掉脚手架默认的 `app/page.tsx` 内容，按第 7 章重写。

### 步骤 2：安装依赖（版本与 2.1 对齐）

```bash
npm i @hookform/resolvers@^5.2.2 @supabase/ssr@^0.10.3 @supabase/supabase-js@^2.105.4 @tanstack/react-query@^5.100.10 class-variance-authority@^0.7.1 clsx@^2.1.1 geist@^1.7.0 lucide-react@^1.14.0 next-intl@^4.11.2 react-hook-form@^7.75.0 tailwind-merge@^3.6.0 zod@^4.4.3
npm i -D @tailwindcss/postcss@^4 tailwindcss@^4 vitest@^4.1.6 @vitest/ui@^4.1.6 @vitejs/plugin-react@^6.0.1 jsdom@^29.1.1 @testing-library/react@^16.3.2 @testing-library/jest-dom@^6.9.1 @testing-library/user-event@^14.6.1
```

注意：`next`/`react`/`react-dom`/`eslint-config-next` 需在 package.json 中锁为**精确版本**（无 `^`）：`16.2.6` / `19.2.4` / `19.2.4` / `16.2.6`。npm scripts 按 2.2 逐字补齐（test/test:run/test:ui）。

### 步骤 3：还原配置文件

按 2.5 逐字创建/覆写：`next.config.ts`、`vitest.config.ts`、`vitest.setup.ts`、`postcss.config.mjs`、`eslint.config.mjs`；`tsconfig.json` 确保 paths 含 `"@/*": ["./src/*"]` 与 `"@/types/*": ["./types/*"]` 两条映射；按 2.3 创建 `.env.example`；创建空 `CLAUDE.md` 与 AGENTS.md（内容见元信息节）。

### 步骤 4：创建 Supabase 项目与 Google OAuth

1. Supabase Dashboard 新建项目，记录 `Project URL` 与 `anon public key`。
2. Google Cloud Console → APIs & Services → Credentials → 创建 OAuth 2.0 Client ID（Web application），Authorized redirect URI 填：`https://<project-ref>.supabase.co/auth/v1/callback`。
3. Supabase Dashboard → Authentication → Providers → Google：启用并填入 Client ID/Secret。
4. Authentication → URL Configuration：Site URL 设 `http://localhost:3000`，Redirect URLs 加 `http://localhost:3000/api/auth/callback`（登录路由的 redirectTo 指向此地址）。

### 步骤 5：建表（⚠️ 推断版 SQL，线上真实 schema 需导出补录）

以下 SQL 从 4.2 反推，**仅 `users` 表为运行必需**，其余 5 表代码未读写可缓建；若能访问原线上项目，优先用 `supabase db dump --schema public` 导出真实结构替代本节：

```sql
-- users（必需）
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits integer not null default 50,          -- 默认 50 为推断（落地页文案 "50 free credits"）
  tier text not null default 'free' check (tier in ('free','lite','pro','premium')),
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- 推断触发器：首次 OAuth 登录自动建 users 行（代码中无建行逻辑，缺此则 generate 路由跳过扣费）
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

其余 5 表代码未读写、可缓建；如需一次性建齐，按以下推断 SQL（字段与 4.2 逐一对应；RLS 策略未知，先 enable 且不建策略，代码不访问它们不影响运行）：

```sql
-- subscriptions（未使用；id 为 Creem 订阅 ID，Insert 必填故非自动生成）
create table public.subscriptions (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  tier text not null,
  status text not null check (status in ('active','canceled','expired')),
  credits_monthly integer not null,
  current_start timestamptz,
  current_end timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

-- credit_transactions（未使用）
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('purchase','generation','refund','bonus')),
  reference text,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;

-- generations（已定义未使用，当前由内存 Map 替代）
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  model_id text not null,
  prompt text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  credits_cost integer not null,
  cost_usd numeric,
  result_url text,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.generations enable row level security;

-- models（未使用，当前由 MODEL_CONFIGS 硬编码替代；id 为业务主键如 'kling-2.5'）
create table public.models (
  id text primary key,
  provider text not null,
  display_name text not null,
  description text,
  credits_per_second integer not null,
  is_active boolean not null default true,
  sort_order integer not null default 0
);
alter table public.models enable row level security;

-- templates（未使用）
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  prompt text not null,
  model_id text not null references public.models(id),
  cover_url text,
  usage_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
```

### 步骤 6：配置 .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# 可选：真实 fal 调用时补下行（注意键名是 FAL_KEY 而非 .env.example 里的 FAL_API_KEY，见 K1）
# FAL_KEY=<fal.ai key>
```

其余 R2/Creem/Resend/Sentry 键无需填写（源码不读取）。

### 步骤 7：按第 7 章逐文件实现源码

推荐实现顺序（依赖自底向上）：

1. `types/supabase/index.ts`（7.15/4.2）→ 2. `src/lib/utils.ts`（7.1）→ 3. `src/lib/supabase/{client,server,middleware}.ts`（7.2）+ `src/middleware.ts`（6.1 逐字）→ 4. `src/lib/require-auth.ts`（7.3）→ 5. `src/lib/providers/{types,registry,fal}.ts`（7.5–7.7，MODEL_CONFIGS 6 模型数据逐字）→ 6. `src/lib/generation-store.ts`（7.4）→ 7. 8 个 API 路由（7.9，契约按第 5 章）→ 8. `globals.css`（8.4）+ `layout.tsx`（7.10）→ 9. UI 组件 6 件（7.14）→ 10. `hooks/use-generation.ts`（7.8）→ 11. 三个页面（7.11–7.13）→ 12. 5 个测试文件（7.16）。

### 步骤 8：验证命令（全部必须通过）

| 命令 | 预期结果 |
|---|---|
| `npm run test:run` | 5 个测试文件、约 37 用例全绿（fal 的 completed 用例受 5% 随机失败率影响可能偶发红，重跑即可，见 K10） |
| `npm run lint` | 0 error |
| `npm run build` | 构建成功；路由清单含 `/`、`/generate`、`/generate/[id]` 与 8 个 `/api/*` |
| `npm run dev` | http://localhost:3000 落地页正常渲染 |

### 步骤 9：手动验收清单

| # | 验收项 | 操作 | 通过标准 |
|---|---|---|---|
| A1 | 落地页 | 打开 `/` | Hero/模型走马灯/FAQ/CTA 完整，无控制台报错 |
| A2 | OAuth 登录 | 点 Login → Google 授权 | 回跳 `/generate`；`GET /api/auth/me` 返回 user 对象 |
| A3 | 未登录拦截 | 无 session 时 `POST /api/generate` | 401 `{ error: 'unauthorized', message: '请先登录' }` |
| A4 | 模型列表 | `GET /api/models` | `items` 含 6 个模型，kling-2.5 在首 |
| A5 | 发起生成（Mock） | 登录后工作台输入 prompt → Generate | 201；预览区进入 generating 态（stages 轮播 + 进度条）；Supabase users.credits 减少 `creditsPerSecond×duration` |
| A6 | 轮询行为 | 观察 Network | 每 2s 一次 `GET /api/generations/{id}`；⚠️ Mock 模式下因 K2（jobId 断链）状态永远 processing，**停留在 generating 态即为"与原项目行为一致"的通过标准**；若修复 K2（将 provider 返回的 jobId 存入记录或用 jobId 作记录 id）则 8–15s 后转 completed 并播放示例视频 |
| A7 | 余额不足 | 把 users.credits 改小于所需后生成 | 402 `insufficient_credits`，响应含 `credits`/`required` |
| A8 | 记录列表/详情/删除 | `GET /api/generations`、详情页、Delete 按钮 | 分页结构正确；删除后 404；跨用户访问他人记录 403 |
| A9 | 登出 | `GET /api/auth/logout` | 重定向 `/`，`/api/auth/me` 返回 `{ user: null }` |
| A10 | 参数校验 | 空 prompt / >2000 字 / 非法 modelId | 分别 400 `missing_fields` / `prompt_too_long` / `invalid_model` |

> 注意：因生成记录存内存（K5），重启 dev server 后 A8 列表将为空——这同样是原项目的真实行为。

### 步骤 10：常见复现故障排查表

| 症状 | 根因 | 处理 |
|---|---|---|
| 配了 `FAL_API_KEY` 仍走 Mock 模式 | K1：代码读 `FAL_KEY` | 改设 `FAL_KEY`，或接受 Mock（开发期推荐） |
| 登录回跳 `/?error=auth_failed` | Supabase Redirect URLs 未加 callback 地址，或 Google Client 的 redirect URI 填错 | 核对 9.步骤4 的两处 URL 配置 |
| 登录后生成成功但 credits 不扣 | K11：users 行不存在（触发器未建），generate 路由静默跳过扣费 | 执行 9.步骤5 的 handle_new_user 触发器，删除该用户重新登录 |
| 已登录仍被 401 `请先登录` | `src/middleware.ts` 未还原或 matcher 不对，session cookie 未续期 | 按 6.1 逐字还原两个 middleware 文件 |
| 轮询永远 processing | K2：jobId 断链，**预期行为** | 不修即为与原项目一致；需要闭环时按 A6 备注修复 |
| 样式全部丢失 / `text-h4` 等类无效 | globals.css 的 `@theme inline` 未完整还原，或 postcss.config.mjs 缺 `@tailwindcss/postcss` | 按 8.4 + 2.5 还原 |
| `@/types/supabase` 解析失败 | tsconfig paths 缺 `"@/types/*": ["./types/*"]` | 按 2.5 补齐两条映射 |
| build 报 params 类型错误 | Next 16 中动态路由 `params` 是 `Promise<{id}>`，需 `await` | 按 7.9/7.13 的签名写法 |
| `npm run test:run` 偶发 1 个红 | K10：fal Mock 5% 随机失败率 | 重跑 |
| 点 Navbar 的 Pricing/Templates 等 404 | K8：死链页面本就不存在 | 预期行为，不补页面 |

### 步骤 11：复现完成度自查清单

- [ ] `src/` 下恰好 35 个 `.ts/.tsx`（30 业务 + 5 测试，清单见第 3 章统计段），另有 `types/supabase/index.ts`
- [ ] 8 个 `route.ts` 共 10 个 handler，契约逐条对应 5.1 端点总表
- [ ] `MODEL_CONFIGS` 含 6 个模型且数据与 7.6 逐字一致，kling-2.5 排首
- [ ] `.env.example` 13 个键与 2.3 逐字一致（含 K1 的 FAL_API_KEY 原样保留）
- [ ] package.json：15 个 dependencies + 15 个 devDependencies，版本与 2.1 一致；next/react/react-dom/eslint-config-next 无 `^`
- [ ] `messages/` 为空目录、`CLAUDE.md` 为空文件、无 `supabase/` 目录、无 tailwind.config
- [ ] `npm run test:run` 约 37 用例全绿；`npm run lint` 0 error；`npm run build` 成功
- [ ] 步骤 9 的 A1–A10 逐项通过（A6 以"停留 generating"为准）
- [ ] 第 10 章 K1–K12 行为均被**保留**而非修复（行为一致性高于"正确性"）

<!-- SECTION 9 END -->

---

## 10. 不可文本化资产与已知问题

### 10.1 不可文本化资产清单（复现时需另行获取/创建）

| # | 资产 | 说明 | 获取方式 |
|---|---|---|---|
| R1 | **线上 Supabase schema/RLS/触发器**（最大缺口） | 仓库无 migration；本文档 4.2/9 步骤 5 为推断版 | `supabase db dump --schema public,auth` 导出后替换 9.步骤5 |
| R2 | Supabase 项目本身（URL + anon key） | 密钥不入库 | 新建项目自行生成 |
| R3 | Google OAuth Client ID/Secret | — | Google Cloud Console 新建 |
| R4 | fal.ai 账号与 API Key | 不配则 Mock | fal.ai 注册 |
| R5 | Cloudflare R2 bucket | **仅 env 占位，零代码** | 暂无需创建 |
| R6 | Creem.io / Resend / Sentry 账号 | 同上，零代码 | 暂无需创建 |
| R7 | `src/app/favicon.ico` | 二进制资产 | 任意 favicon 替代，不影响功能 |
| R8 | `public/*.svg`（5 个） | create-next-app 默认资产，业务零引用 | 脚手架自带 |
| R9 | Mock 示例视频 | 外部公开 URL（`storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`）已写在 fal.ts 中 | 无需获取 |

### 10.2 已知问题/缺陷清单（复现时**应原样保留**以保证行为一致，除非另有指示）

| 编号 | 问题 | 详情 | 影响 |
|---|---|---|---|
| K1 | **FAL_KEY / FAL_API_KEY 键名不一致** | `.env.example` 写 `FAL_API_KEY`，`fal.ts` 读 `process.env.FAL_KEY` | 按模板配键永远走 Mock；真实调用需设 `FAL_KEY` |
| K2 | **jobId 断链** | `generate` 路由丢弃 `provider.generate()` 返回的 jobId，用自建 `crypto.randomUUID()` 作记录 id；轮询时 `checkStatus(generation.id)` 查不到 job（fal.ts 对未知 id 返回 processing） | Mock 模式下生成永远不完成；真实模式同样断链 |
| K3 | webhook 路由缺失 | fal.ts 真实调用时传 `webhook_url: {BASE_URL}/api/webhook/fal`，但该路由不存在 | 真实 fal 回调打到 404 |
| K4 | 线上 Supabase schema 缺口 | 无 migration；RLS/触发器/默认 50 credits 均为推断 | 见 R1，需导出补录 |
| K5 | 生成记录非持久化 | 内存 Map，重启/热重载即丢；`generations` 表定义了但未用 | 列表/详情跨重启不可用 |
| K6 | 退款文案与实现不符 | 失败态默认文案称 "credits have been refunded"，但全仓库无任何退款逻辑（也无 credit_transactions 写入） | 失败扣扣 Credits |
| K7 | 已装未用依赖 | zod / next-intl / react-hook-form / @hookform/resolvers 源码零引用；R2/Creem/Resend/Sentry 仅 env 占位 | 无功能影响，但依赖表与实现不对称 |
| K8 | 死链页面 | 8.1 清单：/pricing、/templates、/faq、/models/*、/privacy、/terms 均 404 | 导航体验断裂 |
| K9 | 非原子扣费 | 余额检查与 update 分两步，无事务/无 `credits = credits - x` 原子表达式 | 并发请求可超扣/少扣 |
| K10 | 测试偶发红 | fal Mock 5% 随机失败率使 `completed` 用例小概率失败 | 重跑即可 |
| K11 | users 行缺失容错 | `userProfile` 为 null 时 generate 跳过余额检查与扣费（静默免费） | 无触发器时 Credits 体系形同虚设 |
| K12 | Navbar 登录态未接线 | `user` prop 无调用方传入；详情页 Retry 的 `?prompt=` 参数工作台未读取 | 登录后仍显示 Login；Retry 不回填 |

### 10.3 TODO（从代码现状推导的后续方向，非本次复现范围）

生成记录落库 `generations` 表替代内存 Map；修复 K1/K2/K3 打通真实 fal 链路；Creem 订阅 + credit_transactions 流水；R2 视频转存；失败退款；Navbar 登录态；补齐死链页面；next-intl 接入。

<!-- SECTION 10 END -->

---

## 附录 A：错误码 ⇄ HTTP 状态速查表（汇总自 5.3，复现后可用 curl 逐条验证）

| HTTP | error 码 | message（中文逐字） | 触发端点 |
|---|---|---|---|
| 400 | `missing_fields` | 请填写模型和 Prompt | POST /api/generate |
| 400 | `prompt_too_long` | Prompt 不能超过 2000 字符 | POST /api/generate |
| 400 | `invalid_model` | 模型不可用 | POST /api/generate |
| 401 | `unauthorized` | 请先登录 | 全部 requireAuth 端点 |
| 402 | `insufficient_credits` | Credits 不足，去充值（附 credits/required 字段） | POST /api/generate |
| 403 | `forbidden` | 无权访问 | GET/DELETE /api/generations/[id]（跨用户） |
| 404 | `not_found` | 记录不存在 | GET/DELETE /api/generations/[id] |
| 405 | `method_not_allowed` | — | POST /api/models |
| 429 | `rate_limited` | 请求过于频繁，稍后再试 | 协议已定义（AuthError 支持），当前无触发点 |
| 500 | `internal_error` | 服务器错误，请重试 | handleApiError 兜底 |

## 附录 B：术语对照表

| 术语 | 本文档含义 |
|---|---|
| Mock 模式 | `process.env.FAL_KEY` 未设时 FalProvider 的行为：setTimeout 8–15s 模拟完成、5% 随机失败、固定示例视频 URL |
| jobId 断链（K2） | generate 路由用自建 UUID 作记录 id，与 provider 内部 job 无关联，致轮询查不到真实状态 |
| 错误码协议 | `{ error: snake_case 码, message: 中文描述, ...附加字段 }` 的统一 JSON 错误体（require-auth.ts 定义） |
| 推断版 SQL | 从 TS 类型 Insert 可选性反推的建表语句，非线上真实 schema（见 R1/K4） |
| 行为一致性优先 | 复现目标是与原项目行为一致（含缺陷 K1–K12），而非"修正确" |
| M 档 | 本文档篇幅档位（1200–1800 行） |

<!-- APPENDIX END -->

---

> 全文完。本文档共 10 章，为 `pixelflux` 的唯一权威复现依据；复现时严格按第 9 章顺序执行，遇与线上行为不一致处优先核对第 10 章已知问题清单。
