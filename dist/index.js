import { inject as b } from "vue";
import { useQueryClient as h, useQuery as p, QueryClient as w, VueQueryPlugin as q } from "@tanstack/vue-query";
import { createClient as C } from "@supabase/supabase-js";
const y = Symbol.for("y2kfund.supabase"), m = {
  positions: (e) => ["positions", e],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e]
};
function g() {
  const e = b(y, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function P(e) {
  const r = g(), a = m.positions(e), c = h(), t = p({
    queryKey: a,
    queryFn: async () => {
      var d, f;
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        //supabaseUrl: supabase.supabaseUrl,
        schema: "hf",
        table: "positions"
      });
      const s = await r.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (s.error)
        throw console.error("❌ Max fetched_at query error:", s.error), s.error;
      if (!s.data || s.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const i = s.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", i);
      const [n, u] = await Promise.all([
        r.schema("hf").from("positions").select("*").eq("fetched_at", i).order("symbol"),
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity")
      ]);
      if (n.error)
        throw console.error("❌ Positions query error:", n.error), n.error;
      if (u.error)
        throw console.error("❌ Accounts query error:", u.error), u.error;
      console.log("✅ Positions query success:", {
        latestFetchedAt: i,
        positionsCount: (d = n.data) == null ? void 0 : d.length,
        accountsCount: (f = u.data) == null ? void 0 : f.length
      });
      const _ = new Map(
        (u.data || []).map((l) => [l.internal_account_id, l.legal_entity])
      );
      return (n.data || []).map((l) => ({
        ...l,
        legal_entity: _.get(l.internal_account_id) || void 0
      }));
    },
    staleTime: 6e4
  }), o = r.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => c.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...t,
    _cleanup: () => {
      var s;
      return (s = o == null ? void 0 : o.unsubscribe) == null ? void 0 : s.call(o);
    }
  };
}
function K(e) {
  const r = g(), a = m.trades(e), c = h(), t = p({
    queryKey: a,
    queryFn: async () => {
      const { data: s, error: i } = await r.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (i) throw i;
      return s || [];
    },
    staleTime: 6e4
  }), o = r.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => c.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...t,
    _cleanup: () => {
      var s;
      return (s = o == null ? void 0 : o.unsubscribe) == null ? void 0 : s.call(o);
    }
  };
}
async function O(e) {
  const {
    supabaseUrl: r,
    supabaseAnon: a,
    supabaseClient: c,
    query: t
  } = e, o = c ?? C(r, a), s = new w({
    defaultOptions: {
      queries: {
        staleTime: (t == null ? void 0 : t.staleTime) ?? 6e4,
        gcTime: (t == null ? void 0 : t.gcTime) ?? 864e5,
        refetchOnWindowFocus: (t == null ? void 0 : t.refetchOnWindowFocus) ?? !1,
        refetchOnReconnect: (t == null ? void 0 : t.refetchOnReconnect) ?? !0
      }
    }
  });
  return {
    install(n) {
      n.provide(y, o), n.use(q, { queryClient: s });
    }
  };
}
export {
  y as SUPABASE,
  O as createCore,
  m as queryKeys,
  P as usePositionsQuery,
  g as useSupabase,
  K as useTradesQuery
};
