import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/vue-query'
import { useSupabase } from './core'
import { computed, unref, type ComputedRef, type Ref } from 'vue'

// Task type definition
export interface Task {
  id: string
  summary: string
  description?: string
  status: 'open' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  created_by: string
  created_at: string
  updated_at: string
  archived?: boolean // <-- Add this line
}

// Task Comment type
export interface TaskComment {
  id: string
  task_id: string
  comment: string
  created_by: string
  created_at: string
}

// Task History type
export interface TaskHistory {
  id: string
  task_id: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  changed_at: string
}

// Query keys
export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (filters?: { status?: string; search?: string }) => 
    [...taskQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...taskQueryKeys.all, 'detail', id] as const,
  comments: (taskId: string) => [...taskQueryKeys.all, 'comments', taskId] as const,
  history: (taskId: string) => [...taskQueryKeys.all, 'history', taskId] as const,
}

// Fetch all tasks with optional filters
export function useTasksQuery(
  filters?: ComputedRef<{ status?: string; search?: string }> | Ref<{ status?: string; search?: string }> | { status?: string; search?: string }
) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: computed(() => {
      const filterValue = filters ? unref(filters) : {}
      return taskQueryKeys.list(filterValue)
    }),
    queryFn: async () => {
      const filterValue = filters ? unref(filters) : {}
      
      let query = supabase
        .schema('hf')
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Apply status filter
      if (filterValue?.status) {
        query = query.eq('status', filterValue.status)
      }
      
      // Apply search filter (search in summary and description)
      if (filterValue?.search && filterValue.search.trim()) {
        const searchTerm = filterValue.search.trim()
        query = query.or(`summary.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
  })
}

// Fetch single task by ID
export function useTaskQuery(id: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Task
    },
    enabled: !!id,
  })
}

// Fetch task comments
export function useTaskCommentsQuery(taskId: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.comments(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as TaskComment[]
    },
    enabled: !!taskId,
  })
}

// Fetch task history
export function useTaskHistoryQuery(taskId: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.history(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: false })
      
      if (error) throw error
      return data as TaskHistory[]
    },
    enabled: !!taskId,
  })
}

// Create task mutation
export function useCreateTaskMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .schema('hf')
        .from('tasks')
        .insert(task)
        .select()
        .single()
      
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

// Update task mutation - with history tracking
export function useUpdateTaskMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      userId 
    }: { 
      id: string
      updates: Partial<Task>
      userId: string 
    }) => {
      // Get current task to track changes
      const { data: currentTask, error: fetchError } = await supabase
        .schema('hf')
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError

      // Update the task
      const { data, error } = await supabase
        .schema('hf')
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      // Create history entries for changed fields
      const historyEntries = Object.keys(updates)
        .filter(key => currentTask[key] !== updates[key as keyof Task])
        .map(key => ({
          task_id: id,
          field_name: key,
          old_value: String(currentTask[key] || ''),
          new_value: String(updates[key as keyof Task] || ''),
          changed_by: userId,
        }))

      if (historyEntries.length > 0) {
        const { error: historyError } = await supabase
          .schema('hf')
          .from('task_history')
          .insert(historyEntries)
        
        if (historyError) console.error('Failed to save history:', historyError)
      }
      
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.history(data.id) })
    },
  })
}

// Add comment mutation
export function useAddCommentMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (comment: Omit<TaskComment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .schema('hf')
        .from('task_comments')
        .insert(comment)
        .select()
        .single()
      
      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.comments(data.task_id) })
    },
  })
}

// Delete task mutation
export function useDeleteTaskMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete comments first
      await supabase
        .schema('hf')
        .from('task_comments')
        .delete()
        .eq('task_id', id)

      // Delete history
      await supabase
        .schema('hf')
        .from('task_history')
        .delete()
        .eq('task_id', id)

      // Delete task
      const { error } = await supabase
        .schema('hf')
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

// Fetch all users for assignment dropdown
export function useUsersQuery() {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['users'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_view')
        .select('id, email, name')
        .order('email')
      
      if (error) throw error
      
      return (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || user.email
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}