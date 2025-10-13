import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useSupabase } from './core'

export interface Task {
  id: string
  summary: string
  description: string | null
  status: string
  assigned_to: string | null
  priority: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  comment: string
  created_by: string
  created_at: string
}

export interface TaskHistory {
  id: string
  task_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
}

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (filters?: { status?: string; search?: string }) => 
    [...taskQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...taskQueryKeys.all, 'detail', id] as const,
  comments: (taskId: string) => [...taskQueryKeys.all, 'comments', taskId] as const,
  history: (taskId: string) => [...taskQueryKeys.all, 'history', taskId] as const,
}

// Fetch all tasks
export function useTasksQuery(filters?: { status?: string; search?: string }) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .schema('hf')  // ✅ Added schema
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.search) {
        query = query.or(`summary.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
  })
}

// Fetch single task
export function useTaskQuery(taskId: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.detail(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (error) throw error
      return data as Task
    },
  })
}

// Fetch task comments
export function useTaskCommentsQuery(taskId: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.comments(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as TaskComment[]
    },
  })
}

// Fetch task history
export function useTaskHistoryQuery(taskId: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: taskQueryKeys.history(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: false })
      
      if (error) throw error
      return data as TaskHistory[]
    },
  })
}

// Create task
export function useCreateTaskMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
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

// Update task
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
      // Fetch current task for history
      const { data: currentTask } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      
      // Update task
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Record history
      if (currentTask) {
        const historyEntries = Object.entries(updates)
          .filter(([key]) => key !== 'updated_at')
          .map(([key, newValue]) => ({
            task_id: id,
            field_name: key,
            old_value: String(currentTask[key] || ''),
            new_value: String(newValue || ''),
            changed_by: userId,
          }))
        
        if (historyEntries.length > 0) {
          await supabase
            .schema('hf')  // ✅ Added schema
            .from('task_history')
            .insert(historyEntries)
        }
      }
      
      return data as Task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.history(variables.id) })
    },
  })
}

// Delete task mutation
export function useDeleteTaskMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('tasks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

// Add comment
export function useAddCommentMutation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (comment: Omit<TaskComment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .schema('hf')  // ✅ Added schema
        .from('task_comments')
        .insert(comment)
        .select()
        .single()
      
      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.comments(variables.task_id) })
    },
  })
}