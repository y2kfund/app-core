import { useQueryClient as m, useMutation as l, useQuery as y } from "@tanstack/vue-query";
import { useSupabase as o } from "./index.js";
import { unref as d, computed as w } from "vue";
const r = {
  all: ["tasks"],
  list: (t) => [...r.all, "list", t],
  detail: (t) => [...r.all, "detail", t],
  comments: (t) => [...r.all, "comments", t],
  history: (t) => [...r.all, "history", t]
};
function b(t) {
  const a = o();
  return y({
    queryKey: w(() => {
      const e = t ? d(t) : {};
      return r.list(e);
    }),
    queryFn: async () => {
      const e = t ? d(t) : {};
      let s = a.schema("hf").from("tasks").select("*").order("created_at", { ascending: !1 });
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
  const a = o();
  return y({
    queryKey: r.detail(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("hf").from("tasks").select("*").eq("id", t).single();
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function g(t) {
  const a = o();
  return y({
    queryKey: r.comments(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("hf").from("task_comments").select("*").eq("task_id", t).order("created_at", { ascending: !1 });
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function K(t) {
  const a = o();
  return y({
    queryKey: r.history(t),
    queryFn: async () => {
      const { data: e, error: s } = await a.schema("hf").from("task_history").select("*").eq("task_id", t).order("changed_at", { ascending: !1 });
      if (s) throw s;
      return e;
    },
    enabled: !!t
  });
}
function v() {
  const t = o(), a = m();
  return l({
    mutationFn: async (e) => {
      const { data: s, error: n } = await t.schema("hf").from("tasks").insert(e).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: () => {
      a.invalidateQueries({ queryKey: r.all });
    }
  });
}
function F() {
  const t = o(), a = m();
  return l({
    mutationFn: async ({
      id: e,
      updates: s,
      userId: n
    }) => {
      const { data: u, error: c } = await t.schema("hf").from("tasks").select("*").eq("id", e).single();
      if (c) throw c;
      const { data: q, error: f } = await t.schema("hf").from("tasks").update(s).eq("id", e).select().single();
      if (f) throw f;
      const h = Object.keys(s).filter((i) => u[i] !== s[i]).map((i) => ({
        task_id: e,
        field_name: i,
        old_value: String(u[i] || ""),
        new_value: String(s[i] || ""),
        changed_by: n
      }));
      if (h.length > 0) {
        const { error: i } = await t.schema("hf").from("task_history").insert(h);
        i && console.error("Failed to save history:", i);
      }
      return q;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.all }), a.invalidateQueries({ queryKey: r.detail(e.id) }), a.invalidateQueries({ queryKey: r.history(e.id) });
    }
  });
}
function C() {
  const t = o(), a = m();
  return l({
    mutationFn: async (e) => {
      const { data: s, error: n } = await t.schema("hf").from("task_comments").insert(e).select().single();
      if (n) throw n;
      return s;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.comments(e.task_id) });
    }
  });
}
function T() {
  const t = o(), a = m();
  return l({
    mutationFn: async (e) => {
      await t.schema("hf").from("task_comments").delete().eq("task_id", e), await t.schema("hf").from("task_history").delete().eq("task_id", e);
      const { error: s } = await t.schema("hf").from("tasks").delete().eq("id", e);
      if (s) throw s;
      return e;
    },
    onSuccess: () => {
      a.invalidateQueries({ queryKey: r.all });
    }
  });
}
function S() {
  const t = o(), a = m();
  return l({
    mutationFn: async ({ id: e, comment: s }) => {
      const { data: n, error: u } = await t.schema("hf").from("task_comments").update({ comment: s }).eq("id", e).select().single();
      if (u) throw u;
      return n;
    },
    onSuccess: (e) => {
      a.invalidateQueries({ queryKey: r.comments(e.task_id) });
    }
  });
}
function M() {
  const t = o();
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
