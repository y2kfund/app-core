import { inject as R } from "vue";
import { useQuery as m, useQueryClient as C, QueryClient as K, VueQueryPlugin as P } from "@tanstack/vue-query";
import { createClient as S } from "@supabase/supabase-js";
const T = Symbol.for("y2kfund.supabase"), b = {
  positions: (e, r) => ["positions", e, r],
  trades: (e) => ["trades", e],
  nlvMargin: (e, r) => ["nlvMargin", e, r],
  thesis: () => ["thesis"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function w() {
  const e = R(T, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function O(e, r) {
  if (!r)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", r);
    const { data: t, error: i } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", r).eq("is_active", !0);
    if (i)
      return console.error("❌ Error fetching user account access:", i), [];
    if (!t || t.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = t.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (t) {
    return console.error("❌ Exception fetching account access:", t), [];
  }
}
function W() {
  const e = w(), r = b.thesis();
  return m({
    queryKey: r,
    queryFn: async () => {
      const { data: i, error: s } = await e.schema("hf").from("thesisMaster").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return i || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function j(e, r) {
  const t = w(), i = b.positions(e, r), s = C(), a = m({
    queryKey: i,
    queryFn: async () => {
      var q, A, k;
      const n = await O(t, r);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: r || "none",
        accessibleAccountIds: n.length > 0 ? n : "all"
      });
      const l = await t.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (l.error)
        throw console.error("❌ Max fetched_at query error:", l.error), l.error;
      if (!l.data || l.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const y = l.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", y);
      let h = t.schema("hf").from("positions").select("*").eq("fetched_at", y);
      n.length > 0 ? (console.log("🔒 Applying access filter for accounts:", n), h = h.in("internal_account_id", n)) : console.log("🔓 No access filter applied - showing all positions"), h = h.order("symbol");
      const [d, f, p] = await Promise.all([
        h,
        t.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        t.schema("hf").from("thesisMaster").select("id, title, description")
      ]);
      if (d.error)
        throw console.error("❌ Positions query error:", d.error), d.error;
      if (f.error)
        throw console.error("❌ Accounts query error:", f.error), f.error;
      if (p.error)
        throw console.error("❌ Thesis query error:", p.error), p.error;
      let g = [];
      const _ = await t.schema("hf").rpc("get_latest_market_prices");
      _.error ? console.error("❌ Market price query error:", _.error) : (g = _.data || [], console.log(`📊 Fetched ${g.length} latest market prices`)), console.log("✅ Positions query success:", {
        latestFetchedAt: y,
        positionsCount: (q = d.data) == null ? void 0 : q.length,
        accountsCount: (A = f.data) == null ? void 0 : A.length,
        thesisCount: (k = p.data) == null ? void 0 : k.length,
        marketPricesCount: g.length,
        filtered: n.length > 0,
        accessibleAccounts: n.length > 0 ? n : "all"
      });
      const M = new Map(
        (f.data || []).map((o) => [o.internal_account_id, o.legal_entity])
      ), Q = new Map(
        (p.data || []).map((o) => [o.id, { id: o.id, title: o.title, description: o.description }])
      ), v = new Map(
        g.map((o) => [
          o.conid,
          { price: o.market_price, fetchedAt: o.last_fetched_at }
        ])
      );
      return (d.data || []).map((o) => {
        const F = o.asset_class === "STK" ? o.conid : o.undConid, u = v.get(F);
        return {
          ...o,
          legal_entity: M.get(o.internal_account_id) || void 0,
          thesis: o.thesis_id ? Q.get(o.thesis_id) : null,
          market_price: (u == null ? void 0 : u.price) || null,
          market_price_fetched_at: (u == null ? void 0 : u.fetchedAt) || null
        };
      });
    },
    staleTime: 6e4
  }), c = t.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => s.invalidateQueries({ queryKey: i })
  ).subscribe();
  return {
    ...a,
    _cleanup: () => {
      var n;
      return (n = c == null ? void 0 : c.unsubscribe) == null ? void 0 : n.call(c);
    }
  };
}
function B(e) {
  const r = w(), t = b.trades(e), i = C(), s = m({
    queryKey: t,
    queryFn: async () => {
      const { data: c, error: n } = await r.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (n) throw n;
      return c || [];
    },
    staleTime: 6e4
  }), a = r.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => i.invalidateQueries({ queryKey: t })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var c;
      return (c = a == null ? void 0 : a.unsubscribe) == null ? void 0 : c.call(a);
    }
  };
}
async function L(e) {
  const {
    supabaseUrl: r,
    supabaseAnon: t,
    supabaseClient: i,
    query: s
  } = e, a = i ?? S(r, t), c = new K({
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
    install(l) {
      l.provide(T, a), l.use(P, { queryClient: c });
    }
  };
}
export {
  T as SUPABASE,
  L as createCore,
  O as fetchUserAccessibleAccounts,
  b as queryKeys,
  j as usePositionsQuery,
  w as useSupabase,
  W as useThesisQuery,
  B as useTradesQuery
};
