import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase, fetchUserAccessibleAccounts, type Position } from './core'

// Query key factory
export const relativeCapitalDeployedQueryKeys = {
  top20: (userId: string | null) => 
    ['relativeCapitalDeployed', 'top20', userId] as const
}

// Interface for market price data
interface MarketPrice {
  symbol: string
  market_price: number
}

// Interface for aggregated position group
export interface SymbolPositionGroup {
  symbolRoot: string
  totalQuantity: number // Sum of |accounting_quantity|
  currentMarketPrice: number | null
  capitalInvested: number // totalQuantity × currentMarketPrice
  positionCount: number
  positions: Position[]
}

/**
 * Helper function to extract symbol root from position symbol
 * Examples:
 * - "META" → "META"
 * - "META   DEC2025 700 C [...]" → "META"
 * - "IBIT   JAN2026 64 C [...]" → "IBIT"
 */
function extractSymbolRoot(symbol: string): string {
  if (!symbol) return ''
  // Extract first word (letters only) before any space
  const match = symbol.match(/^([A-Z]+)/)
  return match ? match[1] : symbol.split(/\s+/)[0]
}

/**
 * Check if a position should be included based on asset class and option type
 * Include:
 * - All stocks (asset_class = 'STK')
 * - All funds (asset_class = 'FUND')
 * - Only PUT options (asset_class = 'OPT' and symbol contains ' P ')
 */
function shouldIncludePosition(symbol: string, assetClass: string): boolean {
  if (assetClass === 'STK') return true
  if (assetClass === 'FUND') return true
  
  if (assetClass === 'OPT') {
    // Check for PUT options - symbol contains ' P ' or ' P['
    return symbol.includes(' P ') || symbol.includes(' P[')
  }
  
  return false
}

/**
 * Query hook to fetch top 20 largest positions by capital invested
 * across all accessible accounts for a user.
 * 
 * Workflow:
 * 1. Fetch user's accessible accounts
 * 2. Get latest snapshot timestamp
 * 3. Fetch all positions (STK + FUND + OPT) at latest snapshot
 * 4. Filter: Keep stocks, funds, and PUT options only
 * 5. Group by symbol root and sum |accounting_quantity|
 * 6. Fetch accounts and aliases, enrich positions with account display names
 * 7. Fetch current market prices for each symbol
 * 8. Calculate capitalInvested = totalQuantity × currentMarketPrice
 * 9. Sort by capitalInvested DESC and return top 20
 * 
 * @param userId - User ID for account access control (null = all accounts)
 * @returns Vue Query result with top 20 SymbolPositionGroup[] data
 */
export function useTop20PositionsByCapitalQuery(userId: string | null) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const key = relativeCapitalDeployedQueryKeys.top20(userId)

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<SymbolPositionGroup[]> => {
      console.log('🔍 [Top20Capital] Querying with:', {
        userId: userId || 'none (all accounts)'
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

      // Step 3: Build the main query to fetch all relevant positions
      let positionsQuery = supabase
        .schema('hf')
        .from('positions')
        .select('*')
        .eq('fetched_at', latestFetchedAt)
        .in('asset_class', ['STK', 'OPT', 'FUND'])

      // Apply account access filter if user has restrictions
      if (accessibleAccountIds.length > 0) {
        positionsQuery = positionsQuery.in('internal_account_id', accessibleAccountIds)
      }

      const { data: positionsData, error: positionsError } = await positionsQuery

      if (positionsError) {
        console.error('❌ Error fetching positions:', positionsError)
        throw positionsError
      }

      if (!positionsData || positionsData.length === 0) {
        console.log('📊 No positions found matching criteria')
        return []
      }

      console.log(`✅ Fetched ${positionsData.length} position(s) from database`)

      // Step 4: Filter positions - Keep stocks, funds, and PUT options only
      const filteredPositions = positionsData.filter((pos: any) => 
        shouldIncludePosition(pos.symbol, pos.asset_class)
      )

      console.log(`🔽 Filtered to ${filteredPositions.length} position(s) (STK + FUND + PUT options)`)

      if (filteredPositions.length === 0) {
        console.log('⚠️ No positions after filtering')
        return []
      }

      // Step 5: Group by symbol root and sum absolute accounting_quantity
      const symbolGroupMap = new Map<string, {
        totalQuantity: number
        positions: any[]
      }>()

      filteredPositions.forEach((pos: any) => {
        const symbolRoot = extractSymbolRoot(pos.symbol)
        if (!symbolRoot) return

        // Use accounting_quantity if available, otherwise fall back to qty
        const quantity = Math.abs(pos.accounting_quantity ?? pos.qty ?? 0)

        if (!symbolGroupMap.has(symbolRoot)) {
          symbolGroupMap.set(symbolRoot, {
            totalQuantity: 0,
            positions: []
          })
        }

        const group = symbolGroupMap.get(symbolRoot)!
        group.totalQuantity += quantity
        group.positions.push(pos)
      })

      console.log(`📦 Grouped into ${symbolGroupMap.size} unique symbol(s)`)

      // Step 6: Fetch accounts and aliases for account name enrichment
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
        console.error('⚠️ Error fetching accounts:', acctRes.error)
        // Continue without enrichment
      }

      // Map: internal_account_id -> alias (preferred) or legal_entity
      const aliasMap = new Map<string, string>(
        (aliasRes.data || []).map((r: any) => [r.internal_account_id, r.alias])
      )

      const legalEntityMap = new Map<string, string | null>(
        (acctRes.data || []).map((r: any) => [r.internal_account_id as string, r.legal_entity as string | null])
      )

      console.log(`📋 Fetched ${legalEntityMap.size} account(s), ${aliasMap.size} alias(es)`)

      // Enrich positions with account display names
      symbolGroupMap.forEach((group) => {
        group.positions = group.positions.map((pos: any) => {
          let accountDisplayName = pos.internal_account_id // fallback to ID
          
          // Prefer alias if set, otherwise use legal entity
          if (aliasMap.has(pos.internal_account_id)) {
            accountDisplayName = aliasMap.get(pos.internal_account_id)!
          } else if (legalEntityMap.has(pos.internal_account_id)) {
            const legalEntity = legalEntityMap.get(pos.internal_account_id)
            if (legalEntity) {
              accountDisplayName = legalEntity
            }
          }

          return {
            ...pos,
            account_display_name: accountDisplayName
          }
        })
      })

      // Step 7: Fetch current market prices for each symbol root
      const uniqueSymbolRoots = Array.from(symbolGroupMap.keys())
      
      if (uniqueSymbolRoots.length === 0) {
        console.log('⚠️ No unique symbols found')
        return []
      }

      console.log('💰 Fetching market prices for symbols:', uniqueSymbolRoots)

      // Query market prices - get latest price per symbol
      const { data: marketPriceData, error: marketPriceError } = await supabase
        .schema('hf')
        .from('market_price')
        .select('symbol, market_price')
        .in('symbol', uniqueSymbolRoots)
        .order('id', { ascending: false })

      if (marketPriceError) {
        console.warn('⚠️ Error fetching market prices:', marketPriceError)
      }

      // Create market price map - keep only the latest (first occurrence) per symbol
      const marketPriceMap = new Map<string, number>()
      if (marketPriceData) {
        marketPriceData.forEach((mp: any) => {
          if (!marketPriceMap.has(mp.symbol)) {
            marketPriceMap.set(mp.symbol, mp.market_price)
          }
        })
      }

      console.log(`📊 Fetched prices for ${marketPriceMap.size} symbol(s)`)

      // Step 8: Calculate capital invested and build result array
      const enrichedGroups: SymbolPositionGroup[] = []

      symbolGroupMap.forEach((group, symbolRoot) => {
        const currentMarketPrice = marketPriceMap.get(symbolRoot) ?? null
        const capitalInvested = currentMarketPrice 
          ? group.totalQuantity * currentMarketPrice 
          : 0

        enrichedGroups.push({
          symbolRoot,
          totalQuantity: group.totalQuantity,
          currentMarketPrice,
          capitalInvested,
          positionCount: group.positions.length,
          positions: group.positions
        })
      })

      // Step 9: Sort by capitalInvested DESC and take top 20
      enrichedGroups.sort((a, b) => b.capitalInvested - a.capitalInvested)
      const top20 = enrichedGroups.slice(0, 20)

      console.log('✅ Top 20 positions by capital invested:', {
        totalGroups: enrichedGroups.length,
        top20Count: top20.length,
        top20Symbols: top20.map(g => `${g.symbolRoot}: $${g.capitalInvested.toFixed(2)}`)
      })

      return top20
    },
    enabled: true, // Always enabled
    staleTime: 60_000, // 1 minute cache
    retry: 2 // Retry failed queries up to 2 times
  })

  // Optional: Set up realtime subscription for positions table changes
  const channel = supabase
    .channel('top20-capital-deployed')
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positions', 
        event: '*' 
      },
      () => {
        console.log('🔄 Positions table changed, invalidating top 20 capital query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      console.log('🧹 Cleaning up top 20 capital subscription')
      channel?.unsubscribe?.()
    }
  }
}
