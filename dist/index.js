import { inject as v } from "vue";
import { useQuery as g, useQueryClient as q, QueryClient as C, VueQueryPlugin as F } from "@tanstack/vue-query";
import { createClient as M } from "@supabase/supabase-js";
const A = Symbol.for("y2kfund.supabase"), y = {
  positions: (e, t) => ["positions", e, t],
  trades: (e) => ["trades", e],
  nlvMargin: (e, t) => ["nlvMargin", e, t],
  thesis: () => ["thesis"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function m() {
  const e = v(A, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
async function K(e, t) {
  if (!t)
    return console.log("⚠️ No userId provided, showing all positions"), [];
  try {
    console.log("👤 Fetching accessible accounts for user:", t);
    const { data: o, error: i } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", t).eq("is_active", !0);
    if (i)
      return console.error("❌ Error fetching user account access:", i), [];
    if (!o || o.length === 0)
      return console.log("⚠️ No account access found for user, showing all positions"), [];
    const s = o.map((a) => a.internal_account_id);
    return console.log("✅ User has access to accounts:", s), s;
  } catch (o) {
    return console.error("❌ Exception fetching account access:", o), [];
  }
}
function x() {
  const e = m(), t = y.thesis();
  return g({
    queryKey: t,
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
function E(e, t) {
  const o = m(), i = y.positions(e, t), s = q(), a = g({
    queryKey: i,
    queryFn: async () => {
      var _, b, w;
      const r = await K(o, t);
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        userId: t || "none",
        accessibleAccountIds: r.length > 0 ? r : "all"
      });
      const l = await o.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (l.error)
        throw console.error("❌ Max fetched_at query error:", l.error), l.error;
      if (!l.data || l.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const p = l.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", p);
      let u = o.schema("hf").from("positions").select("*").eq("fetched_at", p);
      r.length > 0 ? (console.log("🔒 Applying access filter for accounts:", r), u = u.in("internal_account_id", r)) : console.log("🔓 No access filter applied - showing all positions"), u = u.order("symbol");
      const [h, d, f] = await Promise.all([
        u,
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesisMaster").select("id, title, description")
      ]);
      if (h.error)
        throw console.error("❌ Positions query error:", h.error), h.error;
      if (d.error)
        throw console.error("❌ Accounts query error:", d.error), d.error;
      if (f.error)
        throw console.error("❌ Thesis query error:", f.error), f.error;
      console.log("✅ Positions query success:", {
        latestFetchedAt: p,
        positionsCount: (_ = h.data) == null ? void 0 : _.length,
        accountsCount: (b = d.data) == null ? void 0 : b.length,
        thesisCount: (w = f.data) == null ? void 0 : w.length,
        filtered: r.length > 0,
        accessibleAccounts: r.length > 0 ? r : "all"
      });
      const Q = new Map(
        (d.data || []).map((c) => [c.internal_account_id, c.legal_entity])
      ), T = new Map(
        (f.data || []).map((c) => [c.id, { id: c.id, title: c.title, description: c.description }])
      );
      return (h.data || []).map((c) => ({
        ...c,
        legal_entity: Q.get(c.internal_account_id) || void 0,
        thesis: c.thesis_id ? T.get(c.thesis_id) : null
      }));
    },
    staleTime: 6e4
  }), n = o.channel(`positions:${e}`).on(
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
      var r;
      return (r = n == null ? void 0 : n.unsubscribe) == null ? void 0 : r.call(n);
    }
  };
}
function N(e) {
  const t = m(), o = y.trades(e), i = q(), s = g({
    queryKey: o,
    queryFn: async () => {
      const { data: n, error: r } = await t.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (r) throw r;
      return n || [];
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
    () => i.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var n;
      return (n = a == null ? void 0 : a.unsubscribe) == null ? void 0 : n.call(a);
    }
  };
}
async function U(e) {
  const {
    supabaseUrl: t,
    supabaseAnon: o,
    supabaseClient: i,
    query: s
  } = e, a = i ?? M(t, o), n = new C({
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
      l.provide(A, a), l.use(F, { queryClient: n });
    }
  };
}
export {
  A as SUPABASE,
  U as createCore,
  K as fetchUserAccessibleAccounts,
  y as queryKeys,
  E as usePositionsQuery,
  m as useSupabase,
  x as useThesisQuery,
  N as useTradesQuery
};
