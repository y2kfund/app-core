import { inject as F } from "vue";
import { useQuery as y, useQueryClient as v, QueryClient as K, VueQueryPlugin as E } from "@tanstack/vue-query";
import { createClient as M } from "@supabase/supabase-js";
const T = Symbol.for("y2kfund.supabase"), w = {
  positions: (e, o) => ["positions", e, o],
  trades: (e) => ["trades", e],
  nlvMargin: (e) => ["nlvMargin", e],
  thesis: () => ["thesis"],
  userAccountAccess: (e) => ["userAccountAccess", e]
};
function m() {
  const e = F(T, null);
  if (!e) throw new Error("[@y2kfund/core] Supabase client not found. Did you install createCore()?");
  return e;
}
function P() {
  const e = m();
  return y({
    queryKey: ["currentUserAccess"],
    queryFn: async () => {
      try {
        const { data: { session: a } } = await e.auth.getSession();
        if (!a)
          return console.log("⚠️ No active session, showing all positions"), [];
        const { data: { user: t }, error: s } = await e.auth.getUser();
        if (s)
          return console.warn("⚠️ Auth error (showing all positions):", s.message), [];
        if (!t)
          return console.log("⚠️ No user logged in, showing all positions"), [];
        console.log("👤 Current user ID:", t.id);
        const { data: r, error: c } = await e.schema("hf").from("user_account_access").select("internal_account_id").eq("user_id", t.id).eq("is_active", !0);
        if (c)
          return console.error("❌ Error fetching user account access:", c), [];
        if (!r || r.length === 0)
          return console.log("⚠️ No account access found for user, showing all positions"), [];
        const n = r.map((l) => l.internal_account_id);
        return console.log("✅ User has access to accounts:", n), n;
      } catch (a) {
        return console.warn("⚠️ Error in access control (showing all positions):", a), [];
      }
    },
    staleTime: 3e5,
    // 5 minutes - access doesn't change often
    retry: 1
    // Only retry once on failure
  });
}
function O() {
  const e = m(), o = w.thesis();
  return y({
    queryKey: o,
    queryFn: async () => {
      const { data: t, error: s } = await e.schema("hf").from("thesis").select("*").order("title");
      if (s)
        throw console.error("❌ Thesis query error:", s), s;
      return t || [];
    },
    staleTime: 3e5
    // 5 minutes - thesis data doesn't change often
  });
}
function x(e) {
  var l;
  const o = m(), a = v(), { data: t, isLoading: s } = P(), r = w.positions(e, ((l = t == null ? void 0 : t.value) == null ? void 0 : l.join(",")) || null), c = y({
    queryKey: r,
    queryFn: async () => {
      var q, b, A;
      const u = (t == null ? void 0 : t.value) || [];
      console.log("🔍 Querying positions with config:", {
        accountId: e,
        schema: "hf",
        table: "positions",
        accessibleAccountIds: u.length > 0 ? u : "all"
      });
      const d = await o.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (d.error)
        throw console.error("❌ Max fetched_at query error:", d.error), d.error;
      if (!d.data || d.data.length === 0)
        return console.log("⚠️ No positions found in database"), [];
      const _ = d.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", _);
      let h = o.schema("hf").from("positions").select("*").eq("fetched_at", _);
      u.length > 0 ? (console.log("🔒 Applying access filter for accounts:", u), h = h.in("internal_account_id", u)) : console.log("🔓 No access filter applied - showing all positions"), h = h.order("symbol");
      const [f, g, p] = await Promise.all([
        h,
        o.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o.schema("hf").from("thesis").select("id, title, description")
      ]);
      if (f.error)
        throw console.error("❌ Positions query error:", f.error), f.error;
      if (g.error)
        throw console.error("❌ Accounts query error:", g.error), g.error;
      if (p.error)
        throw console.error("❌ Thesis query error:", p.error), p.error;
      console.log("✅ Positions query success:", {
        latestFetchedAt: _,
        positionsCount: (q = f.data) == null ? void 0 : q.length,
        accountsCount: (b = g.data) == null ? void 0 : b.length,
        thesisCount: (A = p.data) == null ? void 0 : A.length,
        filtered: u.length > 0
      });
      const C = new Map(
        (g.data || []).map((i) => [i.internal_account_id, i.legal_entity])
      ), Q = new Map(
        (p.data || []).map((i) => [i.id, { id: i.id, title: i.title, description: i.description }])
      );
      return (f.data || []).map((i) => ({
        ...i,
        legal_entity: C.get(i.internal_account_id) || void 0,
        thesis: i.thesis_id ? Q.get(i.thesis_id) : null
      }));
    },
    staleTime: 6e4,
    enabled: !s
    // Wait for access check to complete
  }), n = o.channel(`positions:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
      // listen to all changes on positions (no account filter)
    },
    () => a.invalidateQueries({ queryKey: r })
  ).subscribe();
  return {
    ...c,
    _cleanup: () => {
      var u;
      return (u = n == null ? void 0 : n.unsubscribe) == null ? void 0 : u.call(n);
    }
  };
}
function D(e) {
  const o = m(), a = w.trades(e), t = v(), s = y({
    queryKey: a,
    queryFn: async () => {
      const { data: c, error: n } = await o.schema("hf").from("trades").select("*").eq("account_id", e).order("trade_date", { ascending: !1 });
      if (n) throw n;
      return c || [];
    },
    staleTime: 6e4
  }), r = o.channel(`trades:${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `account_id=eq.${e}`
    },
    () => t.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...s,
    _cleanup: () => {
      var c;
      return (c = r == null ? void 0 : r.unsubscribe) == null ? void 0 : c.call(r);
    }
  };
}
async function L(e) {
  const {
    supabaseUrl: o,
    supabaseAnon: a,
    supabaseClient: t,
    query: s
  } = e, r = t ?? M(o, a), c = new K({
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
      l.provide(T, r), l.use(E, { queryClient: c });
    }
  };
}
export {
  T as SUPABASE,
  L as createCore,
  w as queryKeys,
  x as usePositionsQuery,
  m as useSupabase,
  O as useThesisQuery,
  D as useTradesQuery,
  P as useUserAccountAccess
};
