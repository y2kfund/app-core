import { useQueryClient as P, useQuery as E } from "@tanstack/vue-query";
import { useSupabase as Q, fetchUserAccessibleAccounts as F } from "./index.js";
const S = {
  details: (n, t) => ["currentPosition", n, t]
};
function K(n, t) {
  const s = Q(), w = P(), _ = S.details(n, t), q = E({
    queryKey: _,
    queryFn: async () => {
      const o = t == null ? void 0 : t.trim();
      if (!o)
        return console.log("⚠️ No symbol provided, returning empty array"), [];
      console.log("🔍 [CurrentPosition] Querying with:", {
        userId: n || "none (all accounts)",
        symbolName: o
      });
      const r = await F(s, n);
      n && r.length === 0 ? console.log("⚠️ User has no account access restrictions - showing all accounts") : r.length > 0 && console.log("🔒 User has access to accounts:", r);
      const { data: a, error: l } = await s.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
      if (l)
        throw console.error("❌ Error fetching latest fetched_at:", l), l;
      if (!a || !a.fetched_at)
        return console.log("⚠️ No positions found in database"), [];
      const g = a.fetched_at;
      console.log("📅 Latest fetched_at:", g);
      let u = s.schema("hf").from("positions").select("*").eq("fetched_at", g).eq("asset_class", "STK").eq("symbol", `${o}`).order("symbol", { ascending: !0 });
      r.length > 0 && (u = u.in("internal_account_id", r));
      const { data: c, error: d } = await u;
      if (d)
        throw console.error("❌ Error fetching positions:", d), d;
      if (!c || c.length === 0)
        return console.log("📊 No positions found matching criteria"), [];
      console.log(`✅ Found ${c.length} position(s) matching symbol "${o}"`);
      const m = Array.from(
        new Set(c.map((e) => e.internal_account_id))
      ), [h, f] = await Promise.all([
        s.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity").in("internal_account_id", m),
        n ? s.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n).in("internal_account_id", m) : { data: [], error: null }
      ]);
      h.error && console.warn("⚠️ Error fetching account names:", h.error), f.error && console.warn("⚠️ Error fetching account aliases:", f.error);
      const b = new Map(
        (h.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), p = new Map(
        (f.data || []).map((e) => [e.internal_account_id, e.alias])
      ), A = c.map((e) => {
        let y = b.get(e.internal_account_id);
        return p.has(e.internal_account_id) && (y = p.get(e.internal_account_id)), {
          ...e,
          legal_entity: y
        };
      });
      return console.log("✅ Successfully enriched positions with account info"), A;
    },
    enabled: !!t && t.trim().length > 0,
    // Only run if symbol provided
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
    // Retry failed queries up to 2 times
  }), i = s.channel(`instrument-details:${t}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => {
      console.log("🔄 Positions table changed, invalidating instrument details query"), w.invalidateQueries({ queryKey: _ });
    }
  ).subscribe();
  return {
    ...q,
    _cleanup: () => {
      var o;
      console.log("🧹 Cleaning up instrument details subscription"), (o = i == null ? void 0 : i.unsubscribe) == null || o.call(i);
    }
  };
}
export {
  S as currentPositionQueryKeys,
  K as useCurrentPositionQuery
};
