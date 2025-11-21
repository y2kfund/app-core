import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSupabase } from './core'
import { 
  useTop20PositionsByCapitalQuery, 
  type SymbolPositionGroup 
} from './relativeCapitalDeployedForRiskManagement'

// Query key factory
export const capitalAcrossThesisQueryKeys = {
  all: (userId: string | null) => 
    ['capitalAcrossThesis', userId] as const
}

// Interface for thesis master record
interface ThesisMaster {
  id: string
  title: string
  description: string | null
  parent_thesis_id: string | null
  created_at: string
  updated_at: string
}

// Interface for symbol detail within a thesis group
export interface SymbolDetail {
  symbolRoot: string
  capitalInvested: number
  totalQuantity: number
  currentMarketPrice: number | null
  positionCount: number
}

// Interface for aggregated thesis capital group (output)
export interface ThesisCapitalGroup {
  thesisId: string | null // null for "Unassigned"
  thesisTitle: string
  parentThesisId: string | null
  parentThesisTitle: string | null
  totalCapital: number
  symbolCount: number
  symbols: SymbolDetail[]
}

/**
 * Query hook to calculate capital deployment across thesis and parent thesis.
 * 
 * Workflow:
 * 1. Fetch top 20 positions by capital from useTop20PositionsByCapitalQuery
 * 2. Extract unique symbol roots
 * 3. Query positionsAndThesisConnection to get thesis_id for each symbol
 * 4. Query thesisMaster to get thesis titles and parent_thesis_id
 * 5. Query thesisMaster again to get parent thesis titles
 * 6. Group positions by thesis and sum capital
 * 7. Handle unassigned symbols (no thesis connection)
 * 8. Return sorted array of ThesisCapitalGroup for pie chart
 * 
 * @param userId - User ID for account access control
 * @returns Vue Query result with ThesisCapitalGroup[] data
 */
export function useCapitalAcrossThesisQuery(userId: string | null) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const key = capitalAcrossThesisQueryKeys.all(userId)

  // Fetch top 20 positions first
  const top20Query = useTop20PositionsByCapitalQuery(userId)

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ThesisCapitalGroup[]> => {
      console.log('📊 [CapitalAcrossThesis] Starting query for userId:', userId || 'all accounts')

      // Step 1: Get top 20 positions by capital
      const top20Positions = top20Query.data?.value
      
      if (!top20Positions || top20Positions.length === 0) {
        console.log('⚠️ No top 20 positions found')
        return []
      }

      console.log(`✅ Retrieved ${top20Positions.length} top positions`)

      // Step 2: Extract unique symbol roots
      const symbolRoots = top20Positions.map((pos: SymbolPositionGroup) => pos.symbolRoot)
      console.log('📋 Symbol roots:', symbolRoots)

      // Step 3: Query positionsAndThesisConnection
      const { data: thesisConnections, error: connectionsError } = await supabase
        .schema('hf')
        .from('positionsAndThesisConnection')
        .select('*')
        .in('symbol_root', symbolRoots)

      if (connectionsError) {
        console.error('❌ Error fetching thesis connections:', connectionsError)
        throw connectionsError
      }

      console.log(`🔗 Found ${thesisConnections?.length || 0} thesis connection(s)`)

      // Create map: symbol_root → thesis_id[]
      const symbolToThesisMap = new Map<string, string[]>()
      
      if (thesisConnections) {
        thesisConnections.forEach((conn: any) => {
          if (!symbolToThesisMap.has(conn.symbol_root)) {
            symbolToThesisMap.set(conn.symbol_root, [])
          }
          symbolToThesisMap.get(conn.symbol_root)!.push(conn.thesis_id)
        })
      }

      // Step 4: Fetch thesis details
      const allThesisIds = Array.from(
        new Set(
          thesisConnections?.map((conn: any) => conn.thesis_id) || []
        )
      )

      let thesisMap = new Map<string, ThesisMaster>()
      
      if (allThesisIds.length > 0) {
        const { data: thesisData, error: thesisError } = await supabase
          .schema('hf')
          .from('thesisMaster')
          .select('*')
          .in('id', allThesisIds)

        if (thesisError) {
          console.error('❌ Error fetching thesis master:', thesisError)
          throw thesisError
        }

        console.log(`📚 Fetched ${thesisData?.length || 0} thesis record(s)`)

        if (thesisData) {
          thesisData.forEach((thesis: any) => {
            thesisMap.set(thesis.id, thesis)
          })
        }

        // Step 5: Fetch parent thesis details
        const parentThesisIds = Array.from(
          new Set(
            thesisData
              ?.map((t: any) => t.parent_thesis_id)
              .filter((id: any) => id !== null) || []
          )
        )

        if (parentThesisIds.length > 0) {
          const { data: parentThesisData, error: parentThesisError } = await supabase
            .schema('hf')
            .from('thesisMaster')
            .select('*')
            .in('id', parentThesisIds)

          if (parentThesisError) {
            console.error('❌ Error fetching parent thesis:', parentThesisError)
            // Continue without parent thesis data
          }

          console.log(`👪 Fetched ${parentThesisData?.length || 0} parent thesis record(s)`)

          if (parentThesisData) {
            parentThesisData.forEach((thesis: any) => {
              thesisMap.set(thesis.id, thesis)
            })
          }
        }
      }

      // Step 6: Group capital by thesis
      const thesisCapitalMap = new Map<string, {
        thesisId: string | null
        thesisTitle: string
        parentThesisId: string | null
        parentThesisTitle: string | null
        totalCapital: number
        symbols: Map<string, SymbolDetail>
      }>()

      // Helper to get or create thesis group
      const getOrCreateThesisGroup = (
        thesisId: string | null, 
        thesisTitle: string,
        parentThesisId: string | null = null,
        parentThesisTitle: string | null = null
      ) => {
        const key = thesisId || 'UNASSIGNED'
        if (!thesisCapitalMap.has(key)) {
          thesisCapitalMap.set(key, {
            thesisId,
            thesisTitle,
            parentThesisId,
            parentThesisTitle,
            totalCapital: 0,
            symbols: new Map()
          })
        }
        return thesisCapitalMap.get(key)!
      }

      // Process each position
      top20Positions.forEach((position: SymbolPositionGroup) => {
        const symbolRoot = position.symbolRoot
        const thesisIds = symbolToThesisMap.get(symbolRoot) || []

        if (thesisIds.length === 0) {
          // Unassigned - no thesis connection
          const group = getOrCreateThesisGroup(null, 'Unassigned')
          group.totalCapital += position.capitalInvested
          
          group.symbols.set(symbolRoot, {
            symbolRoot: position.symbolRoot,
            capitalInvested: position.capitalInvested,
            totalQuantity: position.totalQuantity,
            currentMarketPrice: position.currentMarketPrice,
            positionCount: position.positionCount
          })
        } else {
          // Has thesis connection(s)
          // Note: A symbol might be connected to multiple theses
          // For simplicity, we'll distribute capital equally across all connected theses
          const capitalPerThesis = position.capitalInvested / thesisIds.length

          thesisIds.forEach(thesisId => {
            const thesis = thesisMap.get(thesisId)
            if (!thesis) {
              console.warn(`⚠️ Thesis ${thesisId} not found in thesisMaster`)
              return
            }

            // Get parent thesis info if exists
            let parentThesisTitle: string | null = null
            if (thesis.parent_thesis_id) {
              const parentThesis = thesisMap.get(thesis.parent_thesis_id)
              parentThesisTitle = parentThesis?.title || null
            }

            const group = getOrCreateThesisGroup(
              thesis.id,
              thesis.title,
              thesis.parent_thesis_id,
              parentThesisTitle
            )

            group.totalCapital += capitalPerThesis

            // Add or update symbol detail
            const existingSymbol = group.symbols.get(symbolRoot)
            if (existingSymbol) {
              existingSymbol.capitalInvested += capitalPerThesis
            } else {
              group.symbols.set(symbolRoot, {
                symbolRoot: position.symbolRoot,
                capitalInvested: capitalPerThesis,
                totalQuantity: position.totalQuantity,
                currentMarketPrice: position.currentMarketPrice,
                positionCount: position.positionCount
              })
            }
          })
        }
      })

      // Step 7: Build result array
      const result: ThesisCapitalGroup[] = []

      thesisCapitalMap.forEach(group => {
        result.push({
          thesisId: group.thesisId,
          thesisTitle: group.thesisTitle,
          parentThesisId: group.parentThesisId,
          parentThesisTitle: group.parentThesisTitle,
          totalCapital: group.totalCapital,
          symbolCount: group.symbols.size,
          symbols: Array.from(group.symbols.values())
        })
      })

      // Step 8: Sort by capital DESC
      result.sort((a, b) => b.totalCapital - a.totalCapital)

      console.log('✅ Capital across thesis calculated:', {
        thesisCount: result.length,
        totalCapital: result.reduce((sum, g) => sum + g.totalCapital, 0),
        breakdown: result.map(g => ({
          thesis: g.thesisTitle,
          parent: g.parentThesisTitle || 'none',
          capital: `$${g.totalCapital.toFixed(2)}`,
          symbols: g.symbolCount
        }))
      })

      return result
    },
    enabled: !!top20Query.data, // Only run when top20 data is available
    staleTime: 60_000, // 1 minute cache
    retry: 2
  })

  // Set up realtime subscription for relevant tables
  const channel = supabase
    .channel('capital-across-thesis')
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'positionsAndThesisConnection', 
        event: '*' 
      },
      () => {
        console.log('🔄 positionsAndThesisConnection changed, invalidating query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .on('postgres_changes',
      { 
        schema: 'hf', 
        table: 'thesisMaster', 
        event: '*' 
      },
      () => {
        console.log('🔄 thesisMaster changed, invalidating query')
        qc.invalidateQueries({ queryKey: key })
      }
    )
    .subscribe()

  return { 
    ...query, 
    _cleanup: () => {
      console.log('🧹 Cleaning up capital across thesis subscription')
      channel?.unsubscribe?.()
    }
  }
}
