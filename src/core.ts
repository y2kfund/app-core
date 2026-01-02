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
  orders: (accountId: string) => ['orders', accountId] as const,
  cashTransactions: (accountId: string) => ['cashTransactions', accountId] as const,
  transfers: (accountId: string) => ['transfers', accountId] as const,
  nlvMargin: (limit: number, userId?: string | null) => ['nlvMargin', limit, userId] as const,
  settledCash: (limit: number, userId?: string | null) => ['settledCash', limit, userId] as const,
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
  contract_quantity?: number | null
  accounting_quantity?: number | null
}

export interface Trade {
  id: string
  accountId: string
  internal_account_id: string
  legal_entity?: string  // Legal entity name from user_accounts_master
  symbol: string
  assetCategory: string
  quantity: string  // Note: quantity is text in DB
  tradePrice: string // Note: price fields are text in DB
  buySell: string   // This is the side field
  tradeDate: string
  settleDateTarget: string
  ibCommission: string
  fetched_at: string
  // Add other commonly used fields
  description?: string
  currency?: string
  netCash?: string
  proceeds?: string
  fifoPnlRealized?: string
  openCloseIndicator?: string
  multiplier?: string
  mtmPnl?: string
  closePrice?: string
  underlyingSymbol?: string
  putCall?: string
  strike?: string
  expiry?: string
  tradeID?: string  // <-- This is what we'll use for mapping
  conid?: string
  underlyingConid?: string
  tradeMoney?: string
  contact_quantity?: number | null
  accounting_quantity?: number | null
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

export interface SymbolComment {
  id: number
  comment_key: string
  user_id: string
  comment: string
  updated_at: string
}

export interface PositionTradeMapping {
  id: number
  user_id: string
  mapping_key: string
  trade_id: string
  created_at: string
  updated_at: string
}

export interface PositionPositionMapping {
  id: number
  user_id: string
  mapping_key: string
  attached_position_key: string
  created_at: string
  updated_at: string
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

export function generatePositionMappingKey(position: {
  internal_account_id: string
  symbol: string
  contract_quantity: number
  asset_class: string
  conid: string
}): string {
  // Create a stable key from multiple columns
  return `${position.internal_account_id}|${position.symbol}|${position.contract_quantity}|${position.asset_class}|${position.conid}`
}

// Fetch position-position mappings for a user
export async function fetchPositionPositionMappings(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, Set<string>>> {
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('position_position_mappings')
      .select('mapping_key, attached_position_key')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error fetching position-position mappings:', error)
      return new Map()
    }

    const mappings = new Map<string, Set<string>>()
    
    if (data) {
      data.forEach((row: any) => {
        if (!mappings.has(row.mapping_key)) {
          mappings.set(row.mapping_key, new Set())
        }
        mappings.get(row.mapping_key)!.add(row.attached_position_key)
      })
    }

    return mappings
  } catch (error) {
    console.error('❌ Exception fetching position-position mappings:', error)
    return new Map()
  }
}

// Save position-position mappings
export async function savePositionPositionMappings(
  supabase: SupabaseClient,
  userId: string,
  mappingKey: string,
  positionKeys: Set<string>
): Promise<void> {
  try {
    // Delete existing mappings
    const { error: deleteError } = await supabase
      .schema('hf')
      .from('position_position_mappings')
      .delete()
      .eq('user_id', userId)
      .eq('mapping_key', mappingKey)

    if (deleteError) {
      console.error('❌ Error deleting old mappings:', deleteError)
      throw deleteError
    }

    // Insert new mappings if any
    if (positionKeys.size > 0) {
      const records = Array.from(positionKeys).map(positionKey => ({
        user_id: userId,
        mapping_key: mappingKey,
        attached_position_key: positionKey,
        updated_at: new Date().toISOString()
      }))

      const { error: upsertError } = await supabase
        .schema('hf')
        .from('position_position_mappings')
        .upsert(records, {
          onConflict: 'user_id,mapping_key,attached_position_key',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('❌ Error upserting new mappings:', upsertError)
        throw upsertError
      }
    }

    console.log('✅ Successfully saved position-position mappings:', {
      userId,
      mappingKey,
      positionCount: positionKeys.size
    })
  } catch (error) {
    console.error('❌ Exception saving position-position mappings:', error)
    throw error
  }
}

// Query hook for position-position mappings
export function usePositionPositionMappingsQuery(userId: string | undefined | null) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['positionPositionMappings', userId],
    queryFn: async (): Promise<Map<string, Set<string>>> => {
      if (!userId) return new Map()
      return await fetchPositionPositionMappings(supabase, userId)
    },
    enabled: !!userId,
    staleTime: 60_000
  })
}

// Fetch position-trade mappings for a user
export async function fetchPositionTradeMappings(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, Set<string>>> {
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('position_trade_mappings')
      .select('mapping_key, trade_id')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error fetching position trade mappings:', error)
      return new Map()
    }

    const mappings = new Map<string, Set<string>>()
    
    if (data) {
      data.forEach((row: any) => {
        if (!mappings.has(row.mapping_key)) {
          mappings.set(row.mapping_key, new Set())
        }
        mappings.get(row.mapping_key)!.add(row.trade_id)
      })
    }

    return mappings
  } catch (error) {
    console.error('❌ Exception fetching position trade mappings:', error)
    return new Map()
  }
}

// Save position-trade mappings for a user
export async function savePositionTradeMappings(
  supabase: SupabaseClient,
  userId: string,
  mappingKey: string,
  tradeIds: Set<string>
): Promise<void> {
  try {
    // First, delete existing mappings for this position
    const { error: deleteError } = await supabase
      .schema('hf')
      .from('position_trade_mappings')
      .delete()
      .eq('user_id', userId)
      .eq('mapping_key', mappingKey)

    if (deleteError) {
      console.error('❌ Error deleting old mappings:', deleteError)
      throw deleteError
    }

    // Then insert new mappings if any
    if (tradeIds.size > 0) {
      const records = Array.from(tradeIds).map(tradeId => ({
        user_id: userId,
        mapping_key: mappingKey,
        trade_id: tradeId,
        updated_at: new Date().toISOString()
      }))

      // Use upsert to handle any race conditions
      const { error: upsertError } = await supabase
        .schema('hf')
        .from('position_trade_mappings')
        .upsert(records, {
          onConflict: 'user_id,mapping_key,trade_id',
          ignoreDuplicates: false // Update the updated_at if already exists
        })

      if (upsertError) {
        console.error('❌ Error upserting new mappings:', upsertError)
        throw upsertError
      }
    }

    console.log('✅ Successfully saved position-trade mappings:', {
      userId,
      mappingKey,
      tradeCount: tradeIds.size
    })
  } catch (error) {
    console.error('❌ Exception saving position trade mappings:', error)
    throw error
  }
}

// Query hook for position-trade mappings
export function usePositionTradeMappingsQuery(userId: string | undefined | null) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['positionTradeMappings', userId],
    queryFn: async (): Promise<Map<string, Set<string>>> => {
      if (!userId) return new Map()
      return await fetchPositionTradeMappings(supabase, userId)
    },
    enabled: !!userId,
    staleTime: 60_000 // 1 minute
  })
}

export function generateCommentKey(position: {
  internal_account_id: string
  symbol: string
  qty: number
  contract_quantity?: number | null
  asset_class: string
  conid: string
}): string {
  // Create a stable key from multiple columns
  // Use contract_quantity if available, otherwise fall back to qty
  const quantity = position.contract_quantity ?? position.qty
  return `${position.internal_account_id}|${position.symbol}|${quantity}|${position.asset_class}|${position.conid}`
}

// Fetch comments for all symbol roots for a user
export function useSymbolCommentsQuery(userId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['symbolComments', userId],
    queryFn: async (): Promise<SymbolComment[]> => {
      const { data, error } = await supabase
        .schema('hf')
        .from('positions_symbol_comments')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return data || []
    },
    staleTime: 60_000
  })
}

// Upsert a comment for a symbol root
export async function upsertSymbolComment(supabase: any, commentKey: string, user_id: string, comment: string) {
  const { error } = await supabase
    .schema('hf')
    .from('positions_symbol_comments')
    .upsert({
      comment_key: commentKey,
      user_id,
      comment,
      updated_at: new Date().toISOString()
    }, { onConflict: 'comment_key,user_id' })
  if (error) throw error
}

export async function fetchPositionOrderMappings(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, Set<string>>> {
  try {
    const { data, error } = await supabase
      .schema('hf')
      .from('position_order_mappings')
      .select('mapping_key, order_id')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error fetching position-order mappings:', error)
      return new Map()
    }

    const mappings = new Map<string, Set<string>>()
    if (data) {
      data.forEach((row: any) => {
        if (!mappings.has(row.mapping_key)) {
          mappings.set(row.mapping_key, new Set())
        }
        mappings.get(row.mapping_key)!.add(row.order_id)
      })
    }
    return mappings
  } catch (error) {
    console.error('❌ Exception fetching position-order mappings:', error)
    return new Map()
  }
}

// Save position-order mappings for a user
export async function savePositionOrderMappings(
  supabase: SupabaseClient,
  userId: string,
  mappingKey: string,
  orderIds: Set<string>
): Promise<void> {
  try {
    // Delete existing mappings for this position
    const { error: deleteError } = await supabase
      .schema('hf')
      .from('position_order_mappings')
      .delete()
      .eq('user_id', userId)
      .eq('mapping_key', mappingKey)

    if (deleteError) {
      console.error('❌ Error deleting old order mappings:', deleteError)
      throw deleteError
    }

    // Insert new mappings if any
    if (orderIds.size > 0) {
      const records = Array.from(orderIds).map(orderId => ({
        user_id: userId,
        mapping_key: mappingKey,
        order_id: orderId,
        updated_at: new Date().toISOString()
      }))

      const { error: upsertError } = await supabase
        .schema('hf')
        .from('position_order_mappings')
        .upsert(records, {
          onConflict: 'user_id,mapping_key,order_id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('❌ Error upserting new order mappings:', upsertError)
        throw upsertError
      }
    }

    console.log('✅ Successfully saved position-order mappings:', {
      userId,
      mappingKey,
      orderCount: orderIds.size
    })
  } catch (error) {
    console.error('❌ Exception saving position-order mappings:', error)
    throw error
  }
}

// Query hook for position-order mappings
export function usePositionOrderMappingsQuery(userId: string | undefined | null) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['positionOrderMappings', userId],
    queryFn: async (): Promise<Map<string, Set<string>>> => {
      if (!userId) return new Map()
      return await fetchPositionOrderMappings(supabase, userId)
    },
    enabled: !!userId,
    staleTime: 60_000
  })
}

// Positions query hook
export function usePositionsQuery(accountId: string, userId?: string | null, asOfDate?: string | null) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  // Use computed value for queryKey
  const getAsOf = () =>
    asOfDate && typeof asOfDate === 'object' && 'value' in asOfDate
      ? asOfDate.value
      : asOfDate
  const key = [...queryKeys.positions(accountId, userId), getAsOf()]

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Position[]> => {
      const asOf = getAsOf()

      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying positions with asOf:', asOf)

      // If no access filter, fetch all unique account IDs from positions table
      let accountIds: string[] = accessibleAccountIds
      if (accountIds.length === 0) {
        const { data: allAccounts, error: allAccountsError } = await supabase
          .schema('hf')
          .from('positions')
          .select('internal_account_id')
          .neq('internal_account_id', null)
          .then((res) => ({ data: res.data?.map((r: any) => r.internal_account_id) ?? [], error: res.error }))
        if (allAccountsError) {
          console.error('❌ Error fetching all account IDs:', allAccountsError)
          return []
        }
        accountIds = Array.from(new Set(allAccounts))
      }

      // Step 2: For each account, get its latest fetched_at (or as of date)
      let fetchedAtRows
      if (asOf) {
        // Get the latest fetched_at <= asOfDate for each account
        const { data, error } = await supabase
          .schema('hf')
          .rpc('get_latest_fetched_at_per_account', {
            account_ids: accountIds,
            as_of_date: asOf
          })
        if (error) {
          console.error('❌ Error fetching as-of fetched_at:', error)
          throw error
        }
        fetchedAtRows = data || []
      } else {
        // For latest fetched_at
        const { data, error } = await supabase
          .schema('hf')
          .from('positions')
          .select('internal_account_id, fetched_at')
          .in('internal_account_id', accountIds)
          .order('fetched_at', { ascending: false })
        if (error) {
          console.error('❌ Error fetching latest fetched_at per account:', error)
          throw error
        }
        fetchedAtRows = data || []
      }

      // Map: accountId -> fetched_at
      const latestFetchedAtMap = new Map<string, string>()
      for (const row of fetchedAtRows) {
        if (!latestFetchedAtMap.has(row.internal_account_id)) {
          latestFetchedAtMap.set(row.internal_account_id, row.fetched_at)
        }
      }

      // Step 3: Fetch positions for each account at its latest fetched_at
      const positionsPromises = Array.from(latestFetchedAtMap.entries()).map(
        ([accountId, fetchedAt]) =>
          supabase
            .schema('hf')
            .from('positions')
            .select('*')
            .eq('internal_account_id', accountId)
            .eq('fetched_at', fetchedAt)
      )
      const positionsResults = await Promise.all(positionsPromises)
      const positionRows = positionsResults.flatMap(res => res.data || [])

      console.log('🔍 Querying positions with config:', {
        accountId,
        schema: 'hf',
        table: 'positions',
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 4: Fetch positions, accounts, thesis, and thesis connections in parallel
      const [posRes, acctRes, thesisRes, thesisConnectionsRes, marketPriceRes, aliasRes] = await Promise.all([
        positionsResults[0],
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

/**
 * Fetch positions that match the symbol root of a given position
 * Used for attaching related positions in the UI
 */
export async function fetchPositionsBySymbolRoot(
  supabase: SupabaseClient,
  symbolRoot: string,
  userId?: string | null,
  internalAccountId?: string | null
): Promise<Position[]> {
  try {
    console.log('🔍 Fetching positions for symbol root:', symbolRoot, 'account:', internalAccountId)

    // Step 1: Fetch accessible accounts for the user
    const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

    // Step 2: Build the query - filter by symbol pattern and account
    let query = supabase
      .schema('hf')
      .from('positions')
      .select('*')
      .ilike('symbol', `${symbolRoot}%`) // Symbol starts with the root

    // Filter by specific account
    if (internalAccountId) {
      query = query.eq('internal_account_id', internalAccountId)
    }

    // Step 3: Apply account access filter if user has limited access
    if (accessibleAccountIds.length > 0) {
      query = query.in('internal_account_id', accessibleAccountIds)
    }

    // Step 4: Order by fetched_at (latest first)
    query = query.order('fetched_at', { ascending: false })

    const { data: positionRows, error: posError } = await query

    if (posError) {
      console.error('❌ Error fetching positions by symbol root:', posError)
      throw posError
    }

    console.log('📊 Fetched positions count:', positionRows?.length || 0)

    // Step 5: Deduplicate positions by symbol, contract_quantity, and avgPrice
    // Keep only the first occurrence (latest fetched_at due to ordering)
    const seenPositions = new Map<string, any>()
    const deduplicatedRows = (positionRows || []).filter((row: any) => {
      // Use contract_quantity for options, qty for others
      const quantity = row.contract_quantity ?? row.qty
      const dedupeKey = `${row.internal_account_id}|${row.symbol}|${quantity}|${row.asset_class}|${row.conid}`
      
      if (seenPositions.has(dedupeKey)) {
        return false // Skip duplicate
      }
      
      seenPositions.set(dedupeKey, row)
      return true
    })

    console.log('📊 Deduplicated positions count:', deduplicatedRows.length, 
      `(removed ${(positionRows?.length || 0) - deduplicatedRows.length} duplicates)`)

    // Step 6: Fetch account data and aliases
    const [acctRes, aliasRes] = await Promise.all([
      supabase
        .schema('hf')
        .from('user_accounts_master')
        .select('internal_account_id, legal_entity'),
      userId
        ? supabase
            .schema('hf')
            .from('user_account_alias')
            .select('internal_account_id, alias')
            .eq('user_id', userId)
        : { data: [], error: null }
    ])

    // Step 7: Build lookup maps
    const aliasMap = new Map<string, string>(
      (aliasRes.data || []).map((r: any) => [r.internal_account_id, r.alias])
    )

    const accounts = new Map<string, string | null | undefined>(
      (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
    )

    // Step 8: Enrich positions with account names/aliases only
    const enriched: Position[] = deduplicatedRows.map((r: any) => {
      let legal_entity = accounts.get(r.internal_account_id) || undefined
      if (aliasMap.has(r.internal_account_id)) {
        legal_entity = aliasMap.get(r.internal_account_id)
      }

      return {
        ...r,
        legal_entity,
        thesis: null,
        market_price: null,
        market_price_fetched_at: null,
        option_market_price: null,
        underlying_market_price: null,
      }
    })

    console.log('✅ Fetched and enriched positions by symbol root:', {
      symbolRoot,
      account: internalAccountId,
      total: positionRows?.length || 0,
      unique: enriched.length,
      filtered: accessibleAccountIds.length > 0
    })

    return enriched
  } catch (error) {
    console.error('❌ Exception fetching positions by symbol root:', error)
    return []
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