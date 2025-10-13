export interface Task {
    id: string;
    summary: string;
    description: string | null;
    status: string;
    assigned_to: string | null;
    priority: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface TaskComment {
    id: string;
    task_id: string;
    comment: string;
    created_by: string;
    created_at: string;
}
export interface TaskHistory {
    id: string;
    task_id: string;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string;
    changed_at: string;
}
export declare const taskQueryKeys: {
    all: readonly ["tasks"];
    list: (filters?: {
        status?: string;
        search?: string;
    }) => readonly ["tasks", "list", {
        status?: string;
        search?: string;
    } | undefined];
    detail: (id: string) => readonly ["tasks", "detail", string];
    comments: (taskId: string) => readonly ["tasks", "comments", string];
    history: (taskId: string) => readonly ["tasks", "history", string];
};
export declare function useTasksQuery(filters?: {
    status?: string;
    search?: string;
}): import('@tanstack/vue-query').UseQueryReturnType<Task[], Error>;
export declare function useTaskQuery(taskId: string): import('@tanstack/vue-query').UseQueryReturnType<Task, Error>;
export declare function useTaskCommentsQuery(taskId: string): import('@tanstack/vue-query').UseQueryReturnType<TaskComment[], Error>;
export declare function useTaskHistoryQuery(taskId: string): import('@tanstack/vue-query').UseQueryReturnType<TaskHistory[], Error>;
export declare function useCreateTaskMutation(): import('@tanstack/vue-query').UseMutationReturnType<Task, Error, Omit<Task, "id" | "created_at" | "updated_at">, unknown, Omit<import('@tanstack/query-core').MutationObserverIdleResult<Task, Error, Omit<Task, "id" | "created_at" | "updated_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverLoadingResult<Task, Error, Omit<Task, "id" | "created_at" | "updated_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverErrorResult<Task, Error, Omit<Task, "id" | "created_at" | "updated_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverSuccessResult<Task, Error, Omit<Task, "id" | "created_at" | "updated_at">, unknown>, "mutate" | "reset">>;
export declare function useUpdateTaskMutation(): import('@tanstack/vue-query').UseMutationReturnType<Task, Error, {
    id: string;
    updates: Partial<Task>;
    userId: string;
}, unknown, Omit<import('@tanstack/query-core').MutationObserverIdleResult<Task, Error, {
    id: string;
    updates: Partial<Task>;
    userId: string;
}, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverLoadingResult<Task, Error, {
    id: string;
    updates: Partial<Task>;
    userId: string;
}, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverErrorResult<Task, Error, {
    id: string;
    updates: Partial<Task>;
    userId: string;
}, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverSuccessResult<Task, Error, {
    id: string;
    updates: Partial<Task>;
    userId: string;
}, unknown>, "mutate" | "reset">>;
export declare function useDeleteTaskMutation(): import('@tanstack/vue-query').UseMutationReturnType<void, Error, string, unknown, Omit<import('@tanstack/query-core').MutationObserverIdleResult<void, Error, string, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverLoadingResult<void, Error, string, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverErrorResult<void, Error, string, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverSuccessResult<void, Error, string, unknown>, "mutate" | "reset">>;
export declare function useAddCommentMutation(): import('@tanstack/vue-query').UseMutationReturnType<TaskComment, Error, Omit<TaskComment, "id" | "created_at">, unknown, Omit<import('@tanstack/query-core').MutationObserverIdleResult<TaskComment, Error, Omit<TaskComment, "id" | "created_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverLoadingResult<TaskComment, Error, Omit<TaskComment, "id" | "created_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverErrorResult<TaskComment, Error, Omit<TaskComment, "id" | "created_at">, unknown>, "mutate" | "reset"> | Omit<import('@tanstack/query-core').MutationObserverSuccessResult<TaskComment, Error, Omit<TaskComment, "id" | "created_at">, unknown>, "mutate" | "reset">>;
