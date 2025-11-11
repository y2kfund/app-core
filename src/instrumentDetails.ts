import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, type Position } from './core'

// Query key factory
export const instrumentDetailsQueryKeys = {
  details: (userId: string | null, symbolName: string) => 
    ['instrumentDetails', userId, symbolName] as const
}

/**
 * Query hook to fetch instrument details (positions) filtered by:
 * - User's accessible accounts
 * - Latest fetched_at snapshot
 * - Asset class = 'STK' (stocks only)
 * - Symbol containing the search term (case-insensitive partial match)
 * 
 * @param userId - User ID for account access control (null = all accounts)
 * @param symbolName - Symbol/instrument name to search for (partial match)
 * @returns Vue Query result with Position[] data
 */
export function useInstrumentDetailsQuery(
  userId: string | null, 
  symbolName: string
) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const key = instrumentDetailsQueryKeys.details(userId, symbolName)

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Position[]> => {
      // Validate input
      const trimmedSymbol = symbolName?.trim()
      if (!trimmedSymbol) {
        console.log('⚠️ No symbol provided, returning empty array')
        return []
      }

      console.log('🔍 [InstrumentDetails] Querying with:', {
        userId: userId || 'none (all accounts)',
        symbolName: trimmedSymbol
      })

      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)
      
      if (userId && accessibleAccountIds.length === 0) {
        console.log('⚠️ User has no account access restrictions - showing all accounts')
      } else if (accessibleAccountIds.length > 0) {
        console.log('🔒 User has access to accounts:', accessibleAccountIds)
      }

      // Step 2: Get the latest fetched_at timestamp from positions table
      const { data: maxFetchedAtRes, error: maxFetchedAtError } = await supabase
        .schema('hf')
        .from('positions')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (maxFetchedAtError) {
        console.error('❌ Error fetching latest fetched_at:', maxFetchedAtError)
        throw maxFetchedAtError
      }

      if (!maxFetchedAtRes || !maxFetchedAtRes.fetched_at) {
        console.log('⚠️ No positions found in database')
        return []
      }

      const latestFetchedAt = maxFetchedAtRes.fetched_at
      console.log('📅 Latest fetched_at:', latestFetchedAt)

      // Step 3: Build the main query with all filters
      let query = supabase
        .schema('hf')
        .from('positions')
        .select('*')
        .eq('fetched_at', latestFetchedAt)
        .eq('asset_class', 'STK')
        .eq('symbol', `${trimmedSymbol}`)
        .order('symbol', { ascending: true })

      // Apply account access filter if user has restrictions
      if (accessibleAccountIds.length > 0) {
        query = query.in('internal_account_id', accessibleAccountIds)
      }

      const { data: positionsData, error: positionsError } = await query

      if (positionsError) {
        console.error('❌ Error fetching positions:', positionsError)
        throw positionsError
      }

      if (!positionsData || positionsData.length === 0) {
        console.log('📊 No positions found matching criteria')
        return []
      }

      console.log(`✅ Found ${positionsData.length} position(s) matching symbol "${trimmedSymbol}"`)

      // Step 4: Enrich data with legal entity names and aliases in parallel
      const uniqueAccountIds = Array.from(
        new Set(positionsData.map((p: any) => p.internal_account_id))
      )

      const [accountsRes, aliasRes] = await Promise.all([
        supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity')
          .in('internal_account_id', uniqueAccountIds),
        userId
          ? supabase
              .schema('hf')
              .from('user_account_alias')
              .select('internal_account_id, alias')
              .eq('user_id', userId)
              .in('internal_account_id', uniqueAccountIds)
          : { data: [], error: null }
      ])

      if (accountsRes.error) {
        console.warn('⚠️ Error fetching account names:', accountsRes.error)
      }

      if (aliasRes.error) {
        console.warn('⚠️ Error fetching account aliases:', aliasRes.error)
      }

      // Create lookup maps
      const accountsMap = new Map<string, string>(
        (accountsRes.data || []).map((a: any) => [a.internal_account_id, a.legal_entity])
      )

      const aliasMap = new Map<string, string>(
        (aliasRes.data || []).map((a: any) => [a.internal_account_id, a.alias])
      )

      // Step 5: Map and enrich positions
      const enrichedPositions: Position[] = positionsData.map((pos: any) => {
        // Use alias if available, otherwise use legal entity name
        let legal_entity = accountsMap.get(pos.internal_account_id)
        if (aliasMap.has(pos.internal_account_id)) {
          legal_entity = aliasMap.get(pos.internal_account_id)
        }

        return {
          ...pos,
          legal_entity
        }
      })

      console.log('✅ Successfully enriched positions with account info')

      return enrichedPositions
    },
    enabled: !!symbolName && symbolName.trim().length > 0, // Only run if symbol provided
    staleTime: 60_000, // 1 minute cache
    retry: 2 // Retry failed queries up to 2 times
  })

  // Optional: Set up realtime subscription for positions table changes
  const channel = supabase
    .channel(`instrument-details:${symbolName}`)
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positions', 
        event: '*' 
      },
      () => {
        console.log('🔄 Positions table changed, invalidating instrument details query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      console.log('🧹 Cleaning up instrument details subscription')
      channel?.unsubscribe?.()
    }
  }
}
