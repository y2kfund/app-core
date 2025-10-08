import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema
export interface Trade {
  id: number
  accountId: string
  internal_account_id: string
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
}

// Trades query hook
export function useTradesQuery(accountId: string, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.trades(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Trade[]> => {
      // Check user access to account if userId is provided
      if (userId) {
        const accessibleAccounts = await fetchUserAccessibleAccounts(supabase, userId)
        if (!accessibleAccounts.includes(accountId)) {
          throw new Error('Access denied to this account')
        }
      }

      const { data, error } = await supabase
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
          proceeds
        `)
        .eq('internal_account_id', accountId)
        .order('"tradeDate"', { ascending: false })

      if (error) throw error
      return (data as Trade[]) || []
    },
    staleTime: 60_000
  })

  // Supabase Realtime subscription to invalidate the query
  const tradesChannel = supabase
    .channel(`trades_${accountId}`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'trades',
        event: '*',
        filter: `internal_account_id=eq.${accountId}`
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