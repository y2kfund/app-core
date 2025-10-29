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
  positions: (accountId: string, userId?: string | null) => ['positions', accountId, userId] as const,
  trades: (accountId: string) => ['trades', accountId] as const,
  cashTransactions: (accountId: string) => ['cashTransactions', accountId] as const,
  nlvMargin: (limit: number, userId?: string | null) => ['nlvMargin', limit, userId] as const,
  thesis: () => ['thesis'] as const,
  thesisConnections: () => ['thesisConnections'] as const,
  userAccountAccess: (userId: string) => ['userAccountAccess', userId] as const,
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
  computed_cash_flow_on_entry: number
  computed_cash_flow_on_exercise: number
  computed_be_price: number | null
  market_price?: number | null
  market_price_fetched_at?: string | null
  option_market_price?: number | null  // For options: the option's own market price
  underlying_market_price?: number | null  // For options: the underlying's market price
  // Remove thesis_id and thesis - will be added dynamically
  thesis?: {
    id: string
    title: string
    description?: string
  } | null
  maintenance_margin_change?: string | null
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
  parent_thesis_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserAccountAccess {
  id: string
  user_id: string
  internal_account_id: string
  granted_at?: string
  granted_by?: string
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ThesisConnection {
  id: string
  symbol_root: string
  thesis_id: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

// Helper function to fetch accessible account IDs for a user
export async function fetchUserAccessibleAccounts(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<string[]> {
  // If no userId provided, return empty array (show all data)
  if (!userId) {
    console.log('⚠️ No userId provided, showing all positions')
    return []
  }

  try {
    console.log('👤 Fetching accessible accounts for user:', userId)

    const { data: accessData, error } = await supabase
      .schema('hf')
      .from('user_account_access')
      .select('internal_account_id')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('❌ Error fetching user account access:', error)
      return []
    }

    if (!accessData || accessData.length === 0) {
      console.log('⚠️ No account access found for user, showing all positions')
      return []
    }

    const accountIds = accessData.map((row: any) => row.internal_account_id)
    console.log('✅ User has access to accounts:', accountIds)

    return accountIds
  } catch (error) {
    console.error('❌ Exception fetching account access:', error)
    return []
  }
}

// Helper function to extract symbol root
export function extractSymbolRoot(symbol: string): string | null {
  if (!symbol) return null
  const match = symbol.match(/^([A-Z]+)\b/)
  return match?.[1] || null
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
        .from('thesisMaster')
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

// Thesis connections query hook
export function useThesisConnectionsQuery() {
  const supabase = useSupabase()
  const key = queryKeys.thesisConnections()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ThesisConnection[]> => {
      const { data, error } = await supabase
        .schema('hf')
        .from('positionsAndThesisConnection')
        .select('*')
        .order('symbol_root')

      if (error) {
        console.error('❌ Thesis connections query error:', error)
        throw error
      }

      return data || []
    },
    staleTime: 300_000 // 5 minutes
  })

  return query
}

// Positions query hook
export function usePositionsQuery(accountId: string, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.positions(accountId, userId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Position[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying positions with config:', {
        accountId,
        schema: 'hf',
        table: 'positions',
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 2: Get the latest fetched_at timestamp
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

      // Step 3: Build positions query with optional access filter
      let positionsQuery = supabase
        .schema('hf')
        .from('positions')
        .select('*')
        .eq('fetched_at', latestFetchedAt)

      // Apply access filter if user has specific account access
      if (accessibleAccountIds.length > 0) {
        console.log('🔒 Applying access filter for accounts:', accessibleAccountIds)
        positionsQuery = positionsQuery.in('internal_account_id', accessibleAccountIds)
      } else {
        console.log('🔓 No access filter applied - showing all positions')
      }

      positionsQuery = positionsQuery.order('symbol')

      // Step 4: Fetch positions, accounts, thesis, and thesis connections in parallel
      const [posRes, acctRes, thesisRes, thesisConnectionsRes, marketPriceRes, aliasRes] = await Promise.all([
        positionsQuery,
        supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity'),
        supabase
          .schema('hf')
          .from('thesisMaster')
          .select('id, title, description'),
        supabase
          .schema('hf')
          .from('positionsAndThesisConnection')
          .select('*'),
        supabase
          .schema('hf')
          .rpc('get_latest_market_prices'),
        userId
          ? supabase
              .schema('hf')
              .from('user_account_alias')
              .select('internal_account_id, alias')
              .eq('user_id', userId)
          : { data: [], error: null }
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
      if (thesisConnectionsRes.error) {
        console.error('❌ Thesis connections query error:', thesisConnectionsRes.error)
        throw thesisConnectionsRes.error
      }

      let marketPriceData: any[] = []
      if (marketPriceRes.error) {
        console.error('❌ Market price query error:', marketPriceRes.error)
      } else {
        marketPriceData = marketPriceRes.data || []
        console.log(`📊 Fetched ${marketPriceData.length} market price records`)
      }

      console.log('✅ Positions query success:', {
        latestFetchedAt,
        positionsCount: posRes.data?.length,
        accountsCount: acctRes.data?.length,
        thesisCount: thesisRes.data?.length,
        thesisConnectionsCount: thesisConnectionsRes.data?.length,
        marketPricesCount: marketPriceData.length,
        filtered: accessibleAccountIds.length > 0,
        accessibleAccounts: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Map: internal_account_id -> alias
      const aliasMap = new Map<string, string>(
        (aliasRes.data || []).map((r: any) => [r.internal_account_id, r.alias])
      )

      const accounts = new Map<string, string | null | undefined>(
        (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
      )

      const thesisMap = new Map<string, any>(
        (thesisRes.data || []).map((t: any) => [t.id, { id: t.id, title: t.title, description: t.description }])
      )

      // Create symbol root -> thesis map
      const symbolRootThesisMap = new Map<string, any>()
      ;(thesisConnectionsRes.data || []).forEach((conn: any) => {
        const thesis = thesisMap.get(conn.thesis_id)
        if (thesis) {
          symbolRootThesisMap.set(conn.symbol_root, thesis)
        }
      })

      // Create market price map by conid (latest per conid)
      const marketPriceMap = new Map<string, { price: number, fetchedAt: string }>()
      for (const mp of marketPriceData) {
        if (!marketPriceMap.has(mp.conid)) {
          marketPriceMap.set(mp.conid, { price: mp.market_price, fetchedAt: mp.last_fetched_at })
        }
      }
      console.log(`📊 Processed ${marketPriceMap.size} unique conids with latest prices`)

      const positionRows = (posRes.data || []) as any[]
      const enriched: Position[] = positionRows.map((r: any) => {
        // Extract symbol root and find thesis
        const symbolRoot = extractSymbolRoot(r.symbol)
        const thesis = symbolRoot ? symbolRootThesisMap.get(symbolRoot) : null
        
        // Market price logic
        let market_price: number | null = null
        let market_price_fetched_at: string | null = null
        let option_market_price: number | null = null
        let underlying_market_price: number | null = null
        
        if (r.asset_class === 'STK' || r.asset_class === 'FUND') {
          // For stocks and funds, use conid for market price
          const priceData = marketPriceMap.get(r.conid)
          market_price = priceData?.price || null
          market_price_fetched_at = priceData?.fetchedAt || null
        } else if (r.asset_class === 'OPT') {
          // For options, get both option and underlying prices
          const optionPriceData = marketPriceMap.get(r.conid)
          const underlyingPriceData = marketPriceMap.get(r.undConid)
          
          option_market_price = optionPriceData?.price || null
          underlying_market_price = underlyingPriceData?.price || null
          
          // Set market_price to underlying price for backward compatibility (Ul CM Price)
          market_price = underlying_market_price
          market_price_fetched_at = underlyingPriceData?.fetchedAt || null
        }
        
        // Use alias if present, else default name
        let legal_entity = accounts.get(r.internal_account_id) || undefined
        if (aliasMap.has(r.internal_account_id)) {
          legal_entity = aliasMap.get(r.internal_account_id)
        }

        return {
          ...r,
          legal_entity,
          thesis,
          market_price,
          market_price_fetched_at,
          option_market_price,
          underlying_market_price,
        }
      })
      console.log('✅ Enriched positions with accounts and thesis', enriched)
      return enriched
    },
    staleTime: 60_000
  })

  // Set up Supabase Realtime subscriptions for positions and thesis connections
  const positionsChannel = supabase
    .channel(`positions:${accountId}`)
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positions', 
        event: '*', 
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  const connectionsChannel = supabase
    .channel('thesis-connections')
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positionsAndThesisConnection', 
        event: '*', 
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      positionsChannel?.unsubscribe?.()
      connectionsChannel?.unsubscribe?.()
    }
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