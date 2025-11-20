import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema
export interface Order {
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
  orderTime: string
  orderType: string
  settleDateTarget: string
  ibCommission: string
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
  conid?: string
  underlyingConid?: string
  orderMoney?: string
  fetched_at: string
}

// Orders query hook
export function useOrderQuery(accountId: string, userId?: string | null, symbolRoot?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.orders(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Order[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      // Step 2: Get the latest fetched_at timestamp
      const maxFetchedAtRes = await supabase
        .schema('hf')
        .from('orders')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (maxFetchedAtRes.error) {
        console.error('❌ Max fetched_at query error:', maxFetchedAtRes.error)
        throw maxFetchedAtRes.error
      }

      if (!maxFetchedAtRes.data || maxFetchedAtRes.data.length === 0) {
        console.log('⚠️ No orders found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.data[0].fetched_at

      // Step 3: Build orders query with optional access filter
      let ordersQuery = supabase
        .schema('hf')
        .from('orders')
        .select(`*`)
        .eq('fetched_at', latestFetchedAt)

      // Apply access filter if user has specific account access
      if (accessibleAccountIds.length > 0) {
        console.log('🔒 Applying access filter for accounts:', accessibleAccountIds)
        ordersQuery = ordersQuery.in('internal_account_id', accessibleAccountIds)
      } else {
        console.log('🔓 No access filter applied - showing all orders')
      }

      if (symbolRoot && symbolRoot.trim() !== '') {
        console.log('🔍 Filtering orders for symbol root:', symbolRoot)
        ordersQuery = ordersQuery.ilike('symbol', `${symbolRoot}%`)
      }

      ordersQuery = ordersQuery.order('"tradeDate"', { ascending: false })

            // Step 4: Fetch orders and accounts in parallel
      const [ordersRes, acctRes, aliasRes] = await Promise.all([
        ordersQuery,
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

      if (ordersRes.error) {
        console.error('❌ Orders query error:', ordersRes.error)
        throw ordersRes.error
      }
      if (acctRes.error) {
        console.error('❌ Accounts query error:', acctRes.error)
        throw acctRes.error
      }

      console.log('✅ Orders query success:', {
        latestFetchedAt,
        ordersCount: ordersRes.data?.length,
        accountsCount: acctRes.data?.length,
        filtered: accessibleAccountIds.length > 0,
        accessibleAccounts: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 5: Create accounts map for efficient lookup
      const accounts = new Map<string, string | null | undefined>(
        (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
      )

      // Map: internal_account_id -> alias
      const aliasMap = new Map<string, string>(
        (aliasRes.data || []).map((r: any) => [r.internal_account_id, r.alias])
      )

      // Step 6: Enrich orders with legal_entity
      const orderRows = (ordersRes.data || []) as any[]
      const enriched: Order[] = orderRows.map((r: any) => {
        // Use alias if present, else default name
        let legal_entity = accounts.get(r.internal_account_id) || undefined
        if (aliasMap.has(r.internal_account_id)) {
          legal_entity = aliasMap.get(r.internal_account_id)
        }

        return {
          ...r,
          legal_entity,
        }
      })

      return enriched
    },
    staleTime: 60_000
  })

  // Set up Supabase Realtime subscription for orders
  const ordersChannel = supabase
    .channel(`orders:${accountId}`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'orders',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      ordersChannel?.unsubscribe?.()
    }
  }
}