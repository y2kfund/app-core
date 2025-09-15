# AGENTS.md — y2kfund/app-core

# AGENTS.md — y2kfund/app-core

**Purpose:** This repo contains **app-core**, published as `@y2kfund/core`.  
It provides a simplified, all-in-one solution for:
- **Supabase** client creation & provision
- **TanStack Vue Query** setup with in-memory caching
- **Query hooks** (`usePositionsQuery`, `useTradesQuery`) with built-in realtime updates
- **Shared types** (Position, Trade, etc.)

**Used by:** `app-dashboard`, `app-positions`, `app-trades`, and other apps in the org.

---

## 1) Responsibilities (simplified)

- Initialize **exactly one** `SupabaseClient` and **one** `QueryClient` for the host app.
- Install **TanStack Vue Query** with in-memory caching.
- Provide the Supabase client via a **Vue injection key** and expose a `useSupabase()` hook.
- Ship **ready-to-use query hooks** with built-in realtime subscriptions for positions and trades.
- Export **all necessary types** and utilities from a single entry point.
- **Everything in one file:** All code consolidated into `src/core.ts` for simplicity.

> Downstream apps **must not** create their own Supabase or Query clients. They consume what app-core provides.

---

## 2) Public API (what downstream apps can import)

```ts
// @y2kfund/core
export interface CoreOptions {
  supabaseUrl: string
  supabaseAnon: string
  supabaseClient?: SupabaseClient
  query?: {
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
  }
}

/** Creates the core plugin that initializes Supabase + Query */
export async function createCore(opts: CoreOptions): Promise<Plugin>

/** Hook to access the provided Supabase client */
export function useSupabase(): SupabaseClient

/** Ready-to-use query hooks with realtime subscriptions */
export function usePositionsQuery(accountId: string)
export function useTradesQuery(accountId: string)

/** Shared query keys */
export const queryKeys: {
  positions: (accountId: string) => readonly ['positions', string]
  trades: (accountId: string) => readonly ['trades', string]
}

/** Data types */
export interface Position { /* ... */ }
export interface Trade { /* ... */ }
```

---

## 3) Simplified File Structure

```
src/
  core.ts             # ALL implementation in one file
  index.ts            # single export: export * from './core'
package.json
vite.config.ts
tsconfig.json
README.md
AGENTS.md
```

**Why one file?** 
- Eliminates artificial abstractions and file splitting
- Easier to understand and maintain
- No need to navigate between multiple tiny files
- All related functionality is co-located

---

## 4) Implementation highlights

All code is in `src/core.ts`:

- **Injection key & hook:** `SUPABASE` symbol and `useSupabase()` function
- **Query keys:** Simple object with positions and trades keys
- **Data types:** Position and Trade interfaces
- **Query hooks:** `usePositionsQuery` and `useTradesQuery` with built-in realtime
- **Core plugin:** `createCore()` function that sets everything up

**Key simplifications made:**
- ✅ Consolidated 6 separate files into 1
- ✅ Removed unused query keys and features
- ✅ Eliminated over-abstraction
- ✅ Removed IndexedDB persistence (unnecessary complexity)
- ✅ Built-in realtime subscriptions in query hooks
- ✅ Single source of truth for all exports

---

## 5) Usage examples

### In a host app (e.g., app-dashboard)
```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createCore } from '@y2kfund/core'

const core = await createCore({
  supabaseUrl: import.meta.env.VITE_SUPA_URL,
  supabaseAnon: import.meta.env.VITE_SUPA_ANON,
  query: { staleTime: 60_000, refetchOnWindowFocus: false }
})

createApp(App).use(core).mount('#app')
```

### In a component (e.g., app-positions)
```ts
import { usePositionsQuery } from '@y2kfund/core'

const q = usePositionsQuery(accountId)
// q.data.value contains positions with automatic realtime updates
// q._cleanup() unsubscribes from realtime when component unmounts
```

---

## 6) Build & Package

**Build:** ESM library only, external Vue and TanStack Query
**Package:** Private GitHub Packages as `@y2kfund/core`  
**Version:** SemVer for API stability

---

## 7) Definition of done

- ✅ Single `src/core.ts` file with all functionality
- ✅ `pnpm build` produces clean `dist/` ESM library
- ✅ Query hooks work with realtime subscriptions
- ✅ Published as `@y2kfund/core` on GitHub Packages
- ✅ Downstream apps can consume without complexity

---

## 1) Responsibilities (authoritative)

- Initialize **exactly one** `SupabaseClient` and **one** `QueryClient` for the host app.
- Install **TanStack Vue Query** and **persist the cache** to IndexedDB.
- Provide the Supabase client via a **Vue injection key** and expose a `useSupabase()` hook.
- Expose **stable, namespaced query keys** via `queryKeys` to avoid drift.
- Ship **no UI and no global CSS**. Keep this package **small and stable**.
- **Code organization:** **Strong preference that each code file should be less than 300 lines.** When files approach this limit, consider extracting utility functions, splitting complex initialization logic, or creating focused helper modules.

> Downstream apps **must not** create their own Supabase or Query clients. They consume what app-core provides.

---

## 2) Public API (what downstream apps can import)

```ts
// @y2kfund/core
export interface CoreOptions {
  supabaseUrl: string
  supabaseAnon: string
  /** Optional: override to pass an existing Supabase instance instead of creating one */
  supabaseClient?: import('@supabase/supabase-js').SupabaseClient
  /** TanStack Query defaults */
  query?: {
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
  }
  /** Persisted cache (IndexedDB) options */
  idb?: { databaseName?: string; storeName?: string }
  /** Bump to invalidate all persisted caches (e.g., schema changes) */
  buster?: string
}

/** Creates the core plugin that initializes Supabase + Query + IDB persistence */
export async function createCore(opts: CoreOptions): Promise<import('vue').Plugin>

/** Injection key for Supabase (advanced use) */
export const SUPABASE: unique symbol

/** Hook to access the provided Supabase client (throws if missing) */
export function useSupabase(): import('@supabase/supabase-js').SupabaseClient

/** Shared query keys (extend in this package only) */
export const queryKeys: {
  positions: (accountId: string) => readonly ['positions', string]
  trades: (accountId: string) => readonly ['trades', string]
  // add more here and keep existing signatures stable
}
```

**Versioning:** This API is **SemVer**-governed. Changing signatures or behaviors that break downstream apps requires a **major** version bump.

---

## 3) File/folder layout

```
src/
  index.ts            # public exports
  core.ts             # createCore implementation
  keys.ts             # SUPABASE injection key
  useSupabase.ts      # hook to inject/validate client
  queryKeys.ts        # centralized query key helpers
  types.ts            # CoreOptions etc.
  utils/
    realtime.ts       # (optional) helpers for realtime invalidation
package.json
vite.config.ts
tsconfig.json
README.md
AGENTS.md
```

---

## 4) Implementation outlines

### `src/keys.ts`
```ts
export const SUPABASE: unique symbol = Symbol('supabase')
```

### `src/useSupabase.ts`
```ts
import { inject } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE } from './keys'

export function useSupabase(): SupabaseClient {
  const client = inject<SupabaseClient | null>(SUPABASE, null)
  if (!client) throw new Error('[@y2kfund/core] Supabase client not found. Did you install createCore()?')
  return client
}
```

### `src/queryKeys.ts`
```ts
export const queryKeys = {
  positions: (accountId: string) => ['positions', accountId] as const,
  trades: (accountId: string) => ['trades', accountId] as const,
  // Extend here only. Keep existing keys stable to preserve caches.
}
```

### `src/types.ts`
```ts
export interface CoreOptions {
  supabaseUrl: string
  supabaseAnon: string
  supabaseClient?: import('@supabase/supabase-js').SupabaseClient
  query?: {
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
  }
  idb?: { databaseName?: string; storeName?: string }
  buster?: string
}
```

### `src/core.ts`
```ts
import type { Plugin } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createIDBPersister } from '@tanstack/query-persist-client-idb'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE } from './keys'
import type { CoreOptions } from './types'

export async function createCore(opts: CoreOptions): Promise<Plugin> {
  const {
    supabaseUrl,
    supabaseAnon,
    supabaseClient,
    query,
    idb,
    buster = 'v1',
  } = opts

  // 1) Supabase client (create or use provided)
  const supabase: SupabaseClient =
    supabaseClient ?? createClient(supabaseUrl, supabaseAnon)

  // 2) TanStack Query client with sane defaults
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: query?.staleTime ?? 60_000,
        gcTime: query?.gcTime ?? 86_400_000,
        refetchOnWindowFocus: query?.refetchOnWindowFocus ?? false,
        refetchOnReconnect: query?.refetchOnReconnect ?? true,
      },
    },
  })

  // 3) Persist cache to IndexedDB
  const persister = await createIDBPersister({
    databaseName: idb?.databaseName ?? 'y2k-cache',
    storeName: idb?.storeName ?? 'tanstack',
  })

  await persistQueryClient({
    queryClient,
    persister,
    maxAge: query?.gcTime ?? 86_400_000,
    buster,
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => q.state.status === 'success',
    },
  })

  // 4) Return Vue plugin
  const plugin: Plugin = {
    install(app) {
      // Provide Supabase client
      app.provide(SUPABASE, supabase)
      // Install Vue Query with our client
      app.use(VueQueryPlugin, { queryClient })
    },
  }

  return plugin
}
```

### `src/index.ts`
```ts
export { createCore } from './core'
export { SUPABASE } from './keys'
export { useSupabase } from './useSupabase'
export { queryKeys } from './queryKeys'
export * from './types'
```

---

## 5) Usage examples

### In a host app (e.g., app-dashboard)
```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createCore } from '@y2kfund/core'

const core = await createCore({
  supabaseUrl: import.meta.env.VITE_SUPA_URL,
  supabaseAnon: import.meta.env.VITE_SUPA_ANON,
  idb: { databaseName: 'y2k-cache', storeName: 'tanstack' },
  query: { staleTime: 60_000, gcTime: 86_400_000, refetchOnWindowFocus: false },
  buster: 'v1'
})

createApp(App).use(core).mount('#app')
```

### In a downstream app/component (e.g., app-positions)
```ts
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, queryKeys } from '@y2kfund/core'

export function usePositions(accountId: string) {
  const supabase = useSupabase()
  const key = queryKeys.positions(accountId)
  const qc = useQueryClient()
  // ...
}
```

---

## 6) Build config (library ESM only)

**`vite.config.ts`**
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'Y2kfundCore',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', '@tanstack/vue-query', '@supabase/supabase-js']
    }
  }
})
```

---

## 7) Package metadata (private GitHub Packages)

**`package.json` (key fields)**
```json
{
  "name": "@y2kfund/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "repository": "github:y2kfund/app-core",
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "peerDependencies": {
    "vue": "^3.4.0",
    "@tanstack/vue-query": "^5.0.0"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/query-persist-client-core": "^5.0.0",
    "@tanstack/query-persist-client-idb": "^5.0.0"
  },
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "release": "npm publish --access restricted"
  }
}
```

**`.npmrc`**
```
@y2kfund:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_TOKEN}
always-auth=true
```

**CI publish on tag** — `.github/workflows/release.yml`
```yaml
name: release
on:
  push:
    tags: ['v*.*.*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: npm publish --access restricted
        env:
          GH_PACKAGES_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 8) Do / Don’t

- ✅ Be the **only** place that creates Supabase + Query clients.
- ✅ Keep API **minimal and stable**; extend `queryKeys` here only.
- ✅ Make all helpers **framework-idiomatic** (Vue 3, Composition API).
- ❌ Don’t ship UI or global CSS.
- ❌ Don’t embed secrets; host apps pass env values to `createCore`.
- ❌ Don’t add heavy utilities; prefer tiny, focused helpers.

---

## 9) Definition of done

- `pnpm build` produces `dist/` (ESM library).
- `createCore()` plugin initializes Supabase + Query + IDB persistence successfully.
- Downstream app (e.g., app-positions) can import `useSupabase()` and `queryKeys` and render against real data.
- Package published privately as **`@y2kfund/core`** on GitHub Packages.
