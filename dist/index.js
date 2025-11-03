import { inject as X } from "vue";
import { useQuery as A, useQueryClient as B, QueryClient as Y, VueQueryPlugin as I } from "@tanstack/vue-query";
import { createClient as D } from "@supabase/supabase-js";
const V = Symbol.for("y2kfund.supabase"), Q = {
  positions: (e, o) => ["positions", e, o],
  trades: (e) => ["trades", e],
  cashTransactions: (e) => ["cashTransactions", e],
  transfers: (e) => ["transfers", e],
  nlvMargin: (e, o) => ["nlvMargin", e, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function T() {
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
    const s = r.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (r) {
    return console.error("❌ Exception fetching account access:", r), [];
  }
}
function te(e) {
  if (!e) return null;
  const o = e.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function re() {
  const e = T(), o = Q.thesis();
  return A({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: s } = await e.schema("hf").from("thesisMaster").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function ce() {
  const e = T(), o = Q.thesisConnections();
  return A({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: s } = await e.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (s)
        throw console.error("❌ Thesis connections query error:", s), s;
      return n || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function ae(e) {
  return `${e.internal_account_id}|${e.symbol}|${e.qty}|${e.asset_class}|${e.conid}`;
}
function ie(e) {
  const o = T();
  return A({
    queryKey: ["symbolComments", e],
    queryFn: async () => {
      const { data: r, error: n } = await o.schema("hf").from("positions_symbol_comments").select("*").eq("user_id", e);
      if (n) throw n;
      return r || [];
    },
    staleTime: 6e4
  });
}
async function le(e, o, r, n) {
  const { error: s } = await e.schema("hf").from("positions_symbol_comments").upsert({
    comment_key: o,
    user_id: r,
    comment: n,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "comment_key,user_id" });
  if (s) throw s;
}
function ue(e, o, r) {
  const n = T(), s = B(), a = () => r && typeof r == "object" && "value" in r ? r.value : r, i = [...Q.positions(e, o), a()], p = A({
    queryKey: i,
    queryFn: async () => {
      var U, x, N, j;
      const f = a(), u = await ee(n, o);
      console.log("🔍 Querying positions with asOf:", f);
      let C = u;
      if (C.length === 0) {
        const { data: t, error: c } = await n.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((v) => {
          var m;
          return { data: ((m = v.data) == null ? void 0 : m.map((q) => q.internal_account_id)) ?? [], error: v.error };
        });
        if (c)
          return console.error("❌ Error fetching all account IDs:", c), [];
        C = Array.from(new Set(t));
      }
      let R;
      if (f) {
        const { data: t, error: c } = await n.schema("hf").rpc("get_latest_fetched_at_per_account", {
          account_ids: C,
          as_of_date: f
        });
        if (c)
          throw console.error("❌ Error fetching as-of fetched_at:", c), c;
        R = t || [];
      } else {
        const { data: t, error: c } = await n.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", C).order("fetched_at", { ascending: !1 });
        if (c)
          throw console.error("❌ Error fetching latest fetched_at per account:", c), c;
        R = t || [];
      }
      const S = /* @__PURE__ */ new Map();
      for (const t of R)
        S.has(t.internal_account_id) || S.set(t.internal_account_id, t.fetched_at);
      const Z = Array.from(S.entries()).map(
        ([t, c]) => n.schema("hf").from("positions").select("*").eq("internal_account_id", t).eq("fetched_at", c)
      ), E = await Promise.all(Z), G = E.flatMap((t) => t.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: u.length > 0 ? u : "all"
      });
      const [k, g, b, w, F, H] = await Promise.all([
        E[0],
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
        positionsCount: (U = k.data) == null ? void 0 : U.length,
        accountsCount: (x = g.data) == null ? void 0 : x.length,
        thesisCount: (N = b.data) == null ? void 0 : N.length,
        thesisConnectionsCount: (j = w.data) == null ? void 0 : j.length,
        marketPricesCount: M.length,
        filtered: u.length > 0,
        accessibleAccounts: u.length > 0 ? u : "all"
      });
      const P = new Map(
        (H.data || []).map((t) => [t.internal_account_id, t.alias])
      ), J = new Map(
        (g.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), L = new Map(
        (b.data || []).map((t) => [t.id, { id: t.id, title: t.title, description: t.description }])
      ), $ = /* @__PURE__ */ new Map();
      (w.data || []).forEach((t) => {
        const c = L.get(t.thesis_id);
        c && $.set(t.symbol_root, c);
      });
      const d = /* @__PURE__ */ new Map();
      for (const t of M)
        d.has(t.conid) || d.set(t.conid, { price: t.market_price, fetchedAt: t.last_fetched_at });
      console.log(`📊 Processed ${d.size} unique conids with latest prices`);
      const O = G.map((t) => {
        const c = te(t.symbol), v = c ? $.get(c) : null;
        let m = null, q = null, W = null, K = null;
        if (t.asset_class === "STK" || t.asset_class === "FUND") {
          const l = d.get(t.conid);
          m = (l == null ? void 0 : l.price) || null, q = (l == null ? void 0 : l.fetchedAt) || null;
        } else if (t.asset_class === "OPT") {
          const l = d.get(t.conid), _ = d.get(t.undConid);
          W = (l == null ? void 0 : l.price) || null, K = (_ == null ? void 0 : _.price) || null, m = K, q = (_ == null ? void 0 : _.fetchedAt) || null;
        }
        let z = J.get(t.internal_account_id) || void 0;
        return P.has(t.internal_account_id) && (z = P.get(t.internal_account_id)), {
          ...t,
          legal_entity: z,
          thesis: v,
          market_price: m,
          market_price_fetched_at: q,
          option_market_price: W,
          underlying_market_price: K
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", O), O;
    },
    staleTime: 6e4
  }), h = n.channel(`positions:${e}`).on(
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
function he(e) {
  const o = T(), r = Q.trades(e), n = B(), s = A({
    queryKey: r,
    queryFn: async () => {
      const { data: i, error: p } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (p) throw p;
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
    ...s,
    _cleanup: () => {
      var i;
      return (i = a == null ? void 0 : a.unsubscribe) == null ? void 0 : i.call(a);
    }
  };
}
async function fe(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: r,
    supabaseClient: n,
    query: s
  } = e, a = n ?? D(o, r), i = new Y({
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
  fe as createCore,
  te as extractSymbolRoot,
  ee as fetchUserAccessibleAccounts,
  ae as generateCommentKey,
  Q as queryKeys,
  le as upsertSymbolComment,
  ue as usePositionsQuery,
  T as useSupabase,
  ie as useSymbolCommentsQuery,
  ce as useThesisConnectionsQuery,
  re as useThesisQuery,
  he as useTradesQuery
};
