import { inject as b } from "vue";
import { useQueryClient as c, useQuery as l, QueryClient as d, VueQueryPlugin as m } from "@tanstack/vue-query";
import { createClient as h } from "@supabase/supabase-js";
const f = Symbol("supabase"), p = {
  positions: (e) => ["positions", e],
  trades: (e) => ["trades", e]
};
function y() {
  const e = b(f, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function w(e) {
  const r = y(), o = p.positions(e), a = c(), s = l({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: i } = await r.schema("hf").from("positions").select("*").eq("internal_account_id", e).order("symbol");
      if (i) throw i;
      return n || [];
    },
    staleTime: 6e4
  }), t = r.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*",
      filter: `internal_account_id=eq.${e}`
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
function Q(e) {
  const r = y(), o = p.trades(e), a = c(), s = l({
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
async function C(e) {
  const {
    supabaseUrl: r,
    supabaseAnon: o,
    supabaseClient: a,
    query: s
  } = e, t = a ?? h(r, o), n = new d({
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
      u.provide(f, t), u.use(m, { queryClient: n });
    }
  };
}
export {
  f as SUPABASE,
  C as createCore,
  p as queryKeys,
  w as usePositionsQuery,
  y as useSupabase,
  Q as useTradesQuery
};
