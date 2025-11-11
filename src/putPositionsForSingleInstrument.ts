import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase, fetchUserAccessibleAccounts } from './core'
import type { Position } from './core'

export interface PutPosition extends Position {
  // Add any put-specific fields if needed
}

/**
 * Fetch put positions (symbols containing capital 'P') for a single instrument
 */
export async function fetchPutPositionsForSymbol(
  supabase: SupabaseClient,
  symbolRoot: string,
  userId?: string | null
): Promise<PutPosition[]> {
  // Step 1: Fetch accessible accounts for the user
  const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

  console.log('🔍 Querying put positions with:', {
    symbolRoot,
    userId: userId || 'none',
    accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
  })

  // Step 2: Get the latest fetched_at timestamp
  const { data: latestFetchedAtData, error: fetchedAtError } = await supabase
    .schema('hf')
    .from('positions')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchedAtError) {
    console.error('❌ Error fetching latest fetched_at:', fetchedAtError)
    throw fetchedAtError
  }

  const latestFetchedAt = latestFetchedAtData.fetched_at

  console.log('📅 Latest fetched_at:', latestFetchedAt)

  // Step 3: Fetch put positions with latest fetched_at and symbol filter
  let query = supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .eq('fetched_at', latestFetchedAt)
    .ilike('symbol', `%${symbolRoot}%P%`) // Contains capital 'P'

  // Apply account access filter if user has limited access
  if (accessibleAccountIds.length > 0) {
    query = query.in('internal_account_id', accessibleAccountIds)
  }

  const { data: positionRows, error: posError } = await query

  if (posError) {
    console.error('❌ Error fetching put positions:', posError)
    throw posError
  }

  // Step 4: Fetch accounts and aliases
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

  if (acctRes.error) {
    console.error('❌ Accounts query error:', acctRes.error)
    throw acctRes.error
  }

  console.log('✅ Put positions query success:', {
    positionsCount: positionRows?.length || 0,
    accountsCount: acctRes.data?.length,
    filtered: accessibleAccountIds.length > 0
  })

  // Map: internal_account_id -> alias
  const aliasMap = new Map<string, string>(
    (aliasRes.data || []).map((r: any) => [r.internal_account_id, r.alias])
  )

  const accounts = new Map<string, string | null | undefined>(
    (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string])
  )

  // Step 5: Enrich positions with account names/aliases
  const enriched: PutPosition[] = (positionRows || []).map((r: any) => {
    let legal_entity = accounts.get(r.internal_account_id) || undefined
    if (aliasMap.has(r.internal_account_id)) {
      legal_entity = aliasMap.get(r.internal_account_id)
    }

    return {
      ...r,
      legal_entity
    }
  })

  console.log('✅ Enriched put positions with accounts', enriched.length)
  return enriched
}

/**
 * Query hook for put positions with realtime updates
 */
export function usePutPositionsQuery(symbolRoot: string, userId?: string | null) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  
  const queryKey = ['putPositions', symbolRoot, userId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!symbolRoot) return []
      return await fetchPutPositionsForSymbol(supabase, symbolRoot, userId)
    },
    enabled: !!symbolRoot,
    staleTime: 60_000 // 1 minute
  })

  // Setup realtime subscription
  const channel = supabase
    .channel(`put-positions:${symbolRoot}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'hf',
        table: 'positions',
        filter: `symbol=ilike.%${symbolRoot}%P%`
      },
      () => {
        console.log('🔄 Put positions changed, invalidating query...')
        qc.invalidateQueries({ queryKey })
      }
    )
    .subscribe()

  // Cleanup function
  const cleanup = () => {
    channel.unsubscribe()
  }

  return { ...query, _cleanup: cleanup }
}