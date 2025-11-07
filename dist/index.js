import { inject as X } from "vue";
import { useQuery as h, useQueryClient as B, QueryClient as Y, VueQueryPlugin as D } from "@tanstack/vue-query";
import { createClient as I } from "@supabase/supabase-js";
const V = Symbol.for("y2kfund.supabase"), P = {
  positions: (e, o) => ["positions", e, o],
  trades: (e) => ["trades", e],
  cashTransactions: (e) => ["cashTransactions", e],
  transfers: (e) => ["transfers", e],
  nlvMargin: (e, o) => ["nlvMargin", e, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function d() {
  const e = X(V, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function ee(e, o) {
  if (!o)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", o);
    const { data: r, error: n } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", o).eq("is_active", !0);
    if (n)
      return console.error("❌ Error fetching user account access:", n), [];
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
  const o = e.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function ae() {
  const e = d(), o = P.thesis();
  return h({
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
function ce() {
  const e = d(), o = P.thesisConnections();
  return h({
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
function le(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.contract_quantity}|${e.asset_class}|${e.conid}`;
}
async function oe(e, o) {
  try {
    const { data: r, error: n } = await e.schema("hf").from("position_position_mappings").select("mapping_key, attached_position_key").eq("user_id", o);
    if (n)
      return console.error("❌ Error fetching position-position mappings:", n), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return r && r.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.attached_position_key);
    }), t;
  } catch (r) {
    return console.error("❌ Exception fetching position-position mappings:", r), /* @__PURE__ */ new Map();
  }
}
async function ue(e, o, r, n) {
  try {
    const { error: t } = await e.schema("hf").from("position_position_mappings").delete().eq("user_id", o).eq("mapping_key", r);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (n.size > 0) {
      const i = Array.from(n).map((u) => ({
        user_id: o,
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
      userId: o,
      mappingKey: r,
      positionCount: n.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position-position mappings:", t), t;
  }
}
function pe(e) {
  const o = d();
  return h({
    queryKey: ["positionPositionMappings", e],
    queryFn: async () => e ? await oe(o, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
  });
}
async function se(e, o) {
  try {
    const { data: r, error: n } = await e.schema("hf").from("position_trade_mappings").select("mapping_key, trade_id").eq("user_id", o);
    if (n)
      return console.error("❌ Error fetching position trade mappings:", n), /* @__PURE__ */ new Map();
    const t = /* @__PURE__ */ new Map();
    return r && r.forEach((i) => {
      t.has(i.mapping_key) || t.set(i.mapping_key, /* @__PURE__ */ new Set()), t.get(i.mapping_key).add(i.trade_id);
    }), t;
  } catch (r) {
    return console.error("❌ Exception fetching position trade mappings:", r), /* @__PURE__ */ new Map();
  }
}
async function fe(e, o, r, n) {
  try {
    const { error: t } = await e.schema("hf").from("position_trade_mappings").delete().eq("user_id", o).eq("mapping_key", r);
    if (t)
      throw console.error("❌ Error deleting old mappings:", t), t;
    if (n.size > 0) {
      const i = Array.from(n).map((u) => ({
        user_id: o,
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
      userId: o,
      mappingKey: r,
      tradeCount: n.size
    });
  } catch (t) {
    throw console.error("❌ Exception saving position trade mappings:", t), t;
  }
}
function he(e) {
  const o = d();
  return h({
    queryKey: ["positionTradeMappings", e],
    queryFn: async () => e ? await se(o, e) : /* @__PURE__ */ new Map(),
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  });
}
function de(e) {
  const o = e.contract_quantity ?? e.qty;
  return `${e.internal_account_id}|${e.symbol}|${o}|${e.asset_class}|${e.conid}`;
}
function _e(e) {
  const o = d();
  return h({
    queryKey: ["symbolComments", e],
    queryFn: async () => {
      const { data: r, error: n } = await o.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", e);
      if (n) throw n;
      return r || [];
    },
    staleTime: 6e4
  });
}
async function me(e, o, r, n) {
  const { error: t } = await e.schema("hf").from("positions_symbol_comments").upsert({
    comment_key: o,
    user_id: r,
    comment: n,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "comment_key,user_id" });
  if (t) throw t;
}
function ge(e, o, r) {
  const n = d(), t = B(), i = () => r && typeof r == "object" && "value" in r ? r.value : r, a = [...P.positions(e, o), i()], u = h({
    queryKey: a,
    queryFn: async () => {
      var x, z, U, N;
      const _ = i(), p = await ee(n, o);
      console.log("🔍 Querying positions with asOf:", _);
      let T = p;
      if (T.length === 0) {
        const { data: s, error: c } = await n.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((C) => {
          var g;
          return { data: ((g = C.data) == null ? void 0 : g.map((M) => M.internal_account_id)) ?? [], error: C.error };
        });
        if (c)
          return console.error("❌ Error fetching all account IDs:", c), [];
        T = Array.from(new Set(s));
      }
      let v;
      if (_) {
        const { data: s, error: c } = await n.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: T,
          as_of_date: _
        });
        if (c)
          throw console.error("❌ Error fetching as-of fetched_at:", c), c;
        v = s || [];
      } else {
        const { data: s, error: c } = await n.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", T).order("fetched_at", { ascending: !1 });
        if (c)
          throw console.error("❌ Error fetching latest fetched_at per account:", c), c;
        v = s || [];
      }
      const S = /* @__PURE__ */ new Map();
      for (const s of v)
        S.has(s.internal_account_id) || S.set(s.internal_account_id, s.fetched_at);
      const Z = Array.from(S.entries()).map(
        ([s, c]) => n.schema("hf").from("positions").select("*").eq("internal_account_id", s).eq("fetched_at", c)
      ), R = await Promise.all(Z), G = R.flatMap((s) => s.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: p.length > 0 ? p : "all"
      });
      const [A, b, q, k, Q, H] = await Promise.all([
        R[0],
        n.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        n.schema("hf").from("thesisMaster").select("id, title, description"),
        n.schema("hf").from("positionsAndThesisConnection").select("*"),
        n.schema("hf").rpc("get_latest_market_prices"),
        o ? n.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (A.error)
        throw console.error("❌ Positions query error:", A.error), A.error;
      if (b.error)
        throw console.error("❌ Accounts query error:", b.error), b.error;
      if (q.error)
        throw console.error("❌ Thesis query error:", q.error), q.error;
      if (k.error)
        throw console.error("❌ Thesis connections query error:", k.error), k.error;
      let E = [];
      Q.error ? console.error("❌ Market price query error:", Q.error) : (E = Q.data || [], console.log(`📊 Fetched ${E.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: (x = A.data) == null ? void 0 : x.length,
        accountsCount: (z = b.data) == null ? void 0 : z.length,
        thesisCount: (U = q.data) == null ? void 0 : U.length,
        thesisConnectionsCount: (N = k.data) == null ? void 0 : N.length,
        marketPricesCount: E.length,
        filtered: p.length > 0,
        accessibleAccounts: p.length > 0 ? p : "all"
      });
      const F = new Map(
        (H.data || []).map((s) => [s.internal_account_id, s.alias])
      ), J = new Map(
        (b.data || []).map((s) => [s.internal_account_id, s.legal_entity])
      ), L = new Map(
        (q.data || []).map((s) => [s.id, { id: s.id, title: s.title, description: s.description }])
      ), K = /* @__PURE__ */ new Map();
      (k.data || []).forEach((s) => {
        const c = L.get(s.thesis_id);
        c && K.set(s.symbol_root, c);
      });
      const m = /* @__PURE__ */ new Map();
      for (const s of E)
        m.has(s.conid) || m.set(s.conid, { price: s.market_price, fetchedAt: s.last_fetched_at });
      console.log(`📊 Processed ${m.size} unique conids with latest prices`);
      const O = G.map((s) => {
        const c = te(s.symbol), C = c ? K.get(c) : null;
        let g = null, M = null, j = null, $ = null;
        if (s.asset_class === "STK" || s.asset_class === "FUND") {
          const l = m.get(s.conid);
          g = (l == null ? void 0 : l.price) || null, M = (l == null ? void 0 : l.fetchedAt) || null;
        } else if (s.asset_class === "OPT") {
          const l = m.get(s.conid), y = m.get(s.undConid);
          j = (l == null ? void 0 : l.price) || null, $ = (y == null ? void 0 : y.price) || null, g = $, M = (y == null ? void 0 : y.fetchedAt) || null;
        }
        let W = J.get(s.internal_account_id) || void 0;
        return F.has(s.internal_account_id) && (W = F.get(s.internal_account_id)), {
          ...s,
          legal_entity: W,
          thesis: C,
          market_price: g,
          market_price_fetched_at: M,
          option_market_price: j,
          underlying_market_price: $
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", O), O;
    },
    staleTime: 6e4
  }), f = n.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => t.invalidateQueries({ queryKey: a })
  ).subscribe(), w = n.channel("thesis-connections").on(
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
      var _, p;
      (_ = f == null ? void 0 : f.unsubscribe) == null || _.call(f), (p = w == null ? void 0 : w.unsubscribe) == null || p.call(w);
    }
  };
}
function ye(e) {
  const o = d(), r = P.trades(e), n = B(), t = h({
    queryKey: r,
    queryFn: async () => {
      const { data: a, error: u } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (u) throw u;
      return a || [];
    },
    staleTime: 6e4
  }), i = o.channel(`trades:${e}`).on(
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
      var a;
      return (a = i == null ? void 0 : i.unsubscribe) == null ? void 0 : a.call(i);
    }
  };
}
async function we(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: r,
    supabaseClient: n,
    query: t
  } = e, i = n ?? I(o, r), a = new Y({
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
    install(f) {
      f.provide(V, i), f.use(D, { queryClient: a });
    }
  };
}
export {
  V as SUPABASE,
  we as createCore,
  te as extractSymbolRoot,
  oe as fetchPositionPositionMappings,
  se as fetchPositionTradeMappings,
  ee as fetchUserAccessibleAccounts,
  de as generateCommentKey,
  le as generatePositionMappingKey,
  P as queryKeys,
  ue as savePositionPositionMappings,
  fe as savePositionTradeMappings,
  me as upsertSymbolComment,
  pe as usePositionPositionMappingsQuery,
  he as usePositionTradeMappingsQuery,
  ge as usePositionsQuery,
  d as useSupabase,
  _e as useSymbolCommentsQuery,
  ce as useThesisConnectionsQuery,
  ae as useThesisQuery,
  ye as useTradesQuery
};
