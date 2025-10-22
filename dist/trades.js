import { useQueryClient as m, useQuery as b } from "@tanstack/vue-query";
import { useSupabase as p, queryKeys as q, fetchUserAccessibleAccounts as w } from "./index.js";
function v(l, d) {
  const r = p(), u = q.trades(l), y = m(), g = b({
    queryKey: u,
    queryFn: async () => {
      var h, f;
      const e = await w(r, d);
      console.log("🔍 Querying trades with config:", {
        accountId: l,
        schema: "hf",
        table: "trades",
        userId: d || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const t = await r.schema("hf").from("trades").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (t.error)
        throw console.error("❌ Max fetched_at query error:", t.error), t.error;
      if (!t.data || t.data.length === 0)
        return console.log("⚠️ No trades found in database"), [];
      const i = t.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", i);
      let a = r.schema("hf").from("trades").select(`
          id,
          "accountId",
          internal_account_id,
          symbol,
          "assetCategory",
          quantity,
          "tradePrice",
          "buySell",
          "tradeDate",
          "settleDateTarget",
          "ibCommission",
          fetched_at,
          description,
          currency,
          "netCash",
          proceeds
        `).eq("fetched_at", i);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), a = a.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), a = a.order('"tradeDate"', { ascending: !1 });
      const [c, o] = await Promise.all([
        a,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity")
      ]);
      if (c.error)
        throw console.error("❌ Trades query error:", c.error), c.error;
      if (o.error)
        throw console.error("❌ Accounts query error:", o.error), o.error;
      console.log("✅ Trades query success:", {
        latestFetchedAt: i,
        tradesCount: (h = c.data) == null ? void 0 : h.length,
        accountsCount: (f = o.data) == null ? void 0 : f.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const _ = new Map(
        (o.data || []).map((n) => [n.internal_account_id, n.legal_entity])
      );
      return (c.data || []).map((n) => ({
        ...n,
        legal_entity: _.get(n.internal_account_id) || void 0
      }));
    },
    staleTime: 6e4
  }), s = r.channel(`trades:${l}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*"
    },
    () => y.invalidateQueries({ queryKey: u })
  ).subscribe();
  return {
    ...g,
    _cleanup: () => {
      var e;
      (e = s == null ? void 0 : s.unsubscribe) == null || e.call(s);
    }
  };
}
export {
  v as useTradesQuery
};
