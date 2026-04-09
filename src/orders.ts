import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema
export interface Order {
  id: string
  accountId: string
  internal_account_id: string
  legal_entity?: string  // Legal entity name from core_accounts_master
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
  isAttached?: boolean  // ADD: Flag to indicate if order is attached to a position
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

      // Step 2: Build orders query (fetch all orders, no fetched_at filter)
      let ordersQuery = supabase
        .schema('fund_ai')
        .from('p_trades_orders')
        .select(`*`)

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

      // Step 3: Fetch attached order IDs if userId and symbolRoot are provided
      let attachedOrderIds = new Set<string>()
      if (userId && symbolRoot) {
        try {
          const pattern = `%|${symbolRoot}|%|STK|%`
          console.log('🔍 Fetching attached orders with pattern:', pattern)
          
          const { data: mappings, error: mappingsError } = await supabase
            .schema('fund_ai')
            .from('p_positions_order_mappings')
            .select('order_id')
            .eq('user_id', userId)
            .like('mapping_key', pattern)

          console.log('🔍 Fetched position-order mappings:', mappings)
          if (mappingsError) {
            console.error('⚠️ Error fetching position-order mappings:', mappingsError)
          } else if (mappings && mappings.length > 0) {
            mappings.forEach(mapping => {
              if (mapping.order_id) {
                attachedOrderIds.add(String(mapping.order_id))
              }
            })
            console.log(`✅ Found ${attachedOrderIds.size} attached orders`)
          }
        } catch (error) {
          console.error('⚠️ Error checking attached orders:', error)
        }
      }

      // Step 4: Fetch orders and accounts in parallel
      const [ordersRes, acctRes, aliasRes] = await Promise.all([
        ordersQuery,
        supabase
          .schema('fund_ai')
          .from('core_accounts_master')
          .select('internal_account_id, legal_entity'),
        userId
          ? supabase
              .schema('fund_ai')
              .from('core_accounts_alias')
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
        ordersCount: ordersRes.data?.length,
        accountsCount: acctRes.data?.length,
        attachedCount: attachedOrderIds.size,
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

      // Step 6: Enrich orders with legal_entity and isAttached flag
      const orderRows = (ordersRes.data || []) as any[]
      const enriched: Order[] = orderRows.map((r: any) => {
        // Use alias if present, else default name
        let legal_entity = accounts.get(r.internal_account_id) || undefined
        if (aliasMap.has(r.internal_account_id)) {
          legal_entity = aliasMap.get(r.internal_account_id)
        }

        const orderId = String(r.id)
        const isAttached = attachedOrderIds.has(orderId)

        return {
          ...r,
          legal_entity,
          isAttached,
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
        schema: 'fund_ai',
        table: 'p_trades_orders',
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