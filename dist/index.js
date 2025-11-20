import { inject as X } from "vue";
import { useQuery as y, useQueryClient as Z, QueryClient as Y, VueQueryPlugin as I } from "@tanstack/vue-query";
import { createClient as ee } from "@supabase/supabase-js";
const D = Symbol.for("y2kfund.supabase"), Q = {
  positions: (e, n) => ["positions", e, n],
  trades: (e) => ["trades", e],
  orders: (e) => ["orders", e],
  cashTransactions: (e) => ["cashTransactions", e],
  transfers: (e) => ["transfers", e],
  nlvMargin: (e, n) => ["nlvMargin", e, n],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function w() {
  const e = X(D, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function G(e, n) {
  if (!n)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", n);
    const { data: s, error: o } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", n).eq("is_active", !0);
    if (o)
      return console.error("❌ Error fetching user account access:", o), [];
    if (!s || s.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const t = s.map((i) => i.internal_account_id);
    return console.log("✅ User has access to accounts:", t), t;
  } catch (s) {
    return console.error("❌ Exception fetching account access:", s), [];
  }
}
function te(e) {
  if (!e) return null;
  const n = e.match(/^([A-Z]+)\b/);
  return (n == null ? void 0 : n[1]) || null;
}
function ae() {
  const e = w(), n = Q.thesis();
  return y({
    queryKey: n,
    queryFn: async () => {
      const { data: o, error: t } = await e.schema("hf").from("thesisMaster").select("*").order("title");
      if (t)
        throw console.error("❌ Thesis query error:", t), t;
      return o || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function ce() {
  const e = w(), n = Q.thesisConnections();
  return y({
    queryKey: n,
    queryFn: async () => {
      const { data: o, error: t } = await e.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (t)
        throw console.error("❌ Thesis connections query error:", t), t;
      return o || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function le(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.contract_quantity}|${e.asset_class}|${e.conid}`;
}
async function ne(e, n) {
  try {
    const { data: s, error: o } = await e.schema("hf").from("position_position_mappings").select("mapping_key, attached_position_key").eq("user_id", n);
    if (o)
      return console.error("❌ Error fetching position-position mappings:", o), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return s && s.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.attached_position_key);
    }), t;
  } catch (s) {
    return console.error("❌ Exception fetching position-position mappings:", s), /* @__PURE__ */ new Map();
  }
}
async function ue(e, n, s, o) {
  try {
    const { error: t } = await e.schema("hf").from("position_position_mappings").delete().eq("user_id", n).eq("mapping_key", s);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (o.size > 0) {
      const i = Array.from(o).map((u) => ({
        user_id: n,
        mapping_key: s,
        attached_position_key: u,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })), { error: a } = await e.schema("hf").from("position_position_mappings").upsert(i, {
        onConflict: "user_id,mapping_key,attached_position_key",
        ignoreDuplicates: !1
      });
      if (a)
        throw console.error("❌ Error upserting new mappings:", a), a;
    }
    console.log("✅ Successfully saved position-position mappings:", {
      userId: n,
      mappingKey: s,
      positionCount: o.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position-position mappings:", t), t;
  }
}
function pe(e) {
  const n = w();
  return y({
    queryKey: ["positionPositionMappings", e],
    queryFn: async () => e ? await ne(n, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
  });
}
async function oe(e, n) {
  try {
    const { data: s, error: o } = await e.schema("hf").from("position_trade_mappings").select("mapping_key, trade_id").eq("user_id", n);
    if (o)
      return console.error("❌ Error fetching position trade mappings:", o), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return s && s.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.trade_id);
    }), t;
  } catch (s) {
    return console.error("❌ Exception fetching position trade mappings:", s), /* @__PURE__ */ new Map();
  }
}
async function he(e, n, s, o) {
  try {
    const { error: t } = await e.schema("hf").from("position_trade_mappings").delete().eq("user_id", n).eq("mapping_key", s);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (o.size > 0) {
      const i = Array.from(o).map((u) => ({
        user_id: n,
        mapping_key: s,
        trade_id: u,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })), { error: a } = await e.schema("hf").from("position_trade_mappings").upsert(i, {
        onConflict: "user_id,mapping_key,trade_id",
        ignoreDuplicates: !1
        // Update the updated_at if already exists
      });
      if (a)
        throw console.error("❌ Error upserting new mappings:", a), a;
    }
    console.log("✅ Successfully saved position-trade mappings:", {
      userId: n,
      mappingKey: s,
      tradeCount: o.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position trade mappings:", t), t;
  }
}
function fe(e) {
  const n = w();
  return y({
    queryKey: ["positionTradeMappings", e],
    queryFn: async () => e ? await oe(n, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  });
}
function _e(e) {
  const n = e.contract_quantity ?? e.qty;
  return `${e.internal_account_id}|${e.symbol}|${n}|${e.asset_class}|${e.conid}`;
}
function de(e) {
  const n = w();
  return y({
    queryKey: ["symbolComments", e],
    queryFn: async () => {
      const { data: s, error: o } = await n.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", e);
      if (o) throw o;
      return s || [];
    },
    staleTime: 6e4
  });
}
async function me(e, n, s, o) {
  const { error: t } = await e.schema("hf").from("positions_symbol_comments").upsert({
    comment_key: n,
    user_id: s,
    comment: o,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "comment_key,user_id" });
  if (t) throw t;
}
function ge(e, n, s) {
  const o = w(), t = Z(), i = () => s && typeof s == "object" && "value" in s ? s.value : s, a = [...Q.positions(e, n), i()], u = y({
    queryKey: a,
    queryFn: async () => {
      var U, N, j, B;
      const d = i(), h = await G(o, n);
      console.log("🔍 Querying positions with asOf:", d);
      let m = h;
      if (m.length === 0) {
        const { data: r, error: l } = await o.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((F) => {
          var k;
          return { data: ((k = F.data) == null ? void 0 : k.map((P) => P.internal_account_id)) ?? [], error: F.error };
        });
        if (l)
          return console.error("❌ Error fetching all account IDs:", l), [];
        m = Array.from(new Set(r));
      }
      let T;
      if (d) {
        const { data: r, error: l } = await o.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: m,
          as_of_date: d
        });
        if (l)
          throw console.error("❌ Error fetching as-of fetched_at:", l), l;
        T = r || [];
      } else {
        const { data: r, error: l } = await o.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", m).order("fetched_at", { ascending: !1 });
        if (l)
          throw console.error("❌ Error fetching latest fetched_at per account:", l), l;
        T = r || [];
      }
      const b = /* @__PURE__ */ new Map();
      for (const r of T)
        b.has(r.internal_account_id) || b.set(r.internal_account_id, r.fetched_at);
      const c = Array.from(b.entries()).map(
        ([r, l]) => o.schema("hf").from("positions").select("*").eq("internal_account_id", r).eq("fetched_at", l)
      ), g = await Promise.all(c), v = g.flatMap((r) => r.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: n || "none",
        accessibleAccountIds: h.length > 0 ? h : "all"
      });
      const [$, E, A, C, R, H] = await Promise.all([
        g[0],
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesisMaster").select("id, title, description"),
        o.schema("hf").from("positionsAndThesisConnection").select("*"),
        o.schema("hf").rpc("get_latest_market_prices"),
        n ? o.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
      ]);
      if ($.error)
        throw console.error("❌ Positions query error:", $.error), $.error;
      if (E.error)
        throw console.error("❌ Accounts query error:", E.error), E.error;
      if (A.error)
        throw console.error("❌ Thesis query error:", A.error), A.error;
      if (C.error)
        throw console.error("❌ Thesis connections query error:", C.error), C.error;
      let S = [];
      R.error ? console.error("❌ Market price query error:", R.error) : (S = R.data || [], console.log(`📊 Fetched ${S.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: (U = $.data) == null ? void 0 : U.length,
        accountsCount: (N = E.data) == null ? void 0 : N.length,
        thesisCount: (j = A.data) == null ? void 0 : j.length,
        thesisConnectionsCount: (B = C.data) == null ? void 0 : B.length,
        marketPricesCount: S.length,
        filtered: h.length > 0,
        accessibleAccounts: h.length > 0 ? h : "all"
      });
      const x = new Map(
        (H.data || []).map((r) => [r.internal_account_id, r.alias])
      ), J = new Map(
        (E.data || []).map((r) => [r.internal_account_id, r.legal_entity])
      ), L = new Map(
        (A.data || []).map((r) => [r.id, { id: r.id, title: r.title, description: r.description }])
      ), O = /* @__PURE__ */ new Map();
      (C.data || []).forEach((r) => {
        const l = L.get(r.thesis_id);
        l && O.set(r.symbol_root, l);
      });
      const q = /* @__PURE__ */ new Map();
      for (const r of S)
        q.has(r.conid) || q.set(r.conid, { price: r.market_price, fetchedAt: r.last_fetched_at });
      console.log(`📊 Processed ${q.size} unique conids with latest prices`);
      const z = v.map((r) => {
        const l = te(r.symbol), F = l ? O.get(l) : null;
        let k = null, P = null, W = null, K = null;
        if (r.asset_class === "STK" || r.asset_class === "FUND") {
          const f = q.get(r.conid);
          k = (f == null ? void 0 : f.price) || null, P = (f == null ? void 0 : f.fetchedAt) || null;
        } else if (r.asset_class === "OPT") {
          const f = q.get(r.conid), M = q.get(r.undConid);
          W = (f == null ? void 0 : f.price) || null, K = (M == null ? void 0 : M.price) || null, k = K, P = (M == null ? void 0 : M.fetchedAt) || null;
        }
        let V = J.get(r.internal_account_id) || void 0;
        return x.has(r.internal_account_id) && (V = x.get(r.internal_account_id)), {
          ...r,
          legal_entity: V,
          thesis: F,
          market_price: k,
          market_price_fetched_at: P,
          option_market_price: W,
          underlying_market_price: K
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", z), z;
    },
    staleTime: 6e4
  }), p = o.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => t.invalidateQueries({ queryKey: a })
  ).subscribe(), _ = o.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => t.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...u,
    _cleanup: () => {
      var d, h;
      (d = p == null ? void 0 : p.unsubscribe) == null || d.call(p), (h = _ == null ? void 0 : _.unsubscribe) == null || h.call(_);
    }
  };
}
async function ye(e, n, s, o) {
  try {
    console.log("🔍 Fetching positions for symbol root:", n, "account:", o);
    const t = await G(e, s);
    let i = e.schema("hf").from("positions").select("*").ilike("symbol", `${n}%`);
    o && (i = i.eq("internal_account_id", o)), t.length > 0 && (i = i.in("internal_account_id", t)), i = i.order("fetched_at", { ascending: !1 });
    const { data: a, error: u } = await i;
    if (u)
      throw console.error("❌ Error fetching positions by symbol root:", u), u;
    console.log("📊 Fetched positions count:", (a == null ? void 0 : a.length) || 0);
    const p = /* @__PURE__ */ new Map(), _ = (a || []).filter((c) => {
      const g = c.contract_quantity ?? c.qty, v = `${c.internal_account_id}|${c.symbol}|${g}|${c.asset_class}|${c.conid}`;
      return p.has(v) ? !1 : (p.set(v, c), !0);
    });
    console.log(
      "📊 Deduplicated positions count:",
      _.length,
      `(removed ${((a == null ? void 0 : a.length) || 0) - _.length} duplicates)`
    );
    const [d, h] = await Promise.all([
      e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
      s ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", s) : { data: [], error: null }
    ]), m = new Map(
      (h.data || []).map((c) => [c.internal_account_id, c.alias])
    ), T = new Map(
      (d.data || []).map((c) => [c.internal_account_id, c.legal_entity])
    ), b = _.map((c) => {
      let g = T.get(c.internal_account_id) || void 0;
      return m.has(c.internal_account_id) && (g = m.get(c.internal_account_id)), {
        ...c,
        legal_entity: g,
        thesis: null,
        market_price: null,
        market_price_fetched_at: null,
        option_market_price: null,
        underlying_market_price: null
      };
    });
    return console.log("✅ Fetched and enriched positions by symbol root:", {
      symbolRoot: n,
      account: o,
      total: (a == null ? void 0 : a.length) || 0,
      unique: b.length,
      filtered: t.length > 0
    }), b;
  } catch (t) {
    return console.error("❌ Exception fetching positions by symbol root:", t), [];
  }
}
function we(e) {
  const n = w(), s = Q.trades(e), o = Z(), t = y({
    queryKey: s,
    queryFn: async () => {
      const { data: a, error: u } = await n.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (u) throw u;
      return a || [];
    },
    staleTime: 6e4
  }), i = n.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => o.invalidateQueries({ queryKey: s })
  ).subscribe();
  return {
    ...t,
    _cleanup: () => {
      var a;
      return (a = i == null ? void 0 : i.unsubscribe) == null ? void 0 : a.call(i);
    }
  };
}
async function be(e) {
  const {
    supabaseUrl: n,
    supabaseAnon: s,
    supabaseClient: o,
    query: t
  } = e, i = o ?? ee(n, s), a = new Y({
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
    install(p) {
      p.provide(D, i), p.use(I, { queryClient: a });
    }
  };
}
export {
  D as SUPABASE,
  be as createCore,
  te as extractSymbolRoot,
  ne as fetchPositionPositionMappings,
  oe as fetchPositionTradeMappings,
  ye as fetchPositionsBySymbolRoot,
  G as fetchUserAccessibleAccounts,
  _e as generateCommentKey,
  le as generatePositionMappingKey,
  Q as queryKeys,
  ue as savePositionPositionMappings,
  he as savePositionTradeMappings,
  me as upsertSymbolComment,
  pe as usePositionPositionMappingsQuery,
  fe as usePositionTradeMappingsQuery,
  ge as usePositionsQuery,
  w as useSupabase,
  de as useSymbolCommentsQuery,
  ce as useThesisConnectionsQuery,
  ae as useThesisQuery,
  we as useTradesQuery
};
