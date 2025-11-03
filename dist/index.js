import { inject as X } from "vue";
import { useQuery as A, useQueryClient as B, QueryClient as Y, VueQueryPlugin as I } from "@tanstack/vue-query";
import { createClient as D } from "@supabase/supabase-js";
const V = Symbol.for("y2kfund.supabase"), Q = {
  positions: (t, o) => ["positions", t, o],
  trades: (t) => ["trades", t],
  cashTransactions: (t) => ["cashTransactions", t],
  transfers: (t) => ["transfers", t],
  nlvMargin: (t, o) => ["nlvMargin", t, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (t) => ["userAccountAccess", t]
};
function T() {
  const t = X(V, null);
  if (!t) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return t;
}
async function ee(t, o) {
  if (!o)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", o);
    const { data: r, error: n } = await t.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", o).eq("is_active", !0);
    if (n)
      return console.error("❌ Error fetching user account access:", n), [];
    if (!r || r.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = r.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (r) {
    return console.error("❌ Exception fetching account access:", r), [];
  }
}
function te(t) {
  if (!t) return null;
  const o = t.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function re() {
  const t = T(), o = Q.thesis();
  return A({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: s } = await t.schema("hf").from("thesisMaster").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function ce() {
  const t = T(), o = Q.thesisConnections();
  return A({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: s } = await t.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (s)
        throw console.error("❌ Thesis connections query error:", s), s;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function ae(t) {
  const o = T();
  return A({
    queryKey: ["symbolComments", t],
    queryFn: async () => {
      const { data: r, error: n } = await o.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", t);
      if (n) throw n;
      return r || [];
    },
    staleTime: 6e4
  });
}
async function ie(t, o, r, n) {
  const { error: s } = await t.schema("hf").from("positions_symbol_comments").upsert({
    symbol_root: o,
    user_id: r,
    comment: n,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "symbol_root,user_id" });
  if (s) throw s;
}
function le(t, o, r) {
  const n = T(), s = B(), a = () => r && typeof r == "object" && "value" in r ? r.value : r, i = [...Q.positions(t, o), a()], p = A({
    queryKey: i,
    queryFn: async () => {
      var $, x, N, j;
      const f = a(), u = await ee(n, o);
      console.log("🔍 Querying positions with asOf:", f);
      let C = u;
      if (C.length === 0) {
        const { data: e, error: c } = await n.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((v) => {
          var _;
          return { data: ((_ = v.data) == null ? void 0 : _.map((q) => q.internal_account_id)) ?? [], error: v.error };
        });
        if (c)
          return console.error("❌ Error fetching all account IDs:", c), [];
        C = Array.from(new Set(e));
      }
      let R;
      if (f) {
        const { data: e, error: c } = await n.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: C,
          as_of_date: f
        });
        if (c)
          throw console.error("❌ Error fetching as-of fetched_at:", c), c;
        R = e || [];
      } else {
        const { data: e, error: c } = await n.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", C).order("fetched_at", { ascending: !1 });
        if (c)
          throw console.error("❌ Error fetching latest fetched_at per account:", c), c;
        R = e || [];
      }
      const S = /* @__PURE__ */ new Map();
      for (const e of R)
        S.has(e.internal_account_id) || S.set(e.internal_account_id, e.fetched_at);
      const Z = Array.from(S.entries()).map(
        ([e, c]) => n.schema("hf").from("positions").select("*").eq("internal_account_id", e).eq("fetched_at", c)
      ), K = await Promise.all(Z), G = K.flatMap((e) => e.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: t,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: u.length > 0 ? u : "all"
      });
      const [k, g, b, w, F, H] = await Promise.all([
        K[0],
        n.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        n.schema("hf").from("thesisMaster").select("id, title, description"),
        n.schema("hf").from("positionsAndThesisConnection").select("*"),
        n.schema("hf").rpc("get_latest_market_prices"),
        o ? n.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (k.error)
        throw console.error("❌ Positions query error:", k.error), k.error;
      if (g.error)
        throw console.error("❌ Accounts query error:", g.error), g.error;
      if (b.error)
        throw console.error("❌ Thesis query error:", b.error), b.error;
      if (w.error)
        throw console.error("❌ Thesis connections query error:", w.error), w.error;
      let M = [];
      F.error ? console.error("❌ Market price query error:", F.error) : (M = F.data || [], console.log(`📊 Fetched ${M.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: ($ = k.data) == null ? void 0 : $.length,
        accountsCount: (x = g.data) == null ? void 0 : x.length,
        thesisCount: (N = b.data) == null ? void 0 : N.length,
        thesisConnectionsCount: (j = w.data) == null ? void 0 : j.length,
        marketPricesCount: M.length,
        filtered: u.length > 0,
        accessibleAccounts: u.length > 0 ? u : "all"
      });
      const P = new Map(
        (H.data || []).map((e) => [e.internal_account_id, e.alias])
      ), J = new Map(
        (g.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), L = new Map(
        (b.data || []).map((e) => [e.id, { id: e.id, title: e.title, description: e.description }])
      ), O = /* @__PURE__ */ new Map();
      (w.data || []).forEach((e) => {
        const c = L.get(e.thesis_id);
        c && O.set(e.symbol_root, c);
      });
      const d = /* @__PURE__ */ new Map();
      for (const e of M)
        d.has(e.conid) || d.set(e.conid, { price: e.market_price, fetchedAt: e.last_fetched_at });
      console.log(`📊 Processed ${d.size} unique conids with latest prices`);
      const U = G.map((e) => {
        const c = te(e.symbol), v = c ? O.get(c) : null;
        let _ = null, q = null, W = null, E = null;
        if (e.asset_class === "STK" || e.asset_class === "FUND") {
          const l = d.get(e.conid);
          _ = (l == null ? void 0 : l.price) || null, q = (l == null ? void 0 : l.fetchedAt) || null;
        } else if (e.asset_class === "OPT") {
          const l = d.get(e.conid), m = d.get(e.undConid);
          W = (l == null ? void 0 : l.price) || null, E = (m == null ? void 0 : m.price) || null, _ = E, q = (m == null ? void 0 : m.fetchedAt) || null;
        }
        let z = J.get(e.internal_account_id) || void 0;
        return P.has(e.internal_account_id) && (z = P.get(e.internal_account_id)), {
          ...e,
          legal_entity: z,
          thesis: v,
          market_price: _,
          market_price_fetched_at: q,
          option_market_price: W,
          underlying_market_price: E
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", U), U;
    },
    staleTime: 6e4
  }), h = n.channel(`positions:${t}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: i })
  ).subscribe(), y = n.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...p,
    _cleanup: () => {
      var f, u;
      (f = h == null ? void 0 : h.unsubscribe) == null || f.call(h), (u = y == null ? void 0 : y.unsubscribe) == null || u.call(y);
    }
  };
}
function ue(t) {
  const o = T(), r = Q.trades(t), n = B(), s = A({
    queryKey: r,
    queryFn: async () => {
      const { data: i, error: p } = await o.schema("hf").from("trades").select("*").eq("account_id", t).order("trade_date", { ascending: !1 });
      if (p) throw p;
      return i || [];
    },
    staleTime: 6e4
  }), a = o.channel(`trades:${t}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${t}`
    },
    () => n.invalidateQueries({ queryKey: r })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var i;
      return (i = a == null ? void 0 : a.unsubscribe) == null ? void 0 : i.call(a);
    }
  };
}
async function he(t) {
  const {
    supabaseUrl: o,
    supabaseAnon: r,
    supabaseClient: n,
    query: s
  } = t, a = n ?? D(o, r), i = new Y({
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
    install(h) {
      h.provide(V, a), h.use(I, { queryClient: i });
    }
  };
}
export {
  V as SUPABASE,
  he as createCore,
  te as extractSymbolRoot,
  ee as fetchUserAccessibleAccounts,
  Q as queryKeys,
  ie as upsertSymbolComment,
  le as usePositionsQuery,
  T as useSupabase,
  ae as useSymbolCommentsQuery,
  ce as useThesisConnectionsQuery,
  re as useThesisQuery,
  ue as useTradesQuery
};
