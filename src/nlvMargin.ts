import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'

// Data types
export interface nlvMargin {
  nlv_id: number
  nlv_val: number
  fetched_at_val: string
  maintenance_val: number
  internal_account_id?: string // Add this field for filtering
}

// nlvMargin join query hook
export function useNlvMarginQuery(limit: number, userId?: string | null) {
  const supabase = useSupabase()
  const key = queryKeys.nlvMargin(limit, userId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<nlvMargin[]> => {
      // Step 1: Fetch accessible accounts for the user
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying NLV/Margin with config:', {
        limit,
        userId: userId || 'none',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      const { data, error } = await supabase
      .schema('hf')
      .rpc('get_nlv_margin', {
        p_limit: limit
      })

      if (error) throw error
      
      let result = (data as nlvMargin[]) || []

      // Step 2: Apply access filter if user has specific account access
      if (accessibleAccountIds.length > 0 && result.length > 0) {
        // Check if the data has internal_account_id field
        if (result[0] && 'internal_account_id' in result[0]) {
          console.log('🔒 Applying access filter for NLV/Margin data')
          result = result.filter(row => 
            row.internal_account_id && accessibleAccountIds.includes(row.internal_account_id)
          )
        } else {
          console.warn('⚠️ NLV/Margin data missing internal_account_id field, cannot filter by access')
        }
      } else {
        console.log('🔓 No access filter applied - showing all NLV/Margin data')
      }

      console.log('✅ NLV/Margin query success:', {
        totalRows: (data as nlvMargin[])?.length || 0,
        filteredRows: result.length,
        filtered: accessibleAccountIds.length > 0
      })

      return result
    },
    staleTime: 60_000
  })
  // Supabase Realtime subscriptions to invalidate the query (NLV)
  const nlChannel = supabase
    .channel(`netliquidation_all`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'netliquidation',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()
  // Supabase Realtime subscriptions to invalidate the query (Margin)
  const mmChannel = supabase
    .channel(`maintenance_margin_all`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'maintenance_margin',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      nlChannel?.unsubscribe?.();
      mmChannel?.unsubscribe?.();
    }
  }
}