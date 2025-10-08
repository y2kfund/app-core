import { inject as F } from "vue";
import { useQuery as g, useQueryClient as T, QueryClient as K, VueQueryPlugin as E } from "@tanstack/vue-query";
import { createClient as M } from "@supabase/supabase-js";
const v = Symbol.for("y2kfund.supabase"), q = {
  positions: (e, t) => ["positions", e, t],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e],
  thesis: () => ["thesis"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function m() {
  const e = F(v, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function P() {
  const e = m();
  return g({
    queryKey: ["currentUserAccess"],
    queryFn: async () => {
      const { data: { user: c }, error: r } = await e.auth.getUser();
      if (r)
        return console.error("❌ Error fetching current user:", r), [];
      if (!c)
        return console.log("⚠️ No user logged in, showing all positions"), [];
      console.log("👤 Current user ID:", c.id);
      const { data: s, error: o } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", c.id).eq("is_active", !0);
      if (o)
        return console.error("❌ Error fetching user account access:", o), [];
      if (!s || s.length === 0)
        return console.log("⚠️ No account access found for user, showing all positions"), [];
      const i = s.map((a) => a.internal_account_id);
      return console.log("✅ User has access to accounts:", i), i;
    },
    staleTime: 3e5,
    // 5 minutes - access doesn't change often
    retry: 1
    // Only retry once on failure
  });
}
function N() {
  const e = m(), t = q.thesis();
  return g({
    queryKey: t,
    queryFn: async () => {
      const { data: r, error: s } = await e.schema("hf").from("thesis").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return r || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function x(e) {
  var d;
  const t = m(), c = T(), { data: r, isLoading: s } = P(), o = q.positions(e, ((d = r == null ? void 0 : r.value) == null ? void 0 : d.join(",")) || null), i = g({
    queryKey: o,
    queryFn: async () => {
      var w, b, A;
      const u = (r == null ? void 0 : r.value) || [];
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        accessibleAccountIds: u.length > 0 ? u : "all"
      });
      const l = await t.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (l.error)
        throw console.error("❌ Max fetched_at query error:", l.error), l.error;
      if (!l.data || l.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const _ = l.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", _);
      let h = t.schema("hf").from("positions").select("*").eq("fetched_at", _);
      u.length > 0 ? (console.log("🔒 Applying access filter for accounts:", u), h = h.in("internal_account_id", u)) : console.log("🔓 No access filter applied - showing all positions"), h = h.order("symbol");
      const [f, p, y] = await Promise.all([
        h,
        t.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        t.schema("hf").from("thesis").select("id, title, description")
      ]);
      if (f.error)
        throw console.error("❌ Positions query error:", f.error), f.error;
      if (p.error)
        throw console.error("❌ Accounts query error:", p.error), p.error;
      if (y.error)
        throw console.error("❌ Thesis query error:", y.error), y.error;
      console.log("✅ Positions query success:", {
        latestFetchedAt: _,
        positionsCount: (w = f.data) == null ? void 0 : w.length,
        accountsCount: (b = p.data) == null ? void 0 : b.length,
        thesisCount: (A = y.data) == null ? void 0 : A.length,
        filtered: u.length > 0
      });
      const C = new Map(
        (p.data || []).map((n) => [n.internal_account_id, n.legal_entity])
      ), Q = new Map(
        (y.data || []).map((n) => [n.id, { id: n.id, title: n.title, description: n.description }])
      );
      return (f.data || []).map((n) => ({
        ...n,
        legal_entity: C.get(n.internal_account_id) || void 0,
        thesis: n.thesis_id ? Q.get(n.thesis_id) : null
      }));
    },
    staleTime: 6e4,
    enabled: !s
    // Wait for access check to complete
  }), a = t.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => c.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...i,
    _cleanup: () => {
      var u;
      return (u = a == null ? void 0 : a.unsubscribe) == null ? void 0 : u.call(a);
    }
  };
}
function D(e) {
  const t = m(), c = q.trades(e), r = T(), s = g({
    queryKey: c,
    queryFn: async () => {
      const { data: i, error: a } = await t.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (a) throw a;
      return i || [];
    },
    staleTime: 6e4
  }), o = t.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => r.invalidateQueries({ queryKey: c })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var i;
      return (i = o == null ? void 0 : o.unsubscribe) == null ? void 0 : i.call(o);
    }
  };
}
async function L(e) {
  const {
    supabaseUrl: t,
    supabaseAnon: c,
    supabaseClient: r,
    query: s
  } = e, o = r ?? M(t, c), i = new K({
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
    install(d) {
      d.provide(v, o), d.use(E, { queryClient: i });
    }
  };
}
export {
  v as SUPABASE,
  L as createCore,
  q as queryKeys,
  x as usePositionsQuery,
  m as useSupabase,
  N as useThesisQuery,
  D as useTradesQuery,
  P as useUserAccountAccess
};
