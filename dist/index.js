import { inject as X } from "vue";
import { useQuery as y, useQueryClient as B, QueryClient as Y, VueQueryPlugin as D } from "@tanstack/vue-query";
import { createClient as I } from "@supabase/supabase-js";
const V = Symbol.for("y2kfund.supabase"), v = {
  positions: (e, r) => ["positions", e, r],
  trades: (e) => ["trades", e],
  cashTransactions: (e) => ["cashTransactions", e],
  transfers: (e) => ["transfers", e],
  nlvMargin: (e, r) => ["nlvMargin", e, r],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function g() {
  const e = X(V, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function ee(e, r) {
  if (!r)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", r);
    const { data: n, error: o } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", r).eq("is_active", !0);
    if (o)
      return console.error("❌ Error fetching user account access:", o), [];
    if (!n || n.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = n.map((c) => c.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (n) {
    return console.error("❌ Exception fetching account access:", n), [];
  }
}
function te(e) {
  if (!e) return null;
  const r = e.match(/^([A-Z]+)\b/);
  return (r == null ? void 0 : r[1]) || null;
}
function ce() {
  const e = g(), r = v.thesis();
  return y({
    queryKey: r,
    queryFn: async () => {
      const { data: o, error: s } = await e.schema("hf").from("thesisMaster").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return o || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function ae() {
  const e = g(), r = v.thesisConnections();
  return y({
    queryKey: r,
    queryFn: async () => {
      const { data: o, error: s } = await e.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (s)
        throw console.error("❌ Thesis connections query error:", s), s;
      return o || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function ie(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.contract_quantity}|${e.asset_class}|${e.conid}`;
}
async function se(e, r) {
  try {
    const { data: n, error: o } = await e.schema("hf").from("position_trade_mappings").select("mapping_key, trade_id").eq("user_id", r);
    if (o)
      return console.error("❌ Error fetching position trade mappings:", o), /* @__PURE__ */ new Map();
    const s = /* @__PURE__ */ new Map();
    return n && n.forEach((c) => {
      s.has(c.mapping_key) || s.set(c.mapping_key, /* @__PURE__ */ new Set()), s.get(c.mapping_key).add(c.trade_id);
    }), s;
  } catch (n) {
    return console.error("❌ Exception fetching position trade mappings:", n), /* @__PURE__ */ new Map();
  }
}
async function le(e, r, n, o) {
  try {
    const { error: s } = await e.schema("hf").from("position_trade_mappings").delete().eq("user_id", r).eq("mapping_key", n);
    if (s)
      throw console.error("❌ Error deleting old mappings:", s), s;
    if (o.size > 0) {
      const c = Array.from(o).map((h) => ({
        user_id: r,
        mapping_key: n,
        trade_id: h,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })), { error: i } = await e.schema("hf").from("position_trade_mappings").upsert(c, {
        onConflict: "user_id,mapping_key,trade_id",
        ignoreDuplicates: !1
        // Update the updated_at if already exists
      });
      if (i)
        throw console.error("❌ Error upserting new mappings:", i), i;
    }
    console.log("✅ Successfully saved position-trade mappings:", {
      userId: r,
      mappingKey: n,
      tradeCount: o.size
    });
  } catch (s) {
    throw console.error("❌ Exception saving position trade mappings:", s), s;
  }
}
function ue(e) {
  const r = g();
  return y({
    queryKey: ["positionTradeMappings", e],
    queryFn: async () => e ? await se(r, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  });
}
function fe(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.qty}|${e.asset_class}|${e.conid}`;
}
function he(e) {
  const r = g();
  return y({
    queryKey: ["symbolComments", e],
    queryFn: async () => {
      const { data: n, error: o } = await r.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", e);
      if (o) throw o;
      return n || [];
    },
    staleTime: 6e4
  });
}
async function de(e, r, n, o) {
  const { error: s } = await e.schema("hf").from("positions_symbol_comments").upsert({
    comment_key: r,
    user_id: n,
    comment: o,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "comment_key,user_id" });
  if (s) throw s;
}
function pe(e, r, n) {
  const o = g(), s = B(), c = () => n && typeof n == "object" && "value" in n ? n.value : n, i = [...v.positions(e, r), c()], h = y({
    queryKey: i,
    queryFn: async () => {
      var x, U, z, N;
      const d = c(), u = await ee(o, r);
      console.log("🔍 Querying positions with asOf:", d);
      let k = u;
      if (k.length === 0) {
        const { data: t, error: a } = await o.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((E) => {
          var _;
          return { data: ((_ = E.data) == null ? void 0 : _.map((A) => A.internal_account_id)) ?? [], error: E.error };
        });
        if (a)
          return console.error("❌ Error fetching all account IDs:", a), [];
        k = Array.from(new Set(t));
      }
      let S;
      if (d) {
        const { data: t, error: a } = await o.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: k,
          as_of_date: d
        });
        if (a)
          throw console.error("❌ Error fetching as-of fetched_at:", a), a;
        S = t || [];
      } else {
        const { data: t, error: a } = await o.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", k).order("fetched_at", { ascending: !1 });
        if (a)
          throw console.error("❌ Error fetching latest fetched_at per account:", a), a;
        S = t || [];
      }
      const Q = /* @__PURE__ */ new Map();
      for (const t of S)
        Q.has(t.internal_account_id) || Q.set(t.internal_account_id, t.fetched_at);
      const Z = Array.from(Q.entries()).map(
        ([t, a]) => o.schema("hf").from("positions").select("*").eq("internal_account_id", t).eq("fetched_at", a)
      ), R = await Promise.all(Z), G = R.flatMap((t) => t.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: r || "none",
        accessibleAccountIds: u.length > 0 ? u : "all"
      });
      const [M, b, q, T, $, H] = await Promise.all([
        R[0],
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesisMaster").select("id, title, description"),
        o.schema("hf").from("positionsAndThesisConnection").select("*"),
        o.schema("hf").rpc("get_latest_market_prices"),
        r ? o.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", r) : { data: [], error: null }
      ]);
      if (M.error)
        throw console.error("❌ Positions query error:", M.error), M.error;
      if (b.error)
        throw console.error("❌ Accounts query error:", b.error), b.error;
      if (q.error)
        throw console.error("❌ Thesis query error:", q.error), q.error;
      if (T.error)
        throw console.error("❌ Thesis connections query error:", T.error), T.error;
      let C = [];
      $.error ? console.error("❌ Market price query error:", $.error) : (C = $.data || [], console.log(`📊 Fetched ${C.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: (x = M.data) == null ? void 0 : x.length,
        accountsCount: (U = b.data) == null ? void 0 : U.length,
        thesisCount: (z = q.data) == null ? void 0 : z.length,
        thesisConnectionsCount: (N = T.data) == null ? void 0 : N.length,
        marketPricesCount: C.length,
        filtered: u.length > 0,
        accessibleAccounts: u.length > 0 ? u : "all"
      });
      const F = new Map(
        (H.data || []).map((t) => [t.internal_account_id, t.alias])
      ), J = new Map(
        (b.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), L = new Map(
        (q.data || []).map((t) => [t.id, { id: t.id, title: t.title, description: t.description }])
      ), K = /* @__PURE__ */ new Map();
      (T.data || []).forEach((t) => {
        const a = L.get(t.thesis_id);
        a && K.set(t.symbol_root, a);
      });
      const p = /* @__PURE__ */ new Map();
      for (const t of C)
        p.has(t.conid) || p.set(t.conid, { price: t.market_price, fetchedAt: t.last_fetched_at });
      console.log(`📊 Processed ${p.size} unique conids with latest prices`);
      const O = G.map((t) => {
        const a = te(t.symbol), E = a ? K.get(a) : null;
        let _ = null, A = null, j = null, P = null;
        if (t.asset_class === "STK" || t.asset_class === "FUND") {
          const l = p.get(t.conid);
          _ = (l == null ? void 0 : l.price) || null, A = (l == null ? void 0 : l.fetchedAt) || null;
        } else if (t.asset_class === "OPT") {
          const l = p.get(t.conid), m = p.get(t.undConid);
          j = (l == null ? void 0 : l.price) || null, P = (m == null ? void 0 : m.price) || null, _ = P, A = (m == null ? void 0 : m.fetchedAt) || null;
        }
        let W = J.get(t.internal_account_id) || void 0;
        return F.has(t.internal_account_id) && (W = F.get(t.internal_account_id)), {
          ...t,
          legal_entity: W,
          thesis: E,
          market_price: _,
          market_price_fetched_at: A,
          option_market_price: j,
          underlying_market_price: P
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", O), O;
    },
    staleTime: 6e4
  }), f = o.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: i })
  ).subscribe(), w = o.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...h,
    _cleanup: () => {
      var d, u;
      (d = f == null ? void 0 : f.unsubscribe) == null || d.call(f), (u = w == null ? void 0 : w.unsubscribe) == null || u.call(w);
    }
  };
}
function _e(e) {
  const r = g(), n = v.trades(e), o = B(), s = y({
    queryKey: n,
    queryFn: async () => {
      const { data: i, error: h } = await r.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (h) throw h;
      return i || [];
    },
    staleTime: 6e4
  }), c = r.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => o.invalidateQueries({ queryKey: n })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var i;
      return (i = c == null ? void 0 : c.unsubscribe) == null ? void 0 : i.call(c);
    }
  };
}
async function me(e) {
  const {
    supabaseUrl: r,
    supabaseAnon: n,
    supabaseClient: o,
    query: s
  } = e, c = o ?? I(r, n), i = new Y({
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
    install(f) {
      f.provide(V, c), f.use(D, { queryClient: i });
    }
  };
}
export {
  V as SUPABASE,
  me as createCore,
  te as extractSymbolRoot,
  se as fetchPositionTradeMappings,
  ee as fetchUserAccessibleAccounts,
  fe as generateCommentKey,
  ie as generatePositionMappingKey,
  v as queryKeys,
  le as savePositionTradeMappings,
  de as upsertSymbolComment,
  ue as usePositionTradeMappingsQuery,
  pe as usePositionsQuery,
  g as useSupabase,
  he as useSymbolCommentsQuery,
  ae as useThesisConnectionsQuery,
  ce as useThesisQuery,
  _e as useTradesQuery
};
