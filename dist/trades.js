import { useQueryClient as _, useQuery as p } from "@tanstack/vue-query";
import { useSupabase as b, queryKeys as q, fetchUserAccessibleAccounts as w } from "./index.js";
function P(l, d) {
  const r = b(), u = q.trades(l), y = _(), g = p({
    queryKey: u,
    queryFn: async () => {
      var f, h;
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
      let s = r.schema("hf").from("trades").select(`
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
          "closePrice"
          underlyingSymbol,
          "putCall",
          strike,
          expiry,
          "tradeID",
          conid,
          "underlyingConid"
        `).eq("fetched_at", i);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), s = s.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), s = s.order('"tradeDate"', { ascending: !1 });
      const [o, c] = await Promise.all([
        s,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity")
      ]);
      if (o.error)
        throw console.error("❌ Trades query error:", o.error), o.error;
      if (c.error)
        throw console.error("❌ Accounts query error:", c.error), c.error;
      console.log("✅ Trades query success:", {
        latestFetchedAt: i,
        tradesCount: (f = o.data) == null ? void 0 : f.length,
        accountsCount: (h = c.data) == null ? void 0 : h.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const m = new Map(
        (c.data || []).map((n) => [n.internal_account_id, n.legal_entity])
      );
      return (o.data || []).map((n) => ({
        ...n,
        legal_entity: m.get(n.internal_account_id) || void 0
      }));
    },
    staleTime: 6e4
  }), a = r.channel(`trades:${l}`).on(
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
      (e = a == null ? void 0 : a.unsubscribe) == null || e.call(a);
    }
  };
}
export {
  P as useTradesQuery
};
