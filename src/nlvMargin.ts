import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase } from './core' // Assuming core.ts and nlvMargin.ts are in the same directory

// Data types
export interface nlvMargin {
  nlv_id: number
  nlv_val: number
  fetched_at_val: string
  maintenance_val: number
}

// nlvMargin join query hook
export function useNlvMarginQuery(limit: number) {
  const supabase = useSupabase()
  const key = ['nlvMargin', limit] as const
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<nlvMargin[]> => {
      const { data, error } = await supabase
      .schema('hf')
      .rpc('get_nlv_margin', {
        p_limit: 10
      })

      if (error) throw error
      return (data as nlvMargin[]) || []
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