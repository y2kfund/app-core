import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema
export interface Trade {
  id: number
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
  tradeID?: string
  conid?: string
  underlyingConid?: string
}

// Trades query hook
export function useTradesQuery(accountId: string, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.trades(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Trade[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying trades with config:', {
        accountId,
        schema: 'hf',
        table: 'trades',
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 2: Get the latest fetched_at timestamp
      const maxFetchedAtRes = await supabase
        .schema('hf')
        .from('trades')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (maxFetchedAtRes.error) {
        console.error('❌ Max fetched_at query error:', maxFetchedAtRes.error)
        throw maxFetchedAtRes.error
      }

      if (!maxFetchedAtRes.data || maxFetchedAtRes.data.length === 0) {
        console.log('⚠️ No trades found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.data[0].fetched_at

      console.log('📅 Latest fetched_at:', latestFetchedAt)

      // Step 3: Build trades query with optional access filter
      let tradesQuery = supabase
        .schema('hf')
        .from('trades')
        .select(`
          id,
          "accountId",
          internal_account_id,
          symbol,
          "assetCategory",
          quantity,
          "tradePrice",
          "buySell",
          "tradeDate",
          "settleDateTarget",
          "ibCommission",
          fetched_at,
          description,
          currency,
          "netCash",
          proceeds,
          "fifoPnlRealized",
          "openCloseIndicator",
          "multiplier",
          "mtmPnl",
          "closePrice",
          underlyingSymbol,
          "putCall",
          strike,
          expiry,
          "tradeID",
          conid,
          "underlyingConid"
        `)
        .eq('fetched_at', latestFetchedAt)

      // Apply access filter if user has specific account access
      if (accessibleAccountIds.length > 0) {
        console.log('🔒 Applying access filter for accounts:', accessibleAccountIds)
        tradesQuery = tradesQuery.in('internal_account_id', accessibleAccountIds)
      } else {
        console.log('🔓 No access filter applied - showing all trades')
      }

      tradesQuery = tradesQuery.order('"tradeDate"', { ascending: false })

      // Step 4: Fetch trades and accounts in parallel
      const [tradesRes, acctRes] = await Promise.all([
        tradesQuery,
        supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity')
      ])

      if (tradesRes.error) {
        console.error('❌ Trades query error:', tradesRes.error)
        throw tradesRes.error
      }
      if (acctRes.error) {
        console.error('❌ Accounts query error:', acctRes.error)
        throw acctRes.error
      }

      console.log('✅ Trades query success:', {
        latestFetchedAt,
        tradesCount: tradesRes.data?.length,
        accountsCount: acctRes.data?.length,
        filtered: accessibleAccountIds.length > 0,
        accessibleAccounts: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 5: Create accounts map for efficient lookup
      const accounts = new Map<string, string | null | undefined>(
        (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
      )

      // Step 6: Enrich trades with legal_entity
      const tradeRows = (tradesRes.data || []) as any[]
      const enriched: Trade[] = tradeRows.map((r: any) => {
        return {
          ...r,
          legal_entity: accounts.get(r.internal_account_id) || undefined,
        }
      })

      return enriched
    },
    staleTime: 60_000
  })

  // Set up Supabase Realtime subscription for trades
  const tradesChannel = supabase
    .channel(`trades:${accountId}`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'trades',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      tradesChannel?.unsubscribe?.()
    }
  }
}