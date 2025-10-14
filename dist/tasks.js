import { useQuery as l, useQueryClient as m, useMutation as y } from "@tanstack/vue-query";
import { useSupabase as i } from "./index.js";
import { computed as k, unref as d } from "vue";
const a = {
  all: ["tasks"],
  list: (e) => [...a.all, "list", e],
  detail: (e) => [...a.all, "detail", e],
  comments: (e) => [...a.all, "comments", e],
  history: (e) => [...a.all, "history", e]
};
function b(e) {
  const r = i();
  return l({
    queryKey: k(() => {
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
function g(e) {
  const r = i();
  return l({
    queryKey: a.detail(e),
    queryFn: async () => {
      const { data: t, error: s } = await r.schema("hf").from("tasks").select("*").eq("id", e).single();
      if (s) throw s;
      return t;
    },
    enabled: !!e
  });
}
function Q(e) {
  const r = i();
  return l({
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
  return l({
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
  const e = i(), r = m();
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
  const e = i(), r = m();
  return y({
    mutationFn: async ({
      id: t,
      updates: s,
      userId: n
    }) => {
      const { data: u, error: c } = await e.schema("hf").from("tasks").select("*").eq("id", t).single();
      if (c) throw c;
      const { data: q, error: h } = await e.schema("hf").from("tasks").update(s).eq("id", t).select().single();
      if (h) throw h;
      const f = Object.keys(s).filter((o) => u[o] !== s[o]).map((o) => ({
        task_id: t,
        field_name: o,
        old_value: String(u[o] || ""),
        new_value: String(s[o] || ""),
        changed_by: n
      }));
      if (f.length > 0) {
        const { error: o } = await e.schema("hf").from("task_history").insert(f);
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
  const e = i(), r = m();
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
  const e = i(), r = m();
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
export {
  a as taskQueryKeys,
  T as useAddCommentMutation,
  v as useCreateTaskMutation,
  C as useDeleteTaskMutation,
  Q as useTaskCommentsQuery,
  K as useTaskHistoryQuery,
  g as useTaskQuery,
  b as useTasksQuery,
  F as useUpdateTaskMutation
};
