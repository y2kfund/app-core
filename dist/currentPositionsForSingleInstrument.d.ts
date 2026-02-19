import { Position } from './core';

export declare const currentPositionQueryKeys: {
    details: (userId: string | null, symbolName: string) => readonly ["currentPosition", string | null, string];
};
/**
 * Query hook to fetch instrument details (positions) filtered by:
 * - User's accessible accounts
 * - Latest fetched_at snapshot
 * - Asset class = 'STK' (stocks only)
 * - Symbol containing the search term (case-insensitive partial match)
 *
 * @param userId - User ID for account access control (null = all accounts)
 * @param symbolName - Symbol/instrument name to search for (partial match)
 * @returns Vue Query result with Position[] data
 */
export declare function useCurrentPositionQuery(userId: string | null, symbolName: string): {
    _cleanup: () => void;
    data: import('vue').Ref<Position[], Position[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<Position[], Position[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<Position[], Position[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<Position[]>, Promise<Position[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<Position[], Error>>;
};
