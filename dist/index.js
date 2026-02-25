import { inject as X } from "vue";
import { useQuery as y, useQueryClient as V, QueryClient as Y, VueQueryPlugin as I } from "@tanstack/vue-query";
import { createClient as ee } from "@supabase/supabase-js";
const Z = Symbol.for("y2kfund.supabase"), Q = {
  positions: (e, n) => ["positions", e, n],
  trades: (e) => ["trades", e],
  orders: (e) => ["orders", e],
  cashTransactions: (e) => ["cashTransactions", e],
  transfers: (e) => ["transfers", e],
  nlvMargin: (e, n) => ["nlvMargin", e, n],
  settledCash: (e, n) => ["settledCash", e, n],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function w() {
  const e = X(Z, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function G(e, n) {
  if (!n)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", n);
    const { data: r, error: o } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", n).eq("is_active", !0);
    if (o)
      return console.error("❌ Error fetching user account access:", o), [];
    if (!r || r.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const t = r.map((i) => i.internal_account_id);
    return console.log("✅ User has access to accounts:", t), t;
  } catch (r) {
    return console.error("❌ Exception fetching account access:", r), [];
  }
}
function te(e) {
  if (!e) return null;
  const n = e.match(/^([A-Z]+)\b/);
  return (n == null ? void 0 : n[1]) || null;
}
function ce() {
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
function le() {
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
function ue(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.contract_quantity}|${e.asset_class}|${e.conid}`;
}
async function ne(e, n) {
  try {
    const { data: r, error: o } = await e.schema("hf").from("position_position_mappings").select("mapping_key, attached_position_key").eq("user_id", n);
    if (o)
      return console.error("❌ Error fetching position-position mappings:", o), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return r && r.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.attached_position_key);
    }), t;
  } catch (r) {
    return console.error("❌ Exception fetching position-position mappings:", r), /* @__PURE__ */ new Map();
  }
}
async function pe(e, n, r, o) {
  try {
    const { error: t } = await e.schema("hf").from("position_position_mappings").delete().eq("user_id", n).eq("mapping_key", r);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (o.size > 0) {
      const i = Array.from(o).map((u) => ({
        user_id: n,
        mapping_key: r,
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
      mappingKey: r,
      positionCount: o.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position-position mappings:", t), t;
  }
}
function de(e) {
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
    const { data: r, error: o } = await e.schema("hf").from("position_trade_mappings").select("mapping_key, trade_id").eq("user_id", n);
    if (o)
      return console.error("❌ Error fetching position trade mappings:", o), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return r && r.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.trade_id);
    }), t;
  } catch (r) {
    return console.error("❌ Exception fetching position trade mappings:", r), /* @__PURE__ */ new Map();
  }
}
async function fe(e, n, r, o) {
  try {
    const { error: t } = await e.schema("hf").from("position_trade_mappings").delete().eq("user_id", n).eq("mapping_key", r);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (o.size > 0) {
      const i = Array.from(o).map((u) => ({
        user_id: n,
        mapping_key: r,
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
      mappingKey: r,
      tradeCount: o.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position trade mappings:", t), t;
  }
}
function he(e) {
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
function me(e) {
  const n = w();
  return y({
    queryKey: ["symbolComments", e],
    queryFn: async () => {
      const { data: r, error: o } = await n.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", e);
      if (o) throw o;
      return r || [];
    },
    staleTime: 6e4
  });
}
async function ge(e, n, r, o) {
  const { error: t } = await e.schema("hf").from("positions_symbol_comments").upsert({
    comment_key: n,
    user_id: r,
    comment: o,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "comment_key,user_id" });
  if (t) throw t;
}
async function re(e, n) {
  try {
    const { data: r, error: o } = await e.schema("hf").from("position_order_mappings").select("mapping_key, order_id").eq("user_id", n);
    if (o)
      return console.error("❌ Error fetching position-order mappings:", o), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return r && r.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.order_id);
    }), t;
  } catch (r) {
    return console.error("❌ Exception fetching position-order mappings:", r), /* @__PURE__ */ new Map();
  }
}
async function ye(e, n, r, o) {
  try {
    const { error: t } = await e.schema("hf").from("position_order_mappings").delete().eq("user_id", n).eq("mapping_key", r);
    if (t)
      throw console.error("❌ Error deleting old order mappings:", t), t;
    if (o.size > 0) {
      const i = Array.from(o).map((u) => ({
        user_id: n,
        mapping_key: r,
        order_id: u,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      })), { error: a } = await e.schema("hf").from("position_order_mappings").upsert(i, {
        onConflict: "user_id,mapping_key,order_id",
        ignoreDuplicates: !1
      });
      if (a)
        throw console.error("❌ Error upserting new order mappings:", a), a;
    }
    console.log("✅ Successfully saved position-order mappings:", {
      userId: n,
      mappingKey: r,
      orderCount: o.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position-order mappings:", t), t;
  }
}
function we(e) {
  const n = w();
  return y({
    queryKey: ["positionOrderMappings", e],
    queryFn: async () => e ? await re(n, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
  });
}
function qe(e, n, r) {
  const o = w(), t = V(), i = () => r && typeof r == "object" && "value" in r ? r.value : r, a = [...Q.positions(e, n), i()], u = y({
    queryKey: a,
    queryFn: async () => {
      var U, N, j, B;
      const m = i(), f = await G(o, n);
      console.log("🔍 Querying positions with asOf:", m);
      let p = f;
      if (p.length === 0) {
        const { data: s, error: c } = await o.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((b) => {
          var g;
          return { data: ((g = b.data) == null ? void 0 : g.map((P) => P.internal_account_id)) ?? [], error: b.error };
        });
        if (c)
          return console.error("❌ Error fetching all account IDs:", c), [];
        p = Array.from(new Set(s));
      }
      if (p.length > 0) {
        const { data: s, error: c } = await o.schema("hf").from("user_accounts_master").select("internal_account_id").in("internal_account_id", p).eq("archived", !1);
        if (c)
          console.error("❌ Error filtering archived accounts:", c);
        else if (s) {
          const b = p.length;
          p = s.map((g) => g.internal_account_id), b !== p.length && console.log(`🗃️ Filtered out ${b - p.length} archived account(s)`);
        }
      }
      let T;
      if (m) {
        const { data: s, error: c } = await o.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: p,
          as_of_date: m
        });
        if (c)
          throw console.error("❌ Error fetching as-of fetched_at:", c), c;
        T = s || [];
      } else {
        const { data: s, error: c } = await o.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", p).order("fetched_at", { ascending: !1 });
        if (c)
          throw console.error("❌ Error fetching latest fetched_at per account:", c), c;
        T = s || [];
      }
      const k = /* @__PURE__ */ new Map();
      for (const s of T)
        k.has(s.internal_account_id) || k.set(s.internal_account_id, s.fetched_at);
      const l = Array.from(k.entries()).map(
        ([s, c]) => o.schema("hf").from("positions").select("*").eq("internal_account_id", s).eq("fetched_at", c)
      ), q = await Promise.all(l), S = q.flatMap((s) => s.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: n || "none",
        accessibleAccountIds: f.length > 0 ? f : "all"
      });
      const [$, v, A, C, O, H] = await Promise.all([
        q[0],
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesisMaster").select("id, title, description"),
        o.schema("hf").from("positionsAndThesisConnection").select("*"),
        o.schema("hf").rpc("get_latest_market_prices"),
        n ? o.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
      ]);
      if ($.error)
        throw console.error("❌ Positions query error:", $.error), $.error;
      if (v.error)
        throw console.error("❌ Accounts query error:", v.error), v.error;
      if (A.error)
        throw console.error("❌ Thesis query error:", A.error), A.error;
      if (C.error)
        throw console.error("❌ Thesis connections query error:", C.error), C.error;
      let F = [];
      O.error ? console.error("❌ Market price query error:", O.error) : (F = O.data || [], console.log(`📊 Fetched ${F.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: (U = $.data) == null ? void 0 : U.length,
        accountsCount: (N = v.data) == null ? void 0 : N.length,
        thesisCount: (j = A.data) == null ? void 0 : j.length,
        thesisConnectionsCount: (B = C.data) == null ? void 0 : B.length,
        marketPricesCount: F.length,
        filtered: f.length > 0,
        accessibleAccounts: f.length > 0 ? f : "all"
      });
      const x = new Map(
        (H.data || []).map((s) => [s.internal_account_id, s.alias])
      ), J = new Map(
        (v.data || []).map((s) => [s.internal_account_id, s.legal_entity])
      ), L = new Map(
        (A.data || []).map((s) => [s.id, { id: s.id, title: s.title, description: s.description }])
      ), K = /* @__PURE__ */ new Map();
      (C.data || []).forEach((s) => {
        const c = L.get(s.thesis_id);
        c && K.set(s.symbol_root, c);
      });
      const M = /* @__PURE__ */ new Map();
      for (const s of F)
        M.has(s.conid) || M.set(s.conid, { price: s.market_price, fetchedAt: s.last_fetched_at });
      console.log(`📊 Processed ${M.size} unique conids with latest prices`);
      const z = S.map((s) => {
        const c = te(s.symbol), b = c ? K.get(c) : null;
        let g = null, P = null, D = null, R = null;
        if (s.asset_class === "STK" || s.asset_class === "FUND") {
          const h = M.get(s.conid);
          g = (h == null ? void 0 : h.price) || null, P = (h == null ? void 0 : h.fetchedAt) || null;
        } else if (s.asset_class === "OPT") {
          const h = M.get(s.conid), E = M.get(s.undConid);
          D = (h == null ? void 0 : h.price) || null, R = (E == null ? void 0 : E.price) || null, g = R, P = (E == null ? void 0 : E.fetchedAt) || null;
        }
        let W = J.get(s.internal_account_id) || void 0;
        return x.has(s.internal_account_id) && (W = x.get(s.internal_account_id)), {
          ...s,
          legal_entity: W,
          thesis: b,
          market_price: g,
          market_price_fetched_at: P,
          option_market_price: D,
          underlying_market_price: R
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", z), z;
    },
    staleTime: 6e4
  }), d = o.channel(`positions:${e}`).on(
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
      var m, f;
      (m = d == null ? void 0 : d.unsubscribe) == null || m.call(d), (f = _ == null ? void 0 : _.unsubscribe) == null || f.call(_);
    }
  };
}
async function be(e, n, r, o) {
  try {
    console.log("🔍 Fetching positions for symbol root:", n, "account:", o);
    const t = await G(e, r);
    let i = e.schema("hf").from("positions").select("*").ilike("symbol", `${n}%`);
    o && (i = i.eq("internal_account_id", o)), t.length > 0 && (i = i.in("internal_account_id", t)), i = i.order("fetched_at", { ascending: !1 });
    const { data: a, error: u } = await i;
    if (u)
      throw console.error("❌ Error fetching positions by symbol root:", u), u;
    console.log("📊 Fetched positions count:", (a == null ? void 0 : a.length) || 0);
    const d = /* @__PURE__ */ new Map(), _ = (a || []).filter((l) => {
      const q = l.contract_quantity ?? l.qty, S = `${l.internal_account_id}|${l.symbol}|${q}|${l.asset_class}|${l.conid}`;
      return d.has(S) ? !1 : (d.set(S, l), !0);
    });
    console.log(
      "📊 Deduplicated positions count:",
      _.length,
      `(removed ${((a == null ? void 0 : a.length) || 0) - _.length} duplicates)`
    );
    const [m, f] = await Promise.all([
      e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
      r ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", r) : { data: [], error: null }
    ]), p = new Map(
      (f.data || []).map((l) => [l.internal_account_id, l.alias])
    ), T = new Map(
      (m.data || []).map((l) => [l.internal_account_id, l.legal_entity])
    ), k = _.map((l) => {
      let q = T.get(l.internal_account_id) || void 0;
      return p.has(l.internal_account_id) && (q = p.get(l.internal_account_id)), {
        ...l,
        legal_entity: q,
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
      unique: k.length,
      filtered: t.length > 0
    }), k;
  } catch (t) {
    return console.error("❌ Exception fetching positions by symbol root:", t), [];
  }
}
function ke(e) {
  const n = w(), r = Q.trades(e), o = V(), t = y({
    queryKey: r,
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
    () => o.invalidateQueries({ queryKey: r })
  ).subscribe();
  return {
    ...t,
    _cleanup: () => {
      var a;
      return (a = i == null ? void 0 : i.unsubscribe) == null ? void 0 : a.call(i);
    }
  };
}
async function Me(e) {
  const {
    supabaseUrl: n,
    supabaseAnon: r,
    supabaseClient: o,
    query: t
  } = e, i = o ?? ee(n, r), a = new Y({
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
    install(d) {
      d.provide(Z, i), d.use(I, { queryClient: a });
    }
  };
}
export {
  Z as SUPABASE,
  Me as createCore,
  te as extractSymbolRoot,
  re as fetchPositionOrderMappings,
  ne as fetchPositionPositionMappings,
  oe as fetchPositionTradeMappings,
  be as fetchPositionsBySymbolRoot,
  G as fetchUserAccessibleAccounts,
  _e as generateCommentKey,
  ue as generatePositionMappingKey,
  Q as queryKeys,
  ye as savePositionOrderMappings,
  pe as savePositionPositionMappings,
  fe as savePositionTradeMappings,
  ge as upsertSymbolComment,
  we as usePositionOrderMappingsQuery,
  de as usePositionPositionMappingsQuery,
  he as usePositionTradeMappingsQuery,
  qe as usePositionsQuery,
  w as useSupabase,
  me as useSymbolCommentsQuery,
  le as useThesisConnectionsQuery,
  ce as useThesisQuery,
  ke as useTradesQuery
};
