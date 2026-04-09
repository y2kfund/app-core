import { useQueryClient as m, useMutation as l, useQuery as y } from "@tanstack/vue-query";
import { useSupabase as i } from "./index.js";
import { unref as _, computed as p } from "vue";
const r = {
  all: ["tasks"],
  list: (t) => [...r.all, "list", t],
  detail: (t) => [...r.all, "detail", t],
  comments: (t) => [...r.all, "comments", t],
  history: (t) => [...r.all, "history", t]
};
function b(t) {
  const a = i();
  return y({
    queryKey: p(() => {
      const e = t ? _(t) : {};
      return r.list(e);
    }),
    queryFn: async () => {
      const e = t ? _(t) : {};
      let s = a.schema("fund_ai").from("p_tasks_tasks").select("*").order("created_at", { ascending: !1 });
      if (e != null && e.status && (s = s.eq("status", e.status)), e != null && e.search && e.search.trim()) {
        const c = e.search.trim();
        s = s.or(`summary.ilike.%${c}%,description.ilike.%${c}%`);
      }
      const { data: n, error: u } = await s;
      if (u) throw u;
      return n;
    }
  });
}
function Q(t) {
  const a = i();
  return y({
    queryKey: r.detail(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("fund_ai").from("p_tasks_tasks").select("*").eq("id", t).single();
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function g(t) {
  const a = i();
  return y({
    queryKey: r.comments(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("fund_ai").from("p_tasks_comments").select("*").eq("task_id", t).order("created_at", { ascending: !1 });
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function K(t) {
  const a = i();
  return y({
    queryKey: r.history(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("fund_ai").from("p_tasks_history").select("*").eq("task_id", t).order("changed_at", { ascending: !1 });
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function v() {
  const t = i(), a = m();
  return l({
    mutationFn: async (e) => {
      const { data: s, error: n } = await t.schema("fund_ai").from("p_tasks_tasks").insert(e).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: () => {
      a.invalidateQueries({ queryKey: r.all });
    }
  });
}
function F() {
  const t = i(), a = m();
  return l({
    mutationFn: async ({
      id: e,
      updates: s,
      userId: n
    }) => {
      const { data: u, error: c } = await t.schema("fund_ai").from("p_tasks_tasks").select("*").eq("id", e).single();
      if (c) throw c;
      const { data: h, error: d } = await t.schema("fund_ai").from("p_tasks_tasks").update(s).eq("id", e).select().single();
      if (d) throw d;
      const f = Object.keys(s).filter((o) => u[o] !== s[o]).map((o) => ({
        task_id: e,
        field_name: o,
        old_value: String(u[o] || ""),
        new_value: String(s[o] || ""),
        changed_by: n
      }));
      if (f.length > 0) {
        const { error: o } = await t.schema("fund_ai").from("p_tasks_history").insert(f);
        o && console.error("Failed to save history:", o);
      }
      return h;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.all }), a.invalidateQueries({ queryKey: r.detail(e.id) }), a.invalidateQueries({ queryKey: r.history(e.id) });
    }
  });
}
function C() {
  const t = i(), a = m();
  return l({
    mutationFn: async (e) => {
      const { data: s, error: n } = await t.schema("fund_ai").from("p_tasks_comments").insert(e).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.comments(e.task_id) });
    }
  });
}
function T() {
  const t = i(), a = m();
  return l({
    mutationFn: async (e) => {
      await t.schema("fund_ai").from("p_tasks_comments").delete().eq("task_id", e), await t.schema("fund_ai").from("p_tasks_history").delete().eq("task_id", e);
      const { error: s } = await t.schema("fund_ai").from("p_tasks_tasks").delete().eq("id", e);
      if (s) throw s;
      return e;
    },
    onSuccess: () => {
      a.invalidateQueries({ queryKey: r.all });
    }
  });
}
function S() {
  const t = i(), a = m();
  return l({
    mutationFn: async ({ id: e, comment: s }) => {
      const { data: n, error: u } = await t.schema("fund_ai").from("p_tasks_comments").update({ comment: s }).eq("id", e).select().single();
      if (u) throw u;
      return n;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.comments(e.task_id) });
    }
  });
}
function M() {
  const t = i();
  return y({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: a, error: e } = await t.from("users_view").select("id, email, name").order("email");
      if (e) throw e;
      return (a || []).map((s) => ({
        id: s.id,
        email: s.email,
        name: s.name || s.email
      }));
    },
    staleTime: 5 * 60 * 1e3
  });
}
export {
  r as taskQueryKeys,
  C as useAddCommentMutation,
  v as useCreateTaskMutation,
  T as useDeleteTaskMutation,
  g as useTaskCommentsQuery,
  K as useTaskHistoryQuery,
  Q as useTaskQuery,
  b as useTasksQuery,
  S as useUpdateCommentMutation,
  F as useUpdateTaskMutation,
  M as useUsersQuery
};
