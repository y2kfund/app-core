import { inject as N } from "vue";
import { useQuery as b, useQueryClient as v, QueryClient as O, VueQueryPlugin as U } from "@tanstack/vue-query";
import { createClient as $ } from "@supabase/supabase-js";
const F = Symbol.for("y2kfund.supabase"), w = {
  positions: (e, t) => ["positions", e, t],
  trades: (e) => ["trades", e],
  nlvMargin: (e, t) => ["nlvMargin", e, t],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function q() {
  const e = N(F, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function W(e, t) {
  if (!t)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", t);
    const { data: o, error: n } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", t).eq("is_active", !0);
    if (n)
      return console.error("❌ Error fetching user account access:", n), [];
    if (!o || o.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = o.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (o) {
    return console.error("❌ Exception fetching account access:", o), [];
  }
}
function j(e) {
  if (!e) return null;
  const t = e.match(/^([A-Z]+)\b/);
  return (t == null ? void 0 : t[1]) || null;
}
function z() {
  const e = q(), t = w.thesis();
  return b({
    queryKey: t,
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
function G() {
  const e = q(), t = w.thesisConnections();
  return b({
    queryKey: t,
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
function H(e, t) {
  const o = q(), n = w.positions(e, t), s = v(), a = b({
    queryKey: n,
    queryFn: async () => {
      var k, M, Q, R;
      const c = await W(o, t);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: t || "none",
        accessibleAccountIds: c.length > 0 ? c : "all"
      });
      const u = await o.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (u.error)
        throw console.error("❌ Max fetched_at query error:", u.error), u.error;
      if (!u.data || u.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const A = u.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", A);
      let d = o.schema("hf").from("positions").select("*").eq("fetched_at", A);
      c.length > 0 ? (console.log("🔒 Applying access filter for accounts:", c), d = d.in("internal_account_id", c)) : console.log("🔓 No access filter applied - showing all positions"), d = d.order("symbol");
      const [f, p, y, m, T] = await Promise.all([
        d,
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesisMaster").select("id, title, description"),
        o.schema("hf").from("positionsAndThesisConnection").select("*"),
        o.schema("hf").rpc("get_latest_market_prices")
      ]);
      if (f.error)
        throw console.error("❌ Positions query error:", f.error), f.error;
      if (p.error)
        throw console.error("❌ Accounts query error:", p.error), p.error;
      if (y.error)
        throw console.error("❌ Thesis query error:", y.error), y.error;
      if (m.error)
        throw console.error("❌ Thesis connections query error:", m.error), m.error;
      let _ = [];
      T.error ? console.error("❌ Market price query error:", T.error) : (_ = T.data || [], console.log(`📊 Fetched ${_.length} latest market prices`)), console.log("✅ Positions query success:", {
        latestFetchedAt: A,
        positionsCount: (k = f.data) == null ? void 0 : k.length,
        accountsCount: (M = p.data) == null ? void 0 : M.length,
        thesisCount: (Q = y.data) == null ? void 0 : Q.length,
        thesisConnectionsCount: (R = m.data) == null ? void 0 : R.length,
        marketPricesCount: _.length,
        filtered: c.length > 0,
        accessibleAccounts: c.length > 0 ? c : "all"
      });
      const K = new Map(
        (p.data || []).map((r) => [r.internal_account_id, r.legal_entity])
      ), P = new Map(
        (y.data || []).map((r) => [r.id, { id: r.id, title: r.title, description: r.description }])
      ), C = /* @__PURE__ */ new Map();
      (m.data || []).forEach((r) => {
        const g = P.get(r.thesis_id);
        g && C.set(r.symbol_root, g);
      });
      const S = new Map(
        _.map((r) => [
          r.conid,
          { price: r.market_price, fetchedAt: r.last_fetched_at }
        ])
      );
      return (f.data || []).map((r) => {
        const g = j(r.symbol), x = g ? C.get(g) : null, E = r.asset_class === "STK" || r.asset_class === "FUND" ? r.conid : r.undConid, h = S.get(E);
        return {
          ...r,
          legal_entity: K.get(r.internal_account_id) || void 0,
          thesis: x,
          market_price: (h == null ? void 0 : h.price) || null,
          market_price_fetched_at: (h == null ? void 0 : h.fetchedAt) || null
        };
      });
    },
    staleTime: 6e4
  }), i = o.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: n })
  ).subscribe(), l = o.channel("thesis-connections").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: n })
  ).subscribe();
  return {
    ...a,
    _cleanup: () => {
      var c, u;
      (c = i == null ? void 0 : i.unsubscribe) == null || c.call(i), (u = l == null ? void 0 : l.unsubscribe) == null || u.call(l);
    }
  };
}
function J(e) {
  const t = q(), o = w.trades(e), n = v(), s = b({
    queryKey: o,
    queryFn: async () => {
      const { data: i, error: l } = await t.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (l) throw l;
      return i || [];
    },
    staleTime: 6e4
  }), a = t.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => n.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var i;
      return (i = a == null ? void 0 : a.unsubscribe) == null ? void 0 : i.call(a);
    }
  };
}
async function X(e) {
  const {
    supabaseUrl: t,
    supabaseAnon: o,
    supabaseClient: n,
    query: s
  } = e, a = n ?? $(t, o), i = new O({
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
    install(c) {
      c.provide(F, a), c.use(U, { queryClient: i });
    }
  };
}
export {
  F as SUPABASE,
  X as createCore,
  j as extractSymbolRoot,
  W as fetchUserAccessibleAccounts,
  w as queryKeys,
  H as usePositionsQuery,
  q as useSupabase,
  G as useThesisConnectionsQuery,
  z as useThesisQuery,
  J as useTradesQuery
};
