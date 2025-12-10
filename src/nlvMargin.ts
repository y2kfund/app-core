import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'
import type { Ref } from 'vue'

// Data types
export interface nlvMargin {
  nlv_id: number
  nlv_val: number
  fetched_at_val: string
  maintenance_val: number
  nlv_internal_account_id?: string
  legal_entity?: string
  excess_maintenance_margin?: number
  archived?: boolean
  sync_mode?: string
  net_cash_transactions_amount?: number | null
  net_transfers_amount?: number | null
}

export function useNlvMarginQuery(limit: number, userId?: string | null, asOfDate?: Ref<string | null> | string | null) {
  const supabase = useSupabase()
  
  const getAsOf = () =>
    asOfDate && typeof asOfDate === 'object' && 'value' in asOfDate
      ? asOfDate.value
      : asOfDate
  
  const key = [...queryKeys.nlvMargin(limit, userId), getAsOf()]
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<nlvMargin[]> => {
      const asOf = getAsOf()
      
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying NLV/Margin with config:', {
        limit,
        userId: userId || 'none',
        asOfDate: asOf || 'latest',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      let result: nlvMargin[] = []
      
      if (asOf) {
        // Create end of day timestamp for the selected date
        const endOfDay = new Date(asOf + 'T23:59:59.999Z').toISOString()
        
        console.log('📅 Fetching historical NLV/Margin data for date:', asOf, 'up to:', endOfDay)
        
        let accountIds: string[] = accessibleAccountIds
        if (accountIds.length === 0) {
          const { data: allAccounts, error: allAccountsError } = await supabase
            .schema('hf')
            .from('netliquidation')
            .select('internal_account_id')
            .neq('internal_account_id', null)
          
          if (allAccountsError) {
            console.error('❌ Error fetching all account IDs:', allAccountsError)
            throw allAccountsError
          }
          
          accountIds = Array.from(new Set((allAccounts || []).map((r: any) => r.internal_account_id)))
        }
        
        const fetchedAtPromises = accountIds.map(async (accountId) => {
          // Get latest NLV record up to end of selected day
          const { data: nlvData, error: nlvError } = await supabase
            .schema('hf')
            .from('netliquidation')
            .select('*')
            .eq('internal_account_id', accountId)
            .lte('fetched_at', endOfDay)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single()
          
          if (nlvError && nlvError.code !== 'PGRST116') {
            console.error(`❌ Error fetching NLV for ${accountId}:`, nlvError)
            return null
          }
          
          // Get latest maintenance margin record up to end of selected day
          const { data: mmData, error: mmError } = await supabase
            .schema('hf')
            .from('maintenance_margin')
            .select('*')
            .eq('internal_account_id', accountId)
            .lte('fetched_at', endOfDay)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single()
          
          if (mmError && mmError.code !== 'PGRST116') {
            console.error(`❌ Error fetching MM for ${accountId}:`, mmError)
            return null
          }
          
          if (!nlvData || !mmData) return null
          
          return {
            nlv_id: nlvData.id,
            nlv_val: nlvData.nlv,
            fetched_at_val: nlvData.fetched_at,
            maintenance_val: parseFloat(mmData.maintenance),
            nlv_internal_account_id: accountId,
            excess_maintenance_margin: nlvData.nlv - parseFloat(mmData.maintenance)
          }
        })
        
        const fetchedResults = await Promise.all(fetchedAtPromises)
        result = fetchedResults.filter(r => r !== null) as nlvMargin[]
        
        const { data: accountData } = await supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity, archived, sync_mode')
        
        const accountMap = new Map(
          (accountData || []).map((a: any) => [a.internal_account_id, a])
        )
        
        result = result.map(row => ({
          ...row,
          legal_entity: accountMap.get(row.nlv_internal_account_id || '')?.legal_entity,
          archived: accountMap.get(row.nlv_internal_account_id || '')?.archived || false,
          sync_mode: accountMap.get(row.nlv_internal_account_id || '')?.sync_mode
        }))
        
      } else {
        const { data, error } = await supabase
          .schema('hf')
          .rpc('get_nlv_margin_with_excess_and_sync_type', {
            p_limit: limit
          })

        if (error) throw error
        result = (data as nlvMargin[]) || []
      }

      let aliasMap: Map<string, string> = new Map()
      if (userId) {
        const { data: aliasData } = await supabase
          .schema('hf')
          .from('user_account_alias')
          .select('internal_account_id, alias')
          .eq('user_id', userId)
        aliasMap = new Map((aliasData || []).map((a: any) => [a.internal_account_id, a.alias]))
      }

      result = result.map(row => ({
        ...row,
        legal_entity: aliasMap.get(row.nlv_internal_account_id || '') || row.legal_entity
      }))

      if (accessibleAccountIds.length > 0 && result.length > 0) {
        if (result[0] && 'nlv_internal_account_id' in result[0]) {
          console.log('🔒 Applying access filter for NLV/Margin data')
          result = result.filter(row => 
            row.nlv_internal_account_id && accessibleAccountIds.includes(row.nlv_internal_account_id)
          )
        }
      }

      console.log('✅ NLV/Margin query success:', {
        totalRows: result.length,
        asOfDate: asOf || 'latest',
        filtered: accessibleAccountIds.length > 0
      })

      return result
    },
    staleTime: 60_000
  })
  
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
      nlChannel?.unsubscribe?.()
      mmChannel?.unsubscribe?.()
    }
  }
}