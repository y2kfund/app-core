import { SupabaseClient } from '@supabase/supabase-js';
import { Position } from './core';

export interface PutPosition extends Position {
}
/**
 * Fetch all unique fetched_at timestamps
 */
export declare function fetchAvailableFetchedAtTimestamps(supabase: SupabaseClient): Promise<string[]>;
/**
 * Fetch put positions (symbols containing capital 'C') for a single instrument
 */
export declare function fetchPutPositionsForSymbol(supabase: SupabaseClient, symbolRoot: string, userId?: string | null, fetchedAt?: string | null): Promise<PutPosition[]>;
/**
 * Query hook for put positions with realtime updates
 */
export declare function usePutPositionsQuery(symbolRoot: string, userId?: string | null, fetchedAt?: import('vue').Ref<string | null> | string | null): {
    _cleanup: () => void;
    data: import('vue').Ref<PutPosition[], PutPosition[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<PutPosition[], PutPosition[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
} | {
    _cleanup: () => void;
    data: import('vue').Ref<PutPosition[], PutPosition[]>;
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
    refetch: (options?: import('@tanstack/query-core').RefetchOptions) => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
    fetchStatus: import('vue').Ref<import('@tanstack/query-core').FetchStatus, import('@tanstack/query-core').FetchStatus>;
    promise: import('vue').Ref<Promise<PutPosition[]>, Promise<PutPosition[]>>;
    suspense: () => Promise<import('@tanstack/query-core').QueryObserverResult<PutPosition[], Error>>;
};
/**
 * Query hook to fetch available fetched_at timestamps
 */
export declare function useAvailableFetchedAtQuery(): import('@tanstack/vue-query').UseQueryReturnType<string[], Error>;
