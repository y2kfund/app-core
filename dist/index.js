import { inject as L } from "vue";
import { useQuery as q, useQueryClient as U, QueryClient as V, VueQueryPlugin as Z } from "@tanstack/vue-query";
import { createClient as G } from "@supabase/supabase-js";
const $ = Symbol.for("y2kfund.supabase"), A = {
  positions: (e, o) => ["positions", e, o],
  trades: (e) => ["trades", e],
  nlvMargin: (e, o) => ["nlvMargin", e, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function T() {
  const e = L($, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function H(e, o) {
  if (!o)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", o);
    const { data: r, error: n } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", o).eq("is_active", !0);
    if (n)
      return console.error("❌ Error fetching user account access:", n), [];
    if (!r || r.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const t = r.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", t), t;
  } catch (r) {
    return console.error("❌ Exception fetching account access:", r), [];
  }
}
function J(e) {
  if (!e) return null;
  const o = e.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function ee() {
  const e = T(), o = A.thesis();
  return q({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: t } = await e.schema("hf").from("thesisMaster").select("*").order("title");
      if (t)
        throw console.error("❌ Thesis query error:", t), t;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function se() {
  const e = T(), o = A.thesisConnections();
  return q({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: t } = await e.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (t)
        throw console.error("❌ Thesis connections query error:", t), t;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function te(e, o) {
  const r = T(), n = A.positions(e, o), t = U(), a = q({
    queryKey: n,
    queryFn: async () => {
      var P, S, E, O;
      const c = await H(r, o);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: c.length > 0 ? c : "all"
      });
      const h = await r.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (h.error)
        throw console.error("❌ Max fetched_at query error:", h.error), h.error;
      if (!h.data || h.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const k = h.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", k);
      let p = r.schema("hf").from("positions").select("*").eq("fetched_at", k);
      c.length > 0 ? (console.log("🔒 Applying access filter for accounts:", c), p = p.in("internal_account_id", c)) : console.log("🔓 No access filter applied - showing all positions"), p = p.order("symbol");
      const [m, _, y, g, C, W] = await Promise.all([
        p,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        r.schema("hf").from("thesisMaster").select("id, title, description"),
        r.schema("hf").from("positionsAndThesisConnection").select("*"),
        r.schema("hf").rpc("get_latest_market_prices"),
        o ? r.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (m.error)
        throw console.error("❌ Positions query error:", m.error), m.error;
      if (_.error)
        throw console.error("❌ Accounts query error:", _.error), _.error;
      if (y.error)
        throw console.error("❌ Thesis query error:", y.error), y.error;
      if (g.error)
        throw console.error("❌ Thesis connections query error:", g.error), g.error;
      let w = [];
      C.error ? console.error("❌ Market price query error:", C.error) : (w = C.data || [], console.log(`📊 Fetched ${w.length} market price records`)), console.log("✅ Positions query success:", {
        latestFetchedAt: k,
        positionsCount: (P = m.data) == null ? void 0 : P.length,
        accountsCount: (S = _.data) == null ? void 0 : S.length,
        thesisCount: (E = y.data) == null ? void 0 : E.length,
        thesisConnectionsCount: (O = g.data) == null ? void 0 : O.length,
        marketPricesCount: w.length,
        filtered: c.length > 0,
        accessibleAccounts: c.length > 0 ? c : "all"
      });
      const v = new Map(
        (W.data || []).map((s) => [s.internal_account_id, s.alias])
      ), j = new Map(
        (_.data || []).map((s) => [s.internal_account_id, s.legal_entity])
      ), z = new Map(
        (y.data || []).map((s) => [s.id, { id: s.id, title: s.title, description: s.description }])
      ), F = /* @__PURE__ */ new Map();
      (g.data || []).forEach((s) => {
        const b = z.get(s.thesis_id);
        b && F.set(s.symbol_root, b);
      });
      const d = /* @__PURE__ */ new Map();
      for (const s of w)
        d.has(s.conid) || d.set(s.conid, { price: s.market_price, fetchedAt: s.last_fetched_at });
      console.log(`📊 Processed ${d.size} unique conids with latest prices`);
      const K = (m.data || []).map((s) => {
        const b = J(s.symbol), B = b ? F.get(b) : null;
        let M = null, R = null, x = null, Q = null;
        if (s.asset_class === "STK" || s.asset_class === "FUND") {
          const l = d.get(s.conid);
          M = (l == null ? void 0 : l.price) || null, R = (l == null ? void 0 : l.fetchedAt) || null;
        } else if (s.asset_class === "OPT") {
          const l = d.get(s.conid), f = d.get(s.undConid);
          x = (l == null ? void 0 : l.price) || null, Q = (f == null ? void 0 : f.price) || null, M = Q, R = (f == null ? void 0 : f.fetchedAt) || null;
        }
        let N = j.get(s.internal_account_id) || void 0;
        return v.has(s.internal_account_id) && (N = v.get(s.internal_account_id)), {
          ...s,
          legal_entity: N,
          thesis: B,
          market_price: M,
          market_price_fetched_at: R,
          option_market_price: x,
          underlying_market_price: Q
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", K), K;
    },
    staleTime: 6e4
  }), i = r.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => t.invalidateQueries({ queryKey: n })
  ).subscribe(), u = r.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => t.invalidateQueries({ queryKey: n })
  ).subscribe();
  return {
    ...a,
    _cleanup: () => {
      var c, h;
      (c = i == null ? void 0 : i.unsubscribe) == null || c.call(i), (h = u == null ? void 0 : u.unsubscribe) == null || h.call(u);
    }
  };
}
function oe(e) {
  const o = T(), r = A.trades(e), n = U(), t = q({
    queryKey: r,
    queryFn: async () => {
      const { data: i, error: u } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (u) throw u;
      return i || [];
    },
    staleTime: 6e4
  }), a = o.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => n.invalidateQueries({ queryKey: r })
  ).subscribe();
  return {
    ...t,
    _cleanup: () => {
      var i;
      return (i = a == null ? void 0 : a.unsubscribe) == null ? void 0 : i.call(a);
    }
  };
}
async function re(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: r,
    supabaseClient: n,
    query: t
  } = e, a = n ?? G(o, r), i = new V({
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
    install(c) {
      c.provide($, a), c.use(Z, { queryClient: i });
    }
  };
}
export {
  $ as SUPABASE,
  re as createCore,
  J as extractSymbolRoot,
  H as fetchUserAccessibleAccounts,
  A as queryKeys,
  te as usePositionsQuery,
  T as useSupabase,
  se as useThesisConnectionsQuery,
  ee as useThesisQuery,
  oe as useTradesQuery
};
