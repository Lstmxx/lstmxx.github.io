---
title: Next.js + tRPC + Turborepo 最佳实践指南
date: 2025-11-28 16:28:56
tags: 
  - Next.js
  - tRPC
  - Turborepo
  - 最佳实践
categories: 
  - Next.js
  - tRPC
  - Turborepo
  - 最佳实践
  - 全栈
---

在现代全栈开发中，**Turborepo** (Monorepo)、**Next.js** 和 **tRPC** 的组合构建了一套强大的企业级全栈架构。这种架构的核心优势在于**极致的类型安全**和**代码复用**。

本文将结合实际项目代码，介绍如何在 Turborepo 环境下搭建一套高效的 Next.js + tRPC 开发架构。

## 1. 架构设计：关注点分离

在 Monorepo 中，我们通常将 tRPC 的核心定义抽离为一个独立的 Package，供不同的 App 消费。

### 1.1 项目结构

```text
.
├── apps
│   └── dashboard (Next.js)
│       ├── src
│       │   ├── app
│       │   │   └── api
│       │   │       └── trpc
│       │   │           └── [trpc]
│       │   │               └── route.ts # tRPC API Handler
│       │   ├── lib
│       │   │   └── trpc
│       │   │       ├── client.tsx       # tRPC Provider & Client 实例
│       │   │       └── query-client.ts  # React Query 配置
│       │   └── components
│       │       └── ...                  # UI 组件调用
│       └── package.json
└── packages
    └── api
        ├── src
        │   ├── routers              # 业务路由模块 (如 apiKey.ts)
        │   ├── trpc.ts              # tRPC 初始化 & 中间件
        │   ├── router.ts            # Router & Procedure 定义
        │   └── context.ts           # Context 定义
        ├── index.ts                 # 导出 AppRouter 类型
        └── package.json
```

### 1.2 核心职责

- **`packages/api`**: **单一数据源**。包含 Router 定义、Zod Schema 和 Procedure 实现。
- **`apps/dashboard`**: **消费者**。导入 `packages/api` 的类型定义，通过 tRPC Client 调用接口。

## 2. 核心定义 (`packages/api`)

这是整个系统的"心脏"。我们在 `packages/api` 中定义所有的业务逻辑。

### 2.1 初始化与中间件 (`src/trpc.ts`)

在 `trpc.ts` 中，我们初始化 tRPC 实例，并定义通用的中间件（如鉴权）。

```typescript
// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

// 1. 初始化 tRPC，注入 Context 类型
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape
  },
})

// 2. 定义鉴权中间件
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' })
  }
  return next({
    ctx: {
      // 这里的 session 和 user 在后续流程中将变为非空
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})

// 3. 导出基础构建块
export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthenticated)
```

### 2.2 定义 Router (`src/router.ts`)

使用导出的 `router` 构建 API 路由树。

```typescript
// packages/api/src/router.ts
import { router } from './trpc'
import { apiKeyRouter } from './routers/apiKey'

export const appRouter = router({
  apiKeyManager: apiKeyRouter, // 挂载子路由
})

// 关键：导出 AppRouter 类型！
export type AppRouter = typeof appRouter
```

## 3. Next.js 客户端集成 (`apps/dashboard`)

在 Next.js 应用中，我们需要配置 `QueryClient` 和 `TRPCProvider`。

### 3.1 配置 QueryClient (`src/lib/trpc/query-client.ts`)

为了支持 SSR 和复杂的数据序列化（如 Date, Map, Set），我们通常配合 `superjson` 使用。

```typescript
// apps/dashboard/src/lib/trpc/query-client.ts
import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import superjson from 'superjson'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 默认缓存 30秒
      },
      dehydrate: {
        serializeData: superjson.serialize, // 使用 superjson 序列化
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending', // 支持 pending 状态的水合
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  })
}
```

### 3.2 创建 Provider (`src/lib/trpc/client.tsx`)

这里使用了 **Singleton 模式** 来确保在客户端只创建一个 QueryClient 实例，避免 React 重渲染时状态丢失。

```tsx
// apps/dashboard/src/lib/trpc/client.tsx
'use client'

import { useState } from 'react'
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from './query-client'
import type { AppRouter } from '@octopus/api'

// 1. 创建强类型 Hooks
export const trpc = createTRPCReact<AppRouter>()

// 2. QueryClient 单例模式 (避免 Browser 端重复创建)
let clientQueryClientSingleton: QueryClient
function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient() // Server 端每次新建
  }
  return (clientQueryClientSingleton ??= makeQueryClient()) // Browser 端复用
}

// 3. TRPCProvider 组件
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => true }), // 启用日志
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`, // 指向 API 地址
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

### 3.3 API 路由处理 (`src/app/api/trpc/[trpc]/route.ts`)

Next.js 需要一个 API 路由来处理来自客户端的 tRPC 请求。我们使用 `@trpc/server/adapters/fetch` 适配器。

```typescript
// apps/dashboard/src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@octopus/api'
import { createContextFactory } from '@octopus/api/context'
import { auth } from '@/lib/auth'

// 注入 Auth Context
const createContext = createContextFactory(auth)

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
```

## 4. 实战案例

在组件中，我们可以直接使用 Hooks 调用接口，**全程拥有类型提示**。

### 4.1 获取数据 (useQuery)

```tsx
// apps/dashboard/src/components/api-keys/key-list.tsx
'use client'
import { trpc } from '@/lib/trpc/client'

export function KeyList() {
  // 1. 调用 Query
  // 参数和返回值都有完整的类型推断
  const { data, isLoading } = trpc.apiKeyManager.list.useQuery({
    page: 1,
    pageSize: 10,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.data.map((key) => (
        <li key={key.id}>
          {key.name} ({key.platform})
        </li>
      ))}
    </ul>
  )
}
```

### 4.2 修改数据 (useMutation)

```tsx
// apps/dashboard/src/components/api-keys/create-form.tsx
'use client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export function CreateKeyForm() {
  const [name, setName] = useState('')
  const utils = trpc.useUtils()

  // 1. 定义 Mutation
  const createKey = trpc.apiKeyManager.create.useMutation({
    onSuccess: () => {
      // 2. 成功后自动刷新列表
      utils.apiKeyManager.list.invalidate()
      alert('创建成功！')
    },
  })

  const handleSubmit = () => {
    // 3. 触发 Mutation
    createKey.mutate({
      name,
      platform: 'openai',
      key: 'sk-...',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-4',
    })
  }

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={createKey.isPending}>
        {createKey.isPending ? 'Creating...' : 'Create'}
      </button>
    </div>
  )
}
```

## 5. 为什么选择这种架构？

1.  **跨端类型安全**: 修改 `packages/api` 中的 Zod Schema，Next.js 前端会立即出现红色波浪线报错。重构变得不再可怕。
2.  **构建性能**: Turborepo 的缓存机制确保只有变动的 Package 会被重新构建。
3.  **高级特性支持**: 通过 `superjson` 支持 Date/Map/Set 等复杂数据类型的无缝传输，无需手动转换。
4.  **状态管理**: 集成 React Query，自动处理缓存、重试、分页和无限加载，极大简化前端逻辑。

通过这种实践，我们不仅实现了代码的物理分离（Monorepo），更实现了逻辑上的紧密耦合（Type Safety），是开发中大型全栈应用的理想选择。
