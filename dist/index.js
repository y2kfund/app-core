import { inject as J } from "vue";
import { useQuery as T, useQueryClient as W, QueryClient as L, VueQueryPlugin as X } from "@tanstack/vue-query";
import { createClient as Y } from "@supabase/supabase-js";
const j = Symbol.for("y2kfund.supabase"), k = {
  positions: (t, o) => ["positions", t, o],
  trades: (t) => ["trades", t],
  cashTransactions: (t) => ["cashTransactions", t],
  nlvMargin: (t, o) => ["nlvMargin", t, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (t) => ["userAccountAccess", t]
};
function M() {
  const t = J(j, null);
  if (!t) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return t;
}
async function D(t, o) {
  if (!o)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", o);
    const { data: n, error: r } = await t.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", o).eq("is_active", !0);
    if (r)
      return console.error("❌ Error fetching user account access:", r), [];
    if (!n || n.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = n.map((i) => i.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (n) {
    return console.error("❌ Exception fetching account access:", n), [];
  }
}
function I(t) {
  if (!t) return null;
  const o = t.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function oe() {
  const t = M(), o = k.thesis();
  return T({
    queryKey: o,
    queryFn: async () => {
      const { data: r, error: s } = await t.schema("hf").from("thesisMaster").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return r || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function ne() {
  const t = M(), o = k.thesisConnections();
  return T({
    queryKey: o,
    queryFn: async () => {
      const { data: r, error: s } = await t.schema("hf").from("positionsAndThesisConnection").select("*").order("symbol_root");
      if (s)
        throw console.error("❌ Thesis connections query error:", s), s;
      return r || [];
    },
    staleTime: 3e5
    // 5 minutes
  });
}
function re(t, o) {
  const n = M(), r = k.positions(t, o), s = W(), i = T({
    queryKey: r,
    queryFn: async () => {
      var S, O, U, $;
      const a = await D(n, o);
      let f = a;
      if (f.length === 0) {
        const { data: e, error: l } = await n.schema("hf").from("positions").select("internal_account_id").neq("internal_account_id", null).then((A) => {
          var _;
          return { data: ((_ = A.data) == null ? void 0 : _.map((b) => b.internal_account_id)) ?? [], error: A.error };
        });
        if (l)
          return console.error("❌ Error fetching all account IDs:", l), [];
        f = Array.from(new Set(e));
      }
      const { data: z, error: C } = await n.schema("hf").from("positions").select("internal_account_id, fetched_at").in("internal_account_id", f).order("fetched_at", { ascending: !1 });
      if (C)
        throw console.error("❌ Error fetching latest fetched_at per account:", C), C;
      const R = /* @__PURE__ */ new Map();
      for (const e of z || [])
        R.has(e.internal_account_id) || R.set(e.internal_account_id, e.fetched_at);
      const B = Array.from(R.entries()).map(
        ([e, l]) => n.schema("hf").from("positions").select("*").eq("internal_account_id", e).eq("fetched_at", l)
      ), F = await Promise.all(B), V = F.flatMap((e) => e.data || []);
      console.log("🔍 Querying positions with config:", {
        accountId: t,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: a.length > 0 ? a : "all"
      });
      const [w, m, y, g, v, Z] = await Promise.all([
        F[0],
        n.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        n.schema("hf").from("thesisMaster").select("id, title, description"),
        n.schema("hf").from("positionsAndThesisConnection").select("*"),
        n.schema("hf").rpc("get_latest_market_prices"),
        o ? n.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (w.error)
        throw console.error("❌ Positions query error:", w.error), w.error;
      if (m.error)
        throw console.error("❌ Accounts query error:", m.error), m.error;
      if (y.error)
        throw console.error("❌ Thesis query error:", y.error), y.error;
      if (g.error)
        throw console.error("❌ Thesis connections query error:", g.error), g.error;
      let q = [];
      v.error ? console.error("❌ Market price query error:", v.error) : (q = v.data || [], console.log(`📊 Fetched ${q.length} market price records`)), console.log("✅ Positions query success:", {
        positionsCount: (S = w.data) == null ? void 0 : S.length,
        accountsCount: (O = m.data) == null ? void 0 : O.length,
        thesisCount: (U = y.data) == null ? void 0 : U.length,
        thesisConnectionsCount: ($ = g.data) == null ? void 0 : $.length,
        marketPricesCount: q.length,
        filtered: a.length > 0,
        accessibleAccounts: a.length > 0 ? a : "all"
      });
      const E = new Map(
        (Z.data || []).map((e) => [e.internal_account_id, e.alias])
      ), G = new Map(
        (m.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), H = new Map(
        (y.data || []).map((e) => [e.id, { id: e.id, title: e.title, description: e.description }])
      ), P = /* @__PURE__ */ new Map();
      (g.data || []).forEach((e) => {
        const l = H.get(e.thesis_id);
        l && P.set(e.symbol_root, l);
      });
      const d = /* @__PURE__ */ new Map();
      for (const e of q)
        d.has(e.conid) || d.set(e.conid, { price: e.market_price, fetchedAt: e.last_fetched_at });
      console.log(`📊 Processed ${d.size} unique conids with latest prices`);
      const K = V.map((e) => {
        const l = I(e.symbol), A = l ? P.get(l) : null;
        let _ = null, b = null, x = null, Q = null;
        if (e.asset_class === "STK" || e.asset_class === "FUND") {
          const u = d.get(e.conid);
          _ = (u == null ? void 0 : u.price) || null, b = (u == null ? void 0 : u.fetchedAt) || null;
        } else if (e.asset_class === "OPT") {
          const u = d.get(e.conid), p = d.get(e.undConid);
          x = (u == null ? void 0 : u.price) || null, Q = (p == null ? void 0 : p.price) || null, _ = Q, b = (p == null ? void 0 : p.fetchedAt) || null;
        }
        let N = G.get(e.internal_account_id) || void 0;
        return E.has(e.internal_account_id) && (N = E.get(e.internal_account_id)), {
          ...e,
          legal_entity: N,
          thesis: A,
          market_price: _,
          market_price_fetched_at: b,
          option_market_price: x,
          underlying_market_price: Q
        };
      });
      return console.log("✅ Enriched positions with accounts and thesis", K), K;
    },
    staleTime: 6e4
  }), c = n.channel(`positions:${t}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: r })
  ).subscribe(), h = n.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: r })
  ).subscribe();
  return {
    ...i,
    _cleanup: () => {
      var a, f;
      (a = c == null ? void 0 : c.unsubscribe) == null || a.call(c), (f = h == null ? void 0 : h.unsubscribe) == null || f.call(h);
    }
  };
}
function ce(t) {
  const o = M(), n = k.trades(t), r = W(), s = T({
    queryKey: n,
    queryFn: async () => {
      const { data: c, error: h } = await o.schema("hf").from("trades").select("*").eq("account_id", t).order("trade_date", { ascending: !1 });
      if (h) throw h;
      return c || [];
    },
    staleTime: 6e4
  }), i = o.channel(`trades:${t}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${t}`
    },
    () => r.invalidateQueries({ queryKey: n })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var c;
      return (c = i == null ? void 0 : i.unsubscribe) == null ? void 0 : c.call(i);
    }
  };
}
async function ae(t) {
  const {
    supabaseUrl: o,
    supabaseAnon: n,
    supabaseClient: r,
    query: s
  } = t, i = r ?? Y(o, n), c = new L({
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
    install(a) {
      a.provide(j, i), a.use(X, { queryClient: c });
    }
  };
}
export {
  j as SUPABASE,
  ae as createCore,
  I as extractSymbolRoot,
  D as fetchUserAccessibleAccounts,
  k as queryKeys,
  re as usePositionsQuery,
  M as useSupabase,
  ne as useThesisConnectionsQuery,
  oe as useThesisQuery,
  ce as useTradesQuery
};
