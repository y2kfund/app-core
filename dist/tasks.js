import { useQuery as m, useQueryClient as l, useMutation as y } from "@tanstack/vue-query";
import { useSupabase as i } from "./index.js";
import { computed as w, unref as d } from "vue";
const a = {
  all: ["tasks"],
  list: (e) => [...a.all, "list", e],
  detail: (e) => [...a.all, "detail", e],
  comments: (e) => [...a.all, "comments", e],
  history: (e) => [...a.all, "history", e]
};
function b(e) {
  const r = i();
  return m({
    queryKey: w(() => {
      const t = e ? d(e) : {};
      return a.list(t);
    }),
    queryFn: async () => {
      const t = e ? d(e) : {};
      let s = r.schema("hf").from("tasks").select("*").order("created_at", { ascending: !1 });
      if (t != null && t.status && (s = s.eq("status", t.status)), t != null && t.search && t.search.trim()) {
        const c = t.search.trim();
        s = s.or(`summary.ilike.%${c}%,description.ilike.%${c}%`);
      }
      const { data: n, error: u } = await s;
      if (u) throw u;
      return n;
    }
  });
}
function Q(e) {
  const r = i();
  return m({
    queryKey: a.detail(e),
    queryFn: async () => {
      const { data: t, error: s } = await r.schema("hf").from("tasks").select("*").eq("id", e).single();
      if (s) throw s;
      return t;
    },
    enabled: !!e
  });
}
function g(e) {
  const r = i();
  return m({
    queryKey: a.comments(e),
    queryFn: async () => {
      const { data: t, error: s } = await r.schema("hf").from("task_comments").select("*").eq("task_id", e).order("created_at", { ascending: !1 });
      if (s) throw s;
      return t;
    },
    enabled: !!e
  });
}
function K(e) {
  const r = i();
  return m({
    queryKey: a.history(e),
    queryFn: async () => {
      const { data: t, error: s } = await r.schema("hf").from("task_history").select("*").eq("task_id", e).order("changed_at", { ascending: !1 });
      if (s) throw s;
      return t;
    },
    enabled: !!e
  });
}
function v() {
  const e = i(), r = l();
  return y({
    mutationFn: async (t) => {
      const { data: s, error: n } = await e.schema("hf").from("tasks").insert(t).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: () => {
      r.invalidateQueries({ queryKey: a.all });
    }
  });
}
function F() {
  const e = i(), r = l();
  return y({
    mutationFn: async ({
      id: t,
      updates: s,
      userId: n
    }) => {
      const { data: u, error: c } = await e.schema("hf").from("tasks").select("*").eq("id", t).single();
      if (c) throw c;
      const { data: q, error: f } = await e.schema("hf").from("tasks").update(s).eq("id", t).select().single();
      if (f) throw f;
      const h = Object.keys(s).filter((o) => u[o] !== s[o]).map((o) => ({
        task_id: t,
        field_name: o,
        old_value: String(u[o] || ""),
        new_value: String(s[o] || ""),
        changed_by: n
      }));
      if (h.length > 0) {
        const { error: o } = await e.schema("hf").from("task_history").insert(h);
        o && console.error("Failed to save history:", o);
      }
      return q;
    },
    onSuccess: (t) => {
      r.invalidateQueries({ queryKey: a.all }), r.invalidateQueries({ queryKey: a.detail(t.id) }), r.invalidateQueries({ queryKey: a.history(t.id) });
    }
  });
}
function T() {
  const e = i(), r = l();
  return y({
    mutationFn: async (t) => {
      const { data: s, error: n } = await e.schema("hf").from("task_comments").insert(t).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: (t) => {
      r.invalidateQueries({ queryKey: a.comments(t.task_id) });
    }
  });
}
function C() {
  const e = i(), r = l();
  return y({
    mutationFn: async (t) => {
      await e.schema("hf").from("task_comments").delete().eq("task_id", t), await e.schema("hf").from("task_history").delete().eq("task_id", t);
      const { error: s } = await e.schema("hf").from("tasks").delete().eq("id", t);
      if (s) throw s;
      return t;
    },
    onSuccess: () => {
      r.invalidateQueries({ queryKey: a.all });
    }
  });
}
function S() {
  const e = i();
  return m({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: r, error: t } = await e.from("users_view").select("id, email, name").order("email");
      if (t) throw t;
      return (r || []).map((s) => ({
        id: s.id,
        email: s.email,
        name: s.name || s.email
      }));
    },
    staleTime: 5 * 60 * 1e3
  });
}
export {
  a as taskQueryKeys,
  T as useAddCommentMutation,
  v as useCreateTaskMutation,
  C as useDeleteTaskMutation,
  g as useTaskCommentsQuery,
  K as useTaskHistoryQuery,
  Q as useTaskQuery,
  b as useTasksQuery,
  F as useUpdateTaskMutation,
  S as useUsersQuery
};
