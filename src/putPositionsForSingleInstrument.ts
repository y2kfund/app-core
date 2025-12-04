import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase, fetchUserAccessibleAccounts } from './core'
import type { Position } from './core'
import { computed, isRef } from 'vue' // <-- ADD THIS IMPORT

export interface PutPosition extends Position {
  // Add any put-specific fields if needed
}

/**
 * Fetch all unique fetched_at timestamps
 */
export async function fetchAvailableFetchedAtTimestamps(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .schema('hf')
    .from('positions')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching fetched_at timestamps:', error)
    throw error
  }

  // Get unique timestamps
  const uniqueTimestamps = [...new Set(data.map(d => d.fetched_at))]
  return uniqueTimestamps
}

/**
 * Fetch put positions (symbols containing capital 'C') for a single instrument
 */
export async function fetchPutPositionsForSymbol(
  supabase: SupabaseClient,
  symbolRoot: string,
  userId?: string | null,
  fetchedAt?: string | null
): Promise<PutPosition[]> {
  // Step 1: Fetch accessible accounts for the user
  const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

  console.log('🔍 Querying put positions with:', {
    symbolRoot,
    userId: userId || 'none',
    fetchedAt: fetchedAt || 'latest',
    accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
  })

  // Step 2: Get the fetched_at timestamp to use
  let targetFetchedAt = fetchedAt
  
  if (!targetFetchedAt) {
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

    targetFetchedAt = latestFetchedAtData.fetched_at
  }

  console.log('📅 Using fetched_at:', targetFetchedAt)

  // Step 3: Fetch put positions with specified fetched_at and symbol filter
  let query = supabase
    .schema('hf')
    .from('positions')
    .select('*')
    .eq('fetched_at', targetFetchedAt)
    .ilike('symbol', `%${symbolRoot}% P %`) // Contains capital 'P' for puts

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
export function usePutPositionsQuery(
  symbolRoot: string, 
  userId?: string | null, 
  fetchedAt?: import('vue').Ref<string | null> | string | null
) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  
  // Handle both reactive refs and plain values - CHANGED: use imported isRef
  const fetchedAtValue = isRef(fetchedAt) 
    ? computed(() => (fetchedAt as any).value)
    : computed(() => fetchedAt)
  
  const queryKey = computed(() => 
    ['putPositions', symbolRoot, userId, fetchedAtValue.value]
  )

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!symbolRoot) return []
      return await fetchPutPositionsForSymbol(
        supabase, 
        symbolRoot, 
        userId, 
        fetchedAtValue.value
      )
    },
    enabled: !!symbolRoot,
    staleTime: 60_000 // 1 minute
  })

  // Setup realtime subscription
  const channel = supabase
    .channel(`put-positions:${symbolRoot}:${userId}:${fetchedAtValue.value || 'latest'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'hf',
        table: 'positions',
        filter: `symbol=ilike.%${symbolRoot}%C%`
      },
      () => {
        console.log('🔄 Put positions changed, invalidating query...')
        qc.invalidateQueries({ queryKey: queryKey.value })
      }
    )
    .subscribe()

  // Cleanup function
  const cleanup = () => {
    channel.unsubscribe()
  }

  return { ...query, _cleanup: cleanup }
}

/**
 * Query hook to fetch available fetched_at timestamps
 */
export function useAvailableFetchedAtQuery() {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['availableFetchedAt'],
    queryFn: () => fetchAvailableFetchedAtTimestamps(supabase),
    staleTime: 300_000 // 5 minutes
  })
}