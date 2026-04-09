import { useQueryClient as P, useQuery as E } from "@tanstack/vue-query";
import { useSupabase as Q, fetchUserAccessibleAccounts as F } from "./index.js";
const S = {
  details: (n, t) => ["currentPosition", n, t]
};
function K(n, t) {
  const i = Q(), w = P(), g = S.details(n, t), q = E({
    queryKey: g,
    queryFn: async () => {
      const o = t == null ? void 0 : t.trim();
      if (!o)
        return console.log("⚠️ No symbol provided, returning empty array"), [];
      console.log("🔍 [CurrentPosition] Querying with:", {
        userId: n || "none (all accounts)",
        symbolName: o
      });
      const a = await F(i, n);
      n && a.length === 0 ? console.log("⚠️ User has no account access restrictions - showing all accounts") : a.length > 0 && console.log("🔒 User has access to accounts:", a);
      const { data: c, error: l } = await i.schema("fund_ai").from("p_positions_positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
      if (l)
        throw console.error("❌ Error fetching latest fetched_at:", l), l;
      if (!c || !c.fetched_at)
        return console.log("⚠️ No positions found in database"), [];
      const h = c.fetched_at;
      console.log("📅 Latest fetched_at:", h);
      let u = i.schema("fund_ai").from("p_positions_positions").select("*").eq("fetched_at", h).eq("asset_class", "STK").eq("symbol", `${o}`).order("symbol", { ascending: !0 });
      a.length > 0 && (u = u.in("internal_account_id", a));
      const { data: r, error: d } = await u;
      if (d)
        throw console.error("❌ Error fetching positions:", d), d;
      if (!r || r.length === 0)
        return console.log("📊 No positions found matching criteria"), [];
      console.log(`✅ Found ${r.length} position(s) matching symbol "${o}"`);
      const p = Array.from(
        new Set(r.map((e) => e.internal_account_id))
      ), [_, f] = await Promise.all([
        i.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity").in("internal_account_id", p),
        n ? i.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", n).in("internal_account_id", p) : { data: [], error: null }
      ]);
      _.error && console.warn("⚠️ Error fetching account names:", _.error), f.error && console.warn("⚠️ Error fetching account aliases:", f.error);
      const b = new Map(
        (_.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), m = new Map(
        (f.data || []).map((e) => [e.internal_account_id, e.alias])
      ), A = r.map((e) => {
        let y = b.get(e.internal_account_id);
        return m.has(e.internal_account_id) && (y = m.get(e.internal_account_id)), {
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
  }), s = i.channel(`instrument-details:${t}`).on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_positions_positions",
      event: "*"
    },
    () => {
      console.log("🔄 Positions table changed, invalidating instrument details query"), w.invalidateQueries({ queryKey: g });
    }
  ).subscribe();
  return {
    ...q,
    _cleanup: () => {
      var o;
      console.log("🧹 Cleaning up instrument details subscription"), (o = s == null ? void 0 : s.unsubscribe) == null || o.call(s);
    }
  };
}
export {
  S as currentPositionQueryKeys,
  K as useCurrentPositionQuery
};
