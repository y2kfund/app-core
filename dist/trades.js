import { useQueryClient as q, useQuery as w } from "@tanstack/vue-query";
import { useSupabase as A, queryKeys as R, fetchUserAccessibleAccounts as C } from "./index.js";
function x(i, l) {
  const a = A(), u = R.trades(i), g = q(), m = w({
    queryKey: u,
    queryFn: async () => {
      var h, _;
      const e = await C(a, l);
      console.log("🔍 Querying trades with config:", {
        accountId: i,
        schema: "hf",
        table: "trades",
        userId: l || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const r = await a.schema("hf").from("trades").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (r.error)
        throw console.error("❌ Max fetched_at query error:", r.error), r.error;
      if (!r.data || r.data.length === 0)
        return console.log("⚠️ No trades found in database"), [];
      const d = r.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", d);
      let c = a.schema("hf").from("trades").select(`
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
          proceeds,
          "fifoPnlRealized",
          "openCloseIndicator",
          "multiplier",
          "mtmPnl",
          "closePrice",
          underlyingSymbol,
          "putCall",
          strike,
          expiry,
          "tradeID",
          conid,
          "underlyingConid",
          "tradeMoney"
        `).eq("fetched_at", d);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), c = c.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), c = c.order('"tradeDate"', { ascending: !1 });
      const [o, n, p] = await Promise.all([
        c,
        a.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        l ? a.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", l) : { data: [], error: null }
      ]);
      if (o.error)
        throw console.error("❌ Trades query error:", o.error), o.error;
      if (n.error)
        throw console.error("❌ Accounts query error:", n.error), n.error;
      console.log("✅ Trades query success:", {
        latestFetchedAt: d,
        tradesCount: (h = o.data) == null ? void 0 : h.length,
        accountsCount: (_ = n.data) == null ? void 0 : _.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (n.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), f = new Map(
        (p.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (o.data || []).map((t) => {
        let y = b.get(t.internal_account_id) || void 0;
        return f.has(t.internal_account_id) && (y = f.get(t.internal_account_id)), {
          ...t,
          legal_entity: y
        };
      });
    },
    staleTime: 6e4
  }), s = a.channel(`trades:${i}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*"
    },
    () => g.invalidateQueries({ queryKey: u })
  ).subscribe();
  return {
    ...m,
    _cleanup: () => {
      var e;
      (e = s == null ? void 0 : s.unsubscribe) == null || e.call(s);
    }
  };
}
export {
  x as useTradesQuery
};
