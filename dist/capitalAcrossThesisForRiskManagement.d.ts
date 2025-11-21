export declare const capitalAcrossThesisQueryKeys: {
    all: (userId: string | null) => readonly ["capitalAcrossThesis", string | null];
};
export interface SymbolDetail {
    symbolRoot: string;
    capitalInvested: number;
    totalQuantity: number;
    currentMarketPrice: number | null;
    positionCount: number;
}
export interface ThesisCapitalGroup {
    thesisId: string | null;
    thesisTitle: string;
    parentThesisId: string | null;
    parentThesisTitle: string | null;
    totalCapital: number;
    symbolCount: number;
    symbols: SymbolDetail[];
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
export declare function useCapitalAcrossThesisQuery(userId: string | null): {
    _cleanup: () => void;
    data: import('vue').Ref<ThesisCapitalGroup[], ThesisCapitalGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<ThesisCapitalGroup[], ThesisCapitalGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<ThesisCapitalGroup[], ThesisCapitalGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<ThesisCapitalGroup[]>, Promise<ThesisCapitalGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<ThesisCapitalGroup[], Error>>;
};
