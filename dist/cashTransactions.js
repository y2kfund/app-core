import { useQueryClient as w, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as T, queryKeys as A, fetchUserAccessibleAccounts as D } from "./index.js";
function Q(l, i) {
  const a = T(), d = A.cashTransactions(l), g = w(), m = q({
    queryKey: d,
    queryFn: async () => {
      var y, f;
      const e = await D(a, i);
      console.log("🔍 Querying cash transactions with config:", {
        accountId: l,
        schema: "hf",
        table: "cash_transaction",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const s = await a.schema("hf").from("cash_transaction").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (s.error)
        throw console.error("❌ Max fetched_at query error:", s.error), s.error;
      if (!s.data || s.data.length === 0)
        return console.log("⚠️ No cash transactions found in database"), [];
      const u = s.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u);
      let c = a.schema("hf").from("cash_transaction").select(`
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
      const [r, o, p] = await Promise.all([
        c,
        a.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        i ? a.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (r.error)
        throw console.error("❌ Cash transactions query error:", r.error), r.error;
      if (o.error)
        throw console.error("❌ Accounts query error:", o.error), o.error;
      console.log("✅ Cash transactions query success:", {
        latestFetchedAt: u,
        cashTransactionsCount: (y = r.data) == null ? void 0 : y.length,
        accountsCount: (f = o.data) == null ? void 0 : f.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (o.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), h = new Map(
        (p.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (r.data || []).map((t) => {
        let _ = b.get(t.internal_account_id) || void 0;
        return h.has(t.internal_account_id) && (_ = h.get(t.internal_account_id)), {
          ...t,
          legal_entity: _
        };
      });
    },
    staleTime: 6e4
  }), n = a.channel(`cash_transaction:${l}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "cash_transaction",
      event: "*"
    },
    () => g.invalidateQueries({ queryKey: d })
  ).subscribe();
  return {
    ...m,
    _cleanup: () => {
      var e;
      (e = n == null ? void 0 : n.unsubscribe) == null || e.call(n);
    }
  };
}
export {
  Q as useCashTransactionsQuery
};
