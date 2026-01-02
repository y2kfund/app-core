import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, queryKeys } from './core'
import type { Ref } from 'vue'

// Data types
export interface SettledCash {
  id: number
  internal_account_id: string
  settled_cash: number
  settled_cash_amount: string
  date: string
  account_id: string
  currency: string | null
  timestamp: number
  fetched_at: string
  run_id_of_fetch_script: string
  legal_entity?: string
  archived?: boolean
  sync_mode?: string
}

export function useSettledCashQuery(limit: number, userId?: string | null, asOfDate?: Ref<string | null> | string | null) {
  const supabase = useSupabase()
  
  const getAsOf = () =>
    asOfDate && typeof asOfDate === 'object' && 'value' in asOfDate
      ? asOfDate.value
      : asOfDate
  
  const key = [...queryKeys.settledCash(limit, userId), getAsOf()]
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<SettledCash[]> => {
      const asOf = getAsOf()
      
      const accessibleAccountIds = await fetchUserAccessibleAccounts(supabase, userId)

      console.log('🔍 Querying Settled Cash with config:', {
        limit,
        userId: userId || 'none',
        asOfDate: asOf || 'latest',
        accessibleAccountIds: accessibleAccountIds.length > 0 ? accessibleAccountIds : 'all'
      })

      let result: SettledCash[] = []
      
      if (asOf) {
        // Create end of day timestamp for the selected date
        const endOfDay = new Date(asOf + 'T23:59:59.999Z').toISOString()
        
        console.log('📅 Fetching historical Settled Cash data for date:', asOf, 'up to:', endOfDay)
        
        let accountIds: string[] = accessibleAccountIds
        if (accountIds.length === 0) {
          const { data: allAccounts, error: allAccountsError } = await supabase
            .schema('hf')
            .from('settledcash')
            .select('internal_account_id')
            .neq('internal_account_id', null)
          
          if (allAccountsError) {
            console.error('❌ Error fetching all account IDs:', allAccountsError)
            throw allAccountsError
          }
          
          accountIds = Array.from(new Set((allAccounts || []).map((r: any) => r.internal_account_id)))
        }
        
        const fetchedAtPromises = accountIds.map(async (accountId) => {
          // Get latest settled cash record up to end of selected day
          const { data, error } = await supabase
            .schema('hf')
            .from('settledcash')
            .select('*')
            .eq('internal_account_id', accountId)
            .lte('fetched_at', endOfDay)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single()
          
          if (error && error.code !== 'PGRST116') {
            console.error(`❌ Error fetching Settled Cash for ${accountId}:`, error)
            return null
          }
          
          return data
        })
        
        const fetchedResults = await Promise.all(fetchedAtPromises)
        result = fetchedResults.filter(r => r !== null) as SettledCash[]
        
        const { data: accountData } = await supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity, archived, sync_mode')
        
        const accountMap = new Map(
          (accountData || []).map((a: any) => [a.internal_account_id, a])
        )
        
        result = result.map(row => ({
          ...row,
          legal_entity: accountMap.get(row.internal_account_id || '')?.legal_entity,
          archived: accountMap.get(row.internal_account_id || '')?.archived || false,
          sync_mode: accountMap.get(row.internal_account_id || '')?.sync_mode
        }))
        
      } else {
        // Get latest settled cash for each account
        const { data: allAccounts, error: allAccountsError } = await supabase
          .schema('hf')
          .from('settledcash')
          .select('internal_account_id')
          .neq('internal_account_id', null)
        
        if (allAccountsError) {
          console.error('❌ Error fetching all account IDs:', allAccountsError)
          throw allAccountsError
        }
        
        const accountIds = Array.from(new Set((allAccounts || []).map((r: any) => r.internal_account_id)))
        
        const latestPromises = accountIds.map(async (accountId) => {
          const { data, error } = await supabase
            .schema('hf')
            .from('settledcash')
            .select('*')
            .eq('internal_account_id', accountId)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single()
          
          if (error && error.code !== 'PGRST116') {
            console.error(`❌ Error fetching latest Settled Cash for ${accountId}:`, error)
            return null
          }
          
          return data
        })
        
        const latestResults = await Promise.all(latestPromises)
        result = latestResults.filter(r => r !== null) as SettledCash[]
        
        // Add legal entity and account metadata
        const { data: accountData } = await supabase
          .schema('hf')
          .from('user_accounts_master')
          .select('internal_account_id, legal_entity, archived, sync_mode')
        
        const accountMap = new Map(
          (accountData || []).map((a: any) => [a.internal_account_id, a])
        )
        
        result = result.map(row => ({
          ...row,
          legal_entity: accountMap.get(row.internal_account_id || '')?.legal_entity,
          archived: accountMap.get(row.internal_account_id || '')?.archived || false,
          sync_mode: accountMap.get(row.internal_account_id || '')?.sync_mode
        }))
      }

      // Apply user aliases if userId provided
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
        legal_entity: aliasMap.get(row.internal_account_id || '') || row.legal_entity
      }))

      // Apply access filter
      if (accessibleAccountIds.length > 0 && result.length > 0) {
        if (result[0] && 'internal_account_id' in result[0]) {
          console.log('🔒 Applying access filter for Settled Cash data')
          result = result.filter(row => 
            row.internal_account_id && accessibleAccountIds.includes(row.internal_account_id)
          )
        }
      }

      console.log('✅ Settled Cash query success:', {
        totalRows: result.length,
        asOfDate: asOf || 'latest',
        filtered: accessibleAccountIds.length > 0
      })

      return result
    },
    staleTime: 60_000
  })
  
  // Subscribe to real-time changes
  const channel = supabase
    .channel(`settledcash_all`)
    .on('postgres_changes',
      {
        schema: 'hf',
        table: 'settledcash',
        event: '*',
      },
      () => qc.invalidateQueries({ queryKey: key })
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      channel?.unsubscribe?.()
    }
  }
}
