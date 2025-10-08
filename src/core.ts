import type { Plugin } from 'vue'
import { inject } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Injection key for Supabase
export const SUPABASE: unique symbol = Symbol.for('y2kfund.supabase')

// Core options interface
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

// Query keys
export const queryKeys = {
  positions: (accountId: string) => ['positions', accountId] as const,
  trades: (accountId: string) => ['trades', accountId] as const,
  nlvMargin: (limit: number) => ['nlvMargin', limit] as const,
  thesis: () => ['thesis'] as const,
}

// Hook to access Supabase client
export function useSupabase(): SupabaseClient {
  const client = inject<SupabaseClient | null>(SUPABASE, null)
  if (!client) throw new Error('[@y2kfund/core] Supabase client not found. Did you install createCore()?')
  return client
}

// Data types
export interface Position {
  id: number
  internal_account_id: string
  legal_entity?: string
  symbol: string
  asset_class: string
  qty: number
  price: number
  market_value: number
  unrealized_pnl: number
  avgPrice: number
  multiplier: number
  conid: string
  undConid: string
  raw_json: string
  fetched_at: string
  comment: string
  cash_flow_on_entry: number
  cash_flow_on_exercise: number
  thesis_id?: string | null
  thesis?: {
    id: string
    title: string
    description?: string
  } | null
}

export interface Trade {
  id: string
  account_id: string
  symbol: string
  asset_class: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
  trade_date: string
  settlement_date: string
  commission: number
  created_at: string
  updated_at: string
}

export interface Thesis {
  id: string
  title: string
  description?: string
  created_at?: string
  updated_at?: string
}

// Thesis query hook
export function useThesisQuery() {
  const supabase = useSupabase()
  const key = queryKeys.thesis()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Thesis[]> => {
      const { data, error } = await supabase
        .schema('hf')
        .from('thesis')
        .select('*')
        .order('title')

      if (error) {
        console.error('❌ Thesis query error:', error)
        throw error
      }

      return data || []
    },
    staleTime: 300_000 // 5 minutes - thesis data doesn't change often
  })

  return query
}

// Positions query hook
export function usePositionsQuery(accountId: string) {
  const supabase = useSupabase()
  const key = queryKeys.positions(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Position[]> => {
      console.log('🔍 Querying positions with config:', {
        accountId,
        schema: 'hf',
        table: 'positions'
      })

      // Step 1: Get the latest fetched_at timestamp
      const maxFetchedAtRes = await supabase
        .schema('hf')
        .from('positions')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (maxFetchedAtRes.error) {
        console.error('❌ Max fetched_at query error:', maxFetchedAtRes.error)
        throw maxFetchedAtRes.error
      }

      if (!maxFetchedAtRes.data || maxFetchedAtRes.data.length === 0) {
        console.log('⚠️ No positions found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.data[0].fetched_at

      console.log('📅 Latest fetched_at:', latestFetchedAt)

      // Step 2: Fetch positions, accounts, and thesis in parallel
      const [posRes, acctRes, thesisRes] = await Promise.all([
        supabase
          .schema('hf')
          .from('positions')
          .select('*')
          .eq('fetched_at', latestFetchedAt)
          .order('symbol'),
        supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity'),
        supabase
          .schema('hf')
          .from('thesis')
          .select('id, title, description')
      ])

      if (posRes.error) {
        console.error('❌ Positions query error:', posRes.error)
        throw posRes.error
      }
      if (acctRes.error) {
        console.error('❌ Accounts query error:', acctRes.error)
        throw acctRes.error
      }
      if (thesisRes.error) {
        console.error('❌ Thesis query error:', thesisRes.error)
        throw thesisRes.error
      }

      console.log('✅ Positions query success:', {
        latestFetchedAt,
        positionsCount: posRes.data?.length,
        accountsCount: acctRes.data?.length,
        thesisCount: thesisRes.data?.length
      })

      const accounts = new Map<string, string | null | undefined>(
        (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
      )

      const thesisMap = new Map<string, any>(
        (thesisRes.data || []).map((t: any) => [t.id, { id: t.id, title: t.title, description: t.description }])
      )

      const rows = (posRes.data || []) as any[]
      const enriched: Position[] = rows.map((r: any) => ({
        ...r,
        legal_entity: accounts.get(r.internal_account_id) || undefined,
        thesis: r.thesis_id ? thesisMap.get(r.thesis_id) : null,
      }))

      return enriched
    },
    staleTime: 60_000
  })

  // Set up Supabase Realtime subscription
  const channel = supabase
    .channel(`positions:${accountId}`)
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positions', 
        event: '*', 
        // listen to all changes on positions (no account filter)
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => channel?.unsubscribe?.()
  }
}

// Trades query hook  
export function useTradesQuery(accountId: string) {
  const supabase = useSupabase()
  const key = queryKeys.trades(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Trade[]> => {
      const { data, error } = await supabase
        .schema('hf')
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .order('trade_date', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    staleTime: 60_000
  })

  const channel = supabase
    .channel(`trades:${accountId}`)
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'trades', 
        event: '*', 
        filter: `account_id=eq.${accountId}` 
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => channel?.unsubscribe?.()
  }
}

// Core plugin creation
export async function createCore(opts: CoreOptions): Promise<Plugin> {
  const {
    supabaseUrl,
    supabaseAnon,
    supabaseClient,
    query,
  } = opts

  const supabase: SupabaseClient =
    supabaseClient ?? createClient(supabaseUrl, supabaseAnon)

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

  const plugin: Plugin = {
    install(app) {
      app.provide(SUPABASE, supabase)
      app.use(VueQueryPlugin, { queryClient })
    },
  }

  return plugin
}