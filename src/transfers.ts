import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types - matching the actual database schema for hf.transfers
export interface Transfer {
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
  reportDate?: string
  date?: string
  dateTime?: string
  settleDate?: string
  type: string
  direction?: string
  company?: string
  account?: string
  accountName?: string
  deliveringBroker?: string
  quantity?: number
  transferPrice?: number
  positionAmount?: number
  positionAmountInBase?: number
  pnlAmount?: number
  pnlAmountInBase?: number
  cashTransfer?: number
  code?: string
  clientReference?: string
  transactionID: string
  levelOfDetail?: string
  positionInstructionID?: string
  positionInstructionSetID?: string
  serialNumber?: string
  deliveryType?: string
  commodityType?: string
  fineness?: number
  weight?: number
  legal_entity?: string  // Enriched from user_accounts_master
}

// Transfers query hook
export function useTransfersQuery(accountId: string, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.transfers(accountId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Transfer[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying transfers with config:', {
        accountId,
        schema: 'hf',
        table: 'transfers',
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      // Step 2: Get the latest fetched_at timestamp
      const maxFetchedAtRes = await supabase
        .schema('hf')
        .from('transfers')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)

      if (maxFetchedAtRes.error) {
        console.error('❌ Max fetched_at query error:', maxFetchedAtRes.error)
        throw maxFetchedAtRes.error
      }

      if (!maxFetchedAtRes.data || maxFetchedAtRes.data.length === 0) {
        console.log('⚠️ No transfers found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.data[0].fetched_at

      console.log('📅 Latest fetched_at:', latestFetchedAt)

      // Step 3: Build transfers query with optional access filter
      let transfersQuery = supabase
        .schema('hf')
        .from('transfers')
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
          "reportDate",
          date,
          "dateTime",
          "settleDate",
          type,
          direction,
          company,
          account,
          "accountName",
          "deliveringBroker",
          quantity,
          "transferPrice",
          "positionAmount",
          "positionAmountInBase",
          "pnlAmount",
          "pnlAmountInBase",
          "cashTransfer",
          code,
          "clientReference",
          "transactionID",
          "levelOfDetail",
          "positionInstructionID",
          "positionInstructionSetID",
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
        transfersQuery = transfersQuery.in('internal_account_id', accessibleAccountIds)
      } else {
        console.log('🔓 No access filter applied - showing all transfers')
      }

      transfersQuery = transfersQuery.order('"dateTime"', { ascending: false })

      // Step 4: Fetch transfers and accounts in parallel
      const [transfersRes, acctRes, aliasRes] = await Promise.all([
        transfersQuery,
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

      if (transfersRes.error) {
        console.error('❌ Transfers query error:', transfersRes.error)
        throw transfersRes.error
      }
      if (acctRes.error) {
        console.error('❌ Accounts query error:', acctRes.error)
        throw acctRes.error
      }

      console.log('✅ Transfers query success:', {
        latestFetchedAt,
        transfersCount: transfersRes.data?.length,
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

      // Step 6: Enrich transfers with legal_entity
      const transferRows = (transfersRes.data || []) as any[]
      const enriched: Transfer[] = transferRows.map((r: any) => {
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

  // Set up Supabase Realtime subscription for transfers
  const transfersChannel = supabase
    .channel(`transfers:${accountId}`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'transfers',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return {
    ...query,
    _cleanup: () => {
      transfersChannel?.unsubscribe?.()
    }
  }
}
