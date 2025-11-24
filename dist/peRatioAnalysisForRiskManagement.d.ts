export declare const peRatioAnalysisQueryKeys: {
    all: (userId: string | null) => readonly ["peRatioAnalysis", string | null];
};
export interface PEPositionDetail {
    symbolRoot: string;
    capitalInvested: number;
    totalQuantity: number;
    currentMarketPrice: number | null;
    positionCount: number;
    peRatio: number | null;
    eps: number | null;
    marketCap: number | null;
    week52High: number | null;
    week52Low: number | null;
    computedPegRatio: number | null;
    lastUpdatedAt: string | null;
}
export interface PEAnalysisSummary {
    positions: PEPositionDetail[];
    statistics: {
        averagePE: number | null;
        medianPE: number | null;
        minPE: number | null;
        maxPE: number | null;
        totalCapital: number;
        capitalWithPE: number;
        capitalWithoutPE: number;
        symbolsWithPE: number;
        symbolsWithoutPE: number;
    };
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
export declare function usePEAnalysisQuery(userId: string | null): {
    _cleanup: () => void;
    data: import('vue').Ref<PEAnalysisSummary, PEAnalysisSummary>;
    error: import('vue').Ref<Error, Error>;
    isError: import('vue').Ref<true, true>;
    isPending: import('vue').Ref<false, false>;
    isLoading: import('vue').Ref<false, false>;
    isLoadingError: import('vue').Ref<false, false>;
    isRefetchError: import('vue').Ref<true, true>;
    isSuccess: import('vue').Ref<false, false>;
    isPlaceholderData: import('vue').Ref<false, false>;
    status: import('vue').Ref<"error", "error">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<PEAnalysisSummary, PEAnalysisSummary>;
    error: import('vue').Ref<null, null>;
    isError: import('vue').Ref<false, false>;
    isPending: import('vue').Ref<false, false>;
    isLoading: import('vue').Ref<false, false>;
    isLoadingError: import('vue').Ref<false, false>;
    isRefetchError: import('vue').Ref<false, false>;
    isSuccess: import('vue').Ref<true, true>;
    isPlaceholderData: import('vue').Ref<false, false>;
    status: import('vue').Ref<"success", "success">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<undefined, undefined>;
    error: import('vue').Ref<Error, Error>;
    isError: import('vue').Ref<true, true>;
    isPending: import('vue').Ref<false, false>;
    isLoading: import('vue').Ref<false, false>;
    isLoadingError: import('vue').Ref<true, true>;
    isRefetchError: import('vue').Ref<false, false>;
    isSuccess: import('vue').Ref<false, false>;
    isPlaceholderData: import('vue').Ref<false, false>;
    status: import('vue').Ref<"error", "error">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<undefined, undefined>;
    error: import('vue').Ref<null, null>;
    isError: import('vue').Ref<false, false>;
    isPending: import('vue').Ref<true, true>;
    isLoading: import('vue').Ref<true, true>;
    isLoadingError: import('vue').Ref<false, false>;
    isRefetchError: import('vue').Ref<false, false>;
    isSuccess: import('vue').Ref<false, false>;
    isPlaceholderData: import('vue').Ref<false, false>;
    status: import('vue').Ref<"pending", "pending">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<undefined, undefined>;
    error: import('vue').Ref<null, null>;
    isError: import('vue').Ref<false, false>;
    isPending: import('vue').Ref<true, true>;
    isLoadingError: import('vue').Ref<false, false>;
    isRefetchError: import('vue').Ref<false, false>;
    isSuccess: import('vue').Ref<false, false>;
    isPlaceholderData: import('vue').Ref<false, false>;
    status: import('vue').Ref<"pending", "pending">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isLoading: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<PEAnalysisSummary, PEAnalysisSummary>;
    isError: import('vue').Ref<false, false>;
    error: import('vue').Ref<null, null>;
    isPending: import('vue').Ref<false, false>;
    isLoading: import('vue').Ref<false, false>;
    isLoadingError: import('vue').Ref<false, false>;
    isRefetchError: import('vue').Ref<false, false>;
    isSuccess: import('vue').Ref<true, true>;
    isPlaceholderData: import('vue').Ref<true, true>;
    status: import('vue').Ref<"success", "success">;
    dataUpdatedAt: import('vue').Ref<number, number>;
    errorUpdatedAt: import('vue').Ref<number, number>;
    failureCount: import('vue').Ref<number, number>;
    failureReason: import('vue').Ref<Error | null, Error | null>;
    errorUpdateCount: import('vue').Ref<number, number>;
    isFetched: import('vue').Ref<boolean, boolean>;
    isFetchedAfterMount: import('vue').Ref<boolean, boolean>;
    isFetching: import('vue').Ref<boolean, boolean>;
    isInitialLoading: import('vue').Ref<boolean, boolean>;
    isPaused: import('vue').Ref<boolean, boolean>;
    isRefetching: import('vue').Ref<boolean, boolean>;
    isStale: import('vue').Ref<boolean, boolean>;
    isEnabled: import('vue').Ref<boolean, boolean>;
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PEAnalysisSummary>, Promise<PEAnalysisSummary>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PEAnalysisSummary, Error>>;
};
