import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema for hf.cash_transaction
export interface CashTransaction {
  id: number
  internal_account_id?: string
  fetched_at?: string
  accountId: string
  acctAlias?: string
  model?: string
  currency: string
  fxRateToBase?: number
  assetCategory?: string
  subCategory?: string
  symbol?: string
  description?: string
  conid?: string
  securityID?: string
  securityIDType?: string
  cusip?: string
  isin?: string
  figi?: string
  listingExchange?: string
  underlyingConid?: string
  underlyingSymbol?: string
  underlyingSecurityID?: string
  underlyingListingExchange?: string
  issuer?: string
  issuerCountryCode?: string
  multiplier?: number
  strike?: number
  expiry?: string
  putCall?: string
  principalAdjustFactor?: number
  dateTime?: string
  settleDate?: string
  availableForTradingDate?: string
  reportDate?: string
  exDate?: string
  amount: number
  type: string
  tradeID?: string
  code?: string
  transactionID: string
  clientReference?: string
  actionID?: string
  levelOfDetail?: string
  serialNumber?: string
  deliveryType?: string
  commodityType?: string
  fineness?: number
  weight?: number
  legal_entity?: string  // Enriched from user_accounts_master
}

// Cash Transactions query hook
export function useCashTransactionsQuery(accountId: string, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.cashTransactions(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<CashTransaction[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying cash transactions with config:', {
        accountId,
        schema: 'hf',
        table: 'cash_transaction',
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 2: Get the latest fetched_at timestamp
      const maxFetchedAtRes = await supabase
        .schema('hf')
        .from('cash_transaction')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (maxFetchedAtRes.error) {
        console.error('❌ Max fetched_at query error:', maxFetchedAtRes.error)
        throw maxFetchedAtRes.error
      }

      if (!maxFetchedAtRes.data || maxFetchedAtRes.data.length === 0) {
        console.log('⚠️ No cash transactions found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.data[0].fetched_at

      console.log('📅 Latest fetched_at:', latestFetchedAt)

      // Step 3: Build cash transactions query with optional access filter
      let cashTransactionsQuery = supabase
        .schema('hf')
        .from('cash_transaction')
        .select(`
          id,
          internal_account_id,
          fetched_at,
          "accountId",
          "acctAlias",
          model,
          currency,
          "fxRateToBase",
          "assetCategory",
          "subCategory",
          symbol,
          description,
          conid,
          "securityID",
          "securityIDType",
          cusip,
          isin,
          figi,
          "listingExchange",
          "underlyingConid",
          "underlyingSymbol",
          "underlyingSecurityID",
          "underlyingListingExchange",
          issuer,
          "issuerCountryCode",
          multiplier,
          strike,
          expiry,
          "putCall",
          "principalAdjustFactor",
          "dateTime",
          "settleDate",
          "availableForTradingDate",
          "reportDate",
          "exDate",
          amount,
          type,
          "tradeID",
          code,
          "transactionID",
          "clientReference",
          "actionID",
          "levelOfDetail",
          "serialNumber",
          "deliveryType",
          "commodityType",
          fineness,
          weight
        `)
        .eq('fetched_at', latestFetchedAt)

      // Apply access filter if user has specific account access
      if (accessibleAccountIds.length > 0) {
        console.log('🔒 Applying access filter for accounts:', accessibleAccountIds)
        cashTransactionsQuery = cashTransactionsQuery.in('internal_account_id', accessibleAccountIds)
      } else {
        console.log('🔓 No access filter applied - showing all cash transactions')
      }

      cashTransactionsQuery = cashTransactionsQuery.order('"dateTime"', { ascending: false })

      // Step 4: Fetch cash transactions and accounts in parallel
      const [cashTransactionsRes, acctRes, aliasRes] = await Promise.all([
        cashTransactionsQuery,
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

      if (cashTransactionsRes.error) {
        console.error('❌ Cash transactions query error:', cashTransactionsRes.error)
        throw cashTransactionsRes.error
      }
      if (acctRes.error) {
        console.error('❌ Accounts query error:', acctRes.error)
        throw acctRes.error
      }

      console.log('✅ Cash transactions query success:', {
        latestFetchedAt,
        cashTransactionsCount: cashTransactionsRes.data?.length,
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

      // Step 6: Enrich cash transactions with legal_entity
      const cashTransactionRows = (cashTransactionsRes.data || []) as any[]
      const enriched: CashTransaction[] = cashTransactionRows.map((r: any) => {
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

  // Set up Supabase Realtime subscription for cash transactions
  const cashTransactionsChannel = supabase
    .channel(`cash_transaction:${accountId}`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'cash_transaction',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return {
    ...query,
    _cleanup: () => {
      cashTransactionsChannel?.unsubscribe?.()
    }
  }
}