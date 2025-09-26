import { inject as m } from "vue";
import { useQueryClient as l, useQuery as f, QueryClient as b, VueQueryPlugin as h } from "@tanstack/vue-query";
import { createClient as _ } from "@supabase/supabase-js";
const d = Symbol.for("y2kfund.supabase"), p = {
  positions: (e) => ["positions", e],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e]
};
function y() {
  const e = m(d, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function C(e) {
  const r = y(), o = p.positions(e), a = l(), s = f({
    queryKey: o,
    queryFn: async () => {
      const [n, i] = await Promise.all([
        r.schema("hf").from("positions").select("*").order("symbol"),
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity")
      ]);
      if (n.error) throw n.error;
      if (i.error) throw i.error;
      const u = new Map(
        (i.data || []).map((c) => [c.internal_account_id, c.legal_entity])
      );
      return (n.data || []).map((c) => ({
        ...c,
        legal_entity: u.get(c.internal_account_id) || void 0
      }));
    },
    staleTime: 6e4
  }), t = r.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => a.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var n;
      return (n = t == null ? void 0 : t.unsubscribe) == null ? void 0 : n.call(t);
    }
  };
}
function T(e) {
  const r = y(), o = p.trades(e), a = l(), s = f({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: i } = await r.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (i) throw i;
      return n || [];
    },
    staleTime: 6e4
  }), t = r.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => a.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var n;
      return (n = t == null ? void 0 : t.unsubscribe) == null ? void 0 : n.call(t);
    }
  };
}
async function K(e) {
  const {
    supabaseUrl: r,
    supabaseAnon: o,
    supabaseClient: a,
    query: s
  } = e, t = a ?? _(r, o), n = new b({
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
      u.provide(d, t), u.use(h, { queryClient: n });
    }
  };
}
export {
  d as SUPABASE,
  K as createCore,
  p as queryKeys,
  C as usePositionsQuery,
  y as useSupabase,
  T as useTradesQuery
};
