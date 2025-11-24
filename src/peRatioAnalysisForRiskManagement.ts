import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase } from './core'
import { 
  useTop20PositionsByCapitalQuery, 
  type SymbolPositionGroup 
} from './relativeCapitalDeployedForRiskManagement'

// Query key factory
export const peRatioAnalysisQueryKeys = {
  all: (userId: string | null) => 
    ['peRatioAnalysis', userId] as const
}

// Interface for financial data from financial_data table
interface FinancialData {
  id: number
  symbol: string
  conid: string
  week_52_high: number | null
  week_52_low: number | null
  pe_ratio: number | null
  eps: number | null
  market_cap: number | null
  computed_peg_ratio: number | null
  last_updated_at: string
  created_at: string
}

// Interface for position enriched with financial data
export interface PEPositionDetail {
  symbolRoot: string
  capitalInvested: number
  totalQuantity: number
  currentMarketPrice: number | null
  positionCount: number
  // Financial data
  peRatio: number | null
  eps: number | null
  marketCap: number | null
  week52High: number | null
  week52Low: number | null
  computedPegRatio: number | null
  lastUpdatedAt: string | null
}

// Interface for P/E analysis summary (output)
export interface PEAnalysisSummary {
  positions: PEPositionDetail[]
  statistics: {
    averagePE: number | null
    medianPE: number | null
    minPE: number | null
    maxPE: number | null
    totalCapital: number
    capitalWithPE: number
    capitalWithoutPE: number
    symbolsWithPE: number
    symbolsWithoutPE: number
  }
}

/**
 * Query hook to analyze P/E ratios across top 20 positions by capital.
 * 
 * Workflow:
 * 1. Fetch top 20 positions by capital from useTop20PositionsByCapitalQuery
 * 2. Extract unique symbol roots
 * 3. Query financial_data table to get P/E ratios and other financial metrics
 * 4. Create symbol → financial data map
 * 5. Enrich each position with financial data
 * 6. Calculate statistics (average, median, min, max P/E ratios)
 * 7. Group positions by whether they have P/E data
 * 8. Return sorted array with statistics
 * 
 * @param userId - User ID for account access control
 * @returns Vue Query result with PEAnalysisSummary data
 */
export function usePEAnalysisQuery(userId: string | null) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const key = peRatioAnalysisQueryKeys.all(userId)

  // Fetch top 20 positions first
  const top20Query = useTop20PositionsByCapitalQuery(userId)

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<PEAnalysisSummary> => {
      console.log('📊 [PEAnalysis] Starting P/E ratio analysis for userId:', userId || 'all accounts')

      // Step 1: Get top 20 positions by capital
      const top20Positions = top20Query.data.value
      
      if (!top20Positions || top20Positions.length === 0) {
        console.log('⚠️ No top 20 positions found')
        return {
          positions: [],
          statistics: {
            averagePE: null,
            medianPE: null,
            minPE: null,
            maxPE: null,
            totalCapital: 0,
            capitalWithPE: 0,
            capitalWithoutPE: 0,
            symbolsWithPE: 0,
            symbolsWithoutPE: 0
          }
        }
      }

      console.log(`✅ Retrieved ${top20Positions.length} top positions`)

      // Step 2: Extract unique symbol roots
      const symbolRoots = top20Positions.map((pos: SymbolPositionGroup) => pos.symbolRoot)
      console.log('📋 Symbol roots:', symbolRoots)

      // Step 3: Query financial_data table
      const { data: financialData, error: financialError } = await supabase
        .schema('hf')
        .from('financial_data')
        .select('*')
        .in('symbol', symbolRoots)

      if (financialError) {
        console.error('❌ Error fetching financial data:', financialError)
        throw financialError
      }

      console.log(`💰 Found ${financialData?.length || 0} financial data record(s)`)

      // Step 4: Create map: symbol → financial data
      const financialDataMap = new Map<string, FinancialData>()
      
      if (financialData) {
        financialData.forEach((fd: any) => {
          financialDataMap.set(fd.symbol, fd)
        })
      }

      // Step 5: Enrich positions with financial data
      const enrichedPositions: PEPositionDetail[] = top20Positions.map((position: SymbolPositionGroup) => {
        const financial = financialDataMap.get(position.symbolRoot)
        
        return {
          symbolRoot: position.symbolRoot,
          capitalInvested: position.capitalInvested,
          totalQuantity: position.totalQuantity,
          currentMarketPrice: position.currentMarketPrice,
          positionCount: position.positionCount,
          // Financial data (null if not found)
          peRatio: financial?.pe_ratio || null,
          eps: financial?.eps || null,
          marketCap: financial?.market_cap || null,
          week52High: financial?.week_52_high || null,
          week52Low: financial?.week_52_low || null,
          computedPegRatio: financial?.computed_peg_ratio || null,
          lastUpdatedAt: financial?.last_updated_at || null
        }
      })

      // Step 6: Calculate statistics
      const positionsWithPE = enrichedPositions.filter(p => p.peRatio !== null)
      const positionsWithoutPE = enrichedPositions.filter(p => p.peRatio === null)

      const totalCapital = enrichedPositions.reduce((sum, p) => sum + p.capitalInvested, 0)
      const capitalWithPE = positionsWithPE.reduce((sum, p) => sum + p.capitalInvested, 0)
      const capitalWithoutPE = positionsWithoutPE.reduce((sum, p) => sum + p.capitalInvested, 0)

      // Calculate average P/E
      let averagePE: number | null = null
      if (positionsWithPE.length > 0) {
        const sumPE = positionsWithPE.reduce((sum, p) => sum + (p.peRatio || 0), 0)
        averagePE = sumPE / positionsWithPE.length
      }

      // Calculate median P/E
      let medianPE: number | null = null
      if (positionsWithPE.length > 0) {
        const sortedPEs = positionsWithPE
          .map(p => p.peRatio!)
          .sort((a, b) => a - b)
        
        const midIndex = Math.floor(sortedPEs.length / 2)
        if (sortedPEs.length % 2 === 0) {
          medianPE = (sortedPEs[midIndex - 1] + sortedPEs[midIndex]) / 2
        } else {
          medianPE = sortedPEs[midIndex]
        }
      }

      // Calculate min/max P/E
      const minPE = positionsWithPE.length > 0 
        ? Math.min(...positionsWithPE.map(p => p.peRatio!))
        : null
      const maxPE = positionsWithPE.length > 0
        ? Math.max(...positionsWithPE.map(p => p.peRatio!))
        : null

      // Step 7: Sort positions - first by P/E ratio (ASC), then by capital (DESC)
      const sortedPositions = [...enrichedPositions].sort((a, b) => {
        // Positions without P/E go to the end
        if (a.peRatio === null && b.peRatio !== null) return 1
        if (a.peRatio !== null && b.peRatio === null) return -1
        if (a.peRatio === null && b.peRatio === null) {
          // Sort by capital DESC when both have no P/E
          return b.capitalInvested - a.capitalInvested
        }
        // Sort by P/E ASC when both have P/E
        return a.peRatio! - b.peRatio!
      })

      const result: PEAnalysisSummary = {
        positions: sortedPositions,
        statistics: {
          averagePE,
          medianPE,
          minPE,
          maxPE,
          totalCapital,
          capitalWithPE,
          capitalWithoutPE,
          symbolsWithPE: positionsWithPE.length,
          symbolsWithoutPE: positionsWithoutPE.length
        }
      }

      console.log('✅ P/E ratio analysis completed:', {
        totalPositions: enrichedPositions.length,
        withPE: positionsWithPE.length,
        withoutPE: positionsWithoutPE.length,
        averagePE: averagePE?.toFixed(2),
        medianPE: medianPE?.toFixed(2),
        minPE: minPE?.toFixed(2),
        maxPE: maxPE?.toFixed(2),
        totalCapital: `$${totalCapital.toFixed(2)}`,
        capitalWithPE: `$${capitalWithPE.toFixed(2)}`,
        capitalWithoutPE: `$${capitalWithoutPE.toFixed(2)}`
      })

      return result
    },
    enabled: computed(() => !!top20Query.data.value && top20Query.data.value.length > 0), // Only run when top20 data is available
    staleTime: 60_000, // 1 minute cache
    retry: 2
  })

  // Set up realtime subscription for relevant tables
  const channel = supabase
    .channel('pe-ratio-analysis')
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positions', 
        event: '*' 
      },
      () => {
        console.log('🔄 positions changed, invalidating P/E analysis query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'financial_data', 
        event: '*' 
      },
      () => {
        console.log('🔄 financial_data changed, invalidating P/E analysis query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      console.log('🧹 Cleaning up P/E analysis subscription')
      channel?.unsubscribe?.()
    }
  }
}
