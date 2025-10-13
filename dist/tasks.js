import { useQuery as i, useQueryClient as c, useMutation as y } from "@tanstack/vue-query";
import { useSupabase as u } from "./index.js";
const r = {
  all: ["tasks"],
  list: (e) => [...r.all, "list", e],
  detail: (e) => [...r.all, "detail", e],
  comments: (e) => [...r.all, "comments", e],
  history: (e) => [...r.all, "history", e]
};
function w(e) {
  const s = u();
  return i({
    queryKey: r.list(e),
    queryFn: async () => {
      let a = s.schema("hf").from("tasks").select("*").order("created_at", { ascending: !1 });
      e != null && e.status && (a = a.eq("status", e.status)), e != null && e.search && (a = a.or(`summary.ilike.%${e.search}%,description.ilike.%${e.search}%`));
      const { data: t, error: n } = await a;
      if (n) throw n;
      return t;
    }
  });
}
function _(e) {
  const s = u();
  return i({
    queryKey: r.detail(e),
    queryFn: async () => {
      const { data: a, error: t } = await s.schema("hf").from("tasks").select("*").eq("id", e).single();
      if (t) throw t;
      return a;
    }
  });
}
function p(e) {
  const s = u();
  return i({
    queryKey: r.comments(e),
    queryFn: async () => {
      const { data: a, error: t } = await s.schema("hf").from("task_comments").select("*").eq("task_id", e).order("created_at", { ascending: !0 });
      if (t) throw t;
      return a;
    }
  });
}
function g(e) {
  const s = u();
  return i({
    queryKey: r.history(e),
    queryFn: async () => {
      const { data: a, error: t } = await s.schema("hf").from("task_history").select("*").eq("task_id", e).order("changed_at", { ascending: !1 });
      if (t) throw t;
      return a;
    }
  });
}
function Q() {
  const e = u(), s = c();
  return y({
    mutationFn: async (a) => {
      const { data: t, error: n } = await e.schema("hf").from("tasks").insert(a).select().single();
      if (n) throw n;
      return t;
    },
    onSuccess: () => {
      s.invalidateQueries({ queryKey: r.all });
    }
  });
}
function K() {
  const e = u(), s = c();
  return y({
    mutationFn: async ({
      id: a,
      updates: t,
      userId: n
    }) => {
      const { data: m } = await e.schema("hf").from("tasks").select("*").eq("id", a).single(), { data: h, error: l } = await e.schema("hf").from("tasks").update({ ...t, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", a).select().single();
      if (l) throw l;
      if (m) {
        const d = Object.entries(t).filter(([o]) => o !== "updated_at").map(([o, f]) => ({
          task_id: a,
          field_name: o,
          old_value: String(m[o] || ""),
          new_value: String(f || ""),
          changed_by: n
        }));
        d.length > 0 && await e.schema("hf").from("task_history").insert(d);
      }
      return h;
    },
    onSuccess: (a, t) => {
      s.invalidateQueries({ queryKey: r.all }), s.invalidateQueries({ queryKey: r.detail(t.id) }), s.invalidateQueries({ queryKey: r.history(t.id) });
    }
  });
}
function b() {
  const e = u(), s = c();
  return y({
    mutationFn: async (a) => {
      const { error: t } = await e.schema("hf").from("tasks").delete().eq("id", a);
      if (t) throw t;
    },
    onSuccess: () => {
      s.invalidateQueries({ queryKey: r.all });
    }
  });
}
function S() {
  const e = u(), s = c();
  return y({
    mutationFn: async (a) => {
      const { data: t, error: n } = await e.schema("hf").from("task_comments").insert(a).select().single();
      if (n) throw n;
      return t;
    },
    onSuccess: (a, t) => {
      s.invalidateQueries({ queryKey: r.comments(t.task_id) });
    }
  });
}
export {
  r as taskQueryKeys,
  S as useAddCommentMutation,
  Q as useCreateTaskMutation,
  b as useDeleteTaskMutation,
  p as useTaskCommentsQuery,
  g as useTaskHistoryQuery,
  _ as useTaskQuery,
  w as useTasksQuery,
  K as useUpdateTaskMutation
};
