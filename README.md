# @y2kfund/core

Core package that provides shared Supabase client, TanStack Query setup, and data hooks for the y2kfund application ecosystem.

## Features

- ✅ Single Supabase client creation and provision
- ✅ TanStack Vue Query setup with IndexedDB cache persistence
- ✅ Vue injection keys and hooks (`SUPABASE`, `useSupabase()`)
- ✅ Query key helpers (`queryKeys`)
- ✅ Data hooks (`usePositionsQuery`, `useTradesQuery`)
- ✅ Realtime subscriptions for live data updates
- ✅ No UI components - pure data layer

## Installation

```bash
npm install @y2kfund/core
```

## Quick Start

### 1. Initialize in your host app (e.g., app-dashboard)

```typescript
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

### 2. Use data hooks in components

```vue
<script setup lang="ts">
import { usePositionsQuery } from '@y2kfund/core'

const { data: positions, isLoading, isError } = usePositionsQuery('account-123')
</script>

<template>
  <div v-if="isLoading">Loading positions...</div>
  <div v-else-if="isError">Error loading positions</div>
  <div v-else>
    <div v-for="position in positions" :key="position.id">
      {{ position.symbol }}: {{ position.quantity }}
    </div>
  </div>
</template>
```

## API Reference

### `createCore(options: CoreOptions): Promise<Plugin>`

Creates the core Vue plugin that sets up Supabase and TanStack Query.

### `usePositionsQuery(accountId: string)`

Hook to fetch positions from the `hf.positions` table with realtime updates.

### `useTradesQuery(accountId: string)`

Hook to fetch trades from the `hf.trades` table with realtime updates.

### `useSupabase(): SupabaseClient`

Hook to access the provided Supabase client.

### `queryKeys`

Centralized query key helpers to avoid cache drift.

## Architecture

This package is the single source of truth for:
- Supabase client creation
- TanStack Query configuration
- Data fetching hooks
- Query key management

Consumer apps should NOT create their own Supabase or Query clients.
