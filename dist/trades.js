import { useQueryClient as b, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as w, queryKeys as A, fetchUserAccessibleAccounts as C } from "./index.js";
function M(l, o, i) {
  const r = w(), u = A.trades(l), f = b(), h = q({
    queryKey: u,
    queryFn: async () => {
      var y, _;
      const e = await C(r, o);
      console.log("Querying trades with config:", {
        accountId: l,
        schema: "hf",
        table: "trades",
        userId: o || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
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
          "contract_quantity",
          "accounting_quantity",
          "underlyingConid",
          "tradeMoney"
        `);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), a = a.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), i && i.trim() !== "" && (console.log("🔍 Filtering trades for symbol root:", i), a = a.ilike("symbol", `${i}%`)), a = a.order('"tradeDate"', { ascending: !1 });
      const [s, c, m] = await Promise.all([
        a,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o ? r.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      if (s.error)
        throw console.error("❌ Trades query error:", s.error), s.error;
      if (c.error)
        throw console.error("❌ Accounts query error:", c.error), c.error;
      console.log("✅ Trades query success:", {
        tradesCount: (y = s.data) == null ? void 0 : y.length,
        accountsCount: (_ = c.data) == null ? void 0 : _.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const p = new Map(
        (c.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), d = new Map(
        (m.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (s.data || []).map((t) => {
        let g = p.get(t.internal_account_id) || void 0;
        return d.has(t.internal_account_id) && (g = d.get(t.internal_account_id)), {
          ...t,
          legal_entity: g
        };
      });
    },
    staleTime: 6e4
  }), n = r.channel(`trades:${l}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*"
    },
    () => f.invalidateQueries({ queryKey: u })
  ).subscribe();
  return {
    ...h,
    _cleanup: () => {
      var e;
      (e = n == null ? void 0 : n.unsubscribe) == null || e.call(n);
    }
  };
}
export {
  M as useTradeQuery
};
