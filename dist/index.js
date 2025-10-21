import { inject as $ } from "vue";
import { useQuery as b, useQueryClient as K, QueryClient as W, VueQueryPlugin as j } from "@tanstack/vue-query";
import { createClient as B } from "@supabase/supabase-js";
const P = Symbol.for("y2kfund.supabase"), w = {
  positions: (e, o) => ["positions", e, o],
  trades: (e) => ["trades", e],
  nlvMargin: (e, o) => ["nlvMargin", e, o],
  thesis: () => ["thesis"],
  thesisConnections: () => ["thesisConnections"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function q() {
  const e = $(P, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function D(e, o) {
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
function L(e) {
  if (!e) return null;
  const o = e.match(/^([A-Z]+)\b/);
  return (o == null ? void 0 : o[1]) || null;
}
function J() {
  const e = q(), o = w.thesis();
  return b({
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
function X() {
  const e = q(), o = w.thesisConnections();
  return b({
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
function Y(e, o) {
  const r = q(), n = w.positions(e, o), s = K(), a = b({
    queryKey: n,
    queryFn: async () => {
      var k, R, Q, v;
      const c = await D(r, o);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: o || "none",
        accessibleAccountIds: c.length > 0 ? c : "all"
      });
      const u = await r.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (u.error)
        throw console.error("❌ Max fetched_at query error:", u.error), u.error;
      if (!u.data || u.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const A = u.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", A);
      let d = r.schema("hf").from("positions").select("*").eq("fetched_at", A);
      c.length > 0 ? (console.log("🔒 Applying access filter for accounts:", c), d = d.in("internal_account_id", c)) : console.log("🔓 No access filter applied - showing all positions"), d = d.order("symbol");
      const [f, p, y, _, T, S] = await Promise.all([
        d,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        r.schema("hf").from("thesisMaster").select("id, title, description"),
        r.schema("hf").from("positionsAndThesisConnection").select("*"),
        r.schema("hf").rpc("get_latest_market_prices"),
        o ? r.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (f.error)
        throw console.error("❌ Positions query error:", f.error), f.error;
      if (p.error)
        throw console.error("❌ Accounts query error:", p.error), p.error;
      if (y.error)
        throw console.error("❌ Thesis query error:", y.error), y.error;
      if (_.error)
        throw console.error("❌ Thesis connections query error:", _.error), _.error;
      let g = [];
      T.error ? console.error("❌ Market price query error:", T.error) : (g = T.data || [], console.log(`📊 Fetched ${g.length} latest market prices`)), console.log("✅ Positions query success:", {
        latestFetchedAt: A,
        positionsCount: (k = f.data) == null ? void 0 : k.length,
        accountsCount: (R = p.data) == null ? void 0 : R.length,
        thesisCount: (Q = y.data) == null ? void 0 : Q.length,
        thesisConnectionsCount: (v = _.data) == null ? void 0 : v.length,
        marketPricesCount: g.length,
        filtered: c.length > 0,
        accessibleAccounts: c.length > 0 ? c : "all"
      });
      const C = new Map(
        (S.data || []).map((t) => [t.internal_account_id, t.alias])
      ), x = new Map(
        (p.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), E = new Map(
        (y.data || []).map((t) => [t.id, { id: t.id, title: t.title, description: t.description }])
      ), M = /* @__PURE__ */ new Map();
      (_.data || []).forEach((t) => {
        const m = E.get(t.thesis_id);
        m && M.set(t.symbol_root, m);
      });
      const N = new Map(
        g.map((t) => [
          t.conid,
          { price: t.market_price, fetchedAt: t.last_fetched_at }
        ])
      );
      return (f.data || []).map((t) => {
        const m = L(t.symbol), O = m ? M.get(m) : null, U = t.asset_class === "STK" || t.asset_class === "FUND" ? t.conid : t.undConid, h = N.get(U);
        let F = x.get(t.internal_account_id) || void 0;
        return C.has(t.internal_account_id) && (F = C.get(t.internal_account_id)), {
          ...t,
          legal_entity: F,
          thesis: O,
          market_price: (h == null ? void 0 : h.price) || null,
          market_price_fetched_at: (h == null ? void 0 : h.fetchedAt) || null
        };
      });
    },
    staleTime: 6e4
  }), i = r.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => s.invalidateQueries({ queryKey: n })
  ).subscribe(), l = r.channel("thesis-connections").on(
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
function I(e) {
  const o = q(), r = w.trades(e), n = K(), s = b({
    queryKey: r,
    queryFn: async () => {
      const { data: i, error: l } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (l) throw l;
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
async function ee(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: r,
    supabaseClient: n,
    query: s
  } = e, a = n ?? B(o, r), i = new W({
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
      c.provide(P, a), c.use(j, { queryClient: i });
    }
  };
}
export {
  P as SUPABASE,
  ee as createCore,
  L as extractSymbolRoot,
  D as fetchUserAccessibleAccounts,
  w as queryKeys,
  Y as usePositionsQuery,
  q as useSupabase,
  X as useThesisConnectionsQuery,
  J as useThesisQuery,
  I as useTradesQuery
};
