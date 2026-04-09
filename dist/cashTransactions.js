import { useQueryClient as w, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as T, queryKeys as A, fetchUserAccessibleAccounts as D } from "./index.js";
function Q(l, i) {
  const t = T(), d = A.cashTransactions(l), g = w(), p = q({
    queryKey: d,
    queryFn: async () => {
      var h, y;
      const e = await D(t, i);
      console.log("🔍 Querying cash transactions with config:", {
        accountId: l,
        schema: "fund_ai",
        table: "p_trades_cash_transactions",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const s = await t.schema("fund_ai").from("p_trades_cash_transactions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (s.error)
        throw console.error("❌ Max fetched_at query error:", s.error), s.error;
      if (!s.data || s.data.length === 0)
        return console.log("⚠️ No cash transactions found in database"), [];
      const u = s.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u);
      let c = t.schema("fund_ai").from("p_trades_cash_transactions").select(`
          id,
          internal_account_id,
          fetched_at,
          "accountId",
          "acctAlias",
          model,
          currency,
          "fxRateToBase",
          "assetCategory",
          "subCategory",
          symbol,
          description,
          conid,
          "securityID",
          "securityIDType",
          cusip,
          isin,
          figi,
          "listingExchange",
          "underlyingConid",
          "underlyingSymbol",
          "underlyingSecurityID",
          "underlyingListingExchange",
          issuer,
          "issuerCountryCode",
          multiplier,
          strike,
          expiry,
          "putCall",
          "principalAdjustFactor",
          "dateTime",
          "settleDate",
          "availableForTradingDate",
          "reportDate",
          "exDate",
          amount,
          type,
          "tradeID",
          code,
          "transactionID",
          "clientReference",
          "actionID",
          "levelOfDetail",
          "serialNumber",
          "deliveryType",
          "commodityType",
          fineness,
          weight
        `).eq("fetched_at", u);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), c = c.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all cash transactions"), c = c.order('"dateTime"', { ascending: !1 });
      const [r, o, m] = await Promise.all([
        c,
        t.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity"),
        i ? t.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (r.error)
        throw console.error("❌ Cash transactions query error:", r.error), r.error;
      if (o.error)
        throw console.error("❌ Accounts query error:", o.error), o.error;
      console.log("✅ Cash transactions query success:", {
        latestFetchedAt: u,
        cashTransactionsCount: (h = r.data) == null ? void 0 : h.length,
        accountsCount: (y = o.data) == null ? void 0 : y.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (o.data || []).map((a) => [a.internal_account_id, a.legal_entity])
      ), _ = new Map(
        (m.data || []).map((a) => [a.internal_account_id, a.alias])
      );
      return (r.data || []).map((a) => {
        let f = b.get(a.internal_account_id) || void 0;
        return _.has(a.internal_account_id) && (f = _.get(a.internal_account_id)), {
          ...a,
          legal_entity: f
        };
      });
    },
    staleTime: 6e4
  }), n = t.channel(`p_trades_cash_transactions:${l}`).on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_trades_cash_transactions",
      event: "*"
    },
    () => g.invalidateQueries({ queryKey: d })
  ).subscribe();
  return {
    ...p,
    _cleanup: () => {
      var e;
      (e = n == null ? void 0 : n.unsubscribe) == null || e.call(n);
    }
  };
}
export {
  Q as useCashTransactionsQuery
};
