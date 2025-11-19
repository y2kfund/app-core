import { Position } from './core';
export declare const relativeCapitalDeployedQueryKeys: {
    top20: (userId: string | null) => readonly ["relativeCapitalDeployed", "top20", string | null];
};
export interface SymbolPositionGroup {
    symbolRoot: string;
    totalQuantity: number;
    currentMarketPrice: number | null;
    capitalInvested: number;
    positionCount: number;
    positions: Position[];
}
/**
 * Query hook to fetch top 20 largest positions by capital invested
 * across all accessible accounts for a user.
 *
 * Workflow:
 * 1. Fetch user's accessible accounts
 * 2. Get latest snapshot timestamp
 * 3. Fetch all positions (STK + OPT) at latest snapshot
 * 4. Filter: Keep stocks and PUT options only
 * 5. Group by symbol root and sum |accounting_quantity|
 * 6. Fetch accounts and aliases, enrich positions with account display names
 * 7. Fetch current market prices for each symbol
 * 8. Calculate capitalInvested = totalQuantity × currentMarketPrice
 * 9. Sort by capitalInvested DESC and return top 20
 *
 * @param userId - User ID for account access control (null = all accounts)
 * @returns Vue Query result with top 20 SymbolPositionGroup[] data
 */
export declare function useTop20PositionsByCapitalQuery(userId: string | null): {
    _cleanup: () => void;
    data: import('vue').Ref<SymbolPositionGroup[], SymbolPositionGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<SymbolPositionGroup[], SymbolPositionGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<SymbolPositionGroup[], SymbolPositionGroup[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<SymbolPositionGroup[]>, Promise<SymbolPositionGroup[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<SymbolPositionGroup[], Error>>;
};
