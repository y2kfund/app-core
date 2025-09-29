import { inject as h } from "vue";
import { useQueryClient as f, useQuery as y, QueryClient as g, VueQueryPlugin as _ } from "@tanstack/vue-query";
import { createClient as w } from "@supabase/supabase-js";
const d = Symbol.for("y2kfund.supabase"), b = {
  positions: (e) => ["positions", e],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e]
};
function m() {
  const e = h(d, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function T(e) {
  const n = m(), i = b.positions(e), a = f(), s = y({
    queryKey: i,
    queryFn: async () => {
      var l, p;
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        supabaseUrl: n.supabaseUrl,
        schema: "hf",
        table: "ibkr_positions"
      });
      const [t, o] = await Promise.all([
        n.schema("hf").from("ibkr_positions").select("*").order("symbol"),
        n.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity")
      ]);
      if (t.error)
        throw console.error("❌ Positions query error:", t.error), t.error;
      if (o.error)
        throw console.error("❌ Accounts query error:", o.error), o.error;
      console.log("✅ Positions query success:", {
        positionsCount: (l = t.data) == null ? void 0 : l.length,
        accountsCount: (p = o.data) == null ? void 0 : p.length
      });
      const u = new Map(
        (o.data || []).map((c) => [c.internal_account_id, c.legal_entity])
      );
      return (t.data || []).map((c) => ({
        ...c,
        legal_entity: u.get(c.internal_account_id) || void 0
      }));
    },
    staleTime: 6e4
  }), r = n.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "ibkr_positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => a.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var t;
      return (t = r == null ? void 0 : r.unsubscribe) == null ? void 0 : t.call(r);
    }
  };
}
function P(e) {
  const n = m(), i = b.trades(e), a = f(), s = y({
    queryKey: i,
    queryFn: async () => {
      const { data: t, error: o } = await n.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (o) throw o;
      return t || [];
    },
    staleTime: 6e4
  }), r = n.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => a.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var t;
      return (t = r == null ? void 0 : r.unsubscribe) == null ? void 0 : t.call(r);
    }
  };
}
async function K(e) {
  const {
    supabaseUrl: n,
    supabaseAnon: i,
    supabaseClient: a,
    query: s
  } = e, r = a ?? w(n, i), t = new g({
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
    install(u) {
      u.provide(d, r), u.use(_, { queryClient: t });
    }
  };
}
export {
  d as SUPABASE,
  K as createCore,
  b as queryKeys,
  T as usePositionsQuery,
  m as useSupabase,
  P as useTradesQuery
};
