import { inject as T } from "vue";
import { useQuery as h, useQueryClient as _, QueryClient as C, VueQueryPlugin as Q } from "@tanstack/vue-query";
import { createClient as v } from "@supabase/supabase-js";
const b = Symbol.for("y2kfund.supabase"), f = {
  positions: (e) => ["positions", e],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e],
  thesis: () => ["thesis"]
};
function y() {
  const e = T(b, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function R() {
  const e = y(), o = f.thesis();
  return h({
    queryKey: o,
    queryFn: async () => {
      const { data: c, error: s } = await e.schema("hf").from("thesis").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return c || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function k(e) {
  const o = y(), i = f.positions(e), c = _(), s = h({
    queryKey: i,
    queryFn: async () => {
      var p, m, g;
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions"
      });
      const t = await o.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (t.error)
        throw console.error("❌ Max fetched_at query error:", t.error), t.error;
      if (!t.data || t.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const u = t.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u);
      const [a, l, d] = await Promise.all([
        o.schema("hf").from("positions").select("*").eq("fetched_at", u).order("symbol"),
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesis").select("id, title, description")
      ]);
      if (a.error)
        throw console.error("❌ Positions query error:", a.error), a.error;
      if (l.error)
        throw console.error("❌ Accounts query error:", l.error), l.error;
      if (d.error)
        throw console.error("❌ Thesis query error:", d.error), d.error;
      console.log("✅ Positions query success:", {
        latestFetchedAt: u,
        positionsCount: (p = a.data) == null ? void 0 : p.length,
        accountsCount: (m = l.data) == null ? void 0 : m.length,
        thesisCount: (g = d.data) == null ? void 0 : g.length
      });
      const w = new Map(
        (l.data || []).map((n) => [n.internal_account_id, n.legal_entity])
      ), q = new Map(
        (d.data || []).map((n) => [n.id, { id: n.id, title: n.title, description: n.description }])
      );
      return (a.data || []).map((n) => ({
        ...n,
        legal_entity: w.get(n.internal_account_id) || void 0,
        thesis: n.thesis_id ? q.get(n.thesis_id) : null
      }));
    },
    staleTime: 6e4
  }), r = o.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => c.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var t;
      return (t = r == null ? void 0 : r.unsubscribe) == null ? void 0 : t.call(r);
    }
  };
}
function O(e) {
  const o = y(), i = f.trades(e), c = _(), s = h({
    queryKey: i,
    queryFn: async () => {
      const { data: t, error: u } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (u) throw u;
      return t || [];
    },
    staleTime: 6e4
  }), r = o.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => c.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var t;
      return (t = r == null ? void 0 : r.unsubscribe) == null ? void 0 : t.call(r);
    }
  };
}
async function S(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: i,
    supabaseClient: c,
    query: s
  } = e, r = c ?? v(o, i), t = new C({
    defaultOptions: {
      queries: {
        staleTime: (s == null ? void 0 : s.staleTime) ?? 6e4,
        gcTime: (s == null ? void 0 : s.gcTime) ?? 864e5,
        refetchOnWindowFocus: (s == null ? void 0 : s.refetchOnWindowFocus) ?? !1,
        refetchOnReconnect: (s == null ? void 0 : s.refetchOnReconnect) ?? !0
      }
    }
  });
  return {
    install(a) {
      a.provide(b, r), a.use(Q, { queryClient: t });
    }
  };
}
export {
  b as SUPABASE,
  S as createCore,
  f as queryKeys,
  k as usePositionsQuery,
  y as useSupabase,
  R as useThesisQuery,
  O as useTradesQuery
};
