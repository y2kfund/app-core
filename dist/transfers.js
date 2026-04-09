import { useQueryClient as A, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as w, queryKeys as T, fetchUserAccessibleAccounts as D } from "./index.js";
function C(l, i) {
  const r = w(), d = T.transfers(l), g = A(), m = q({
    queryKey: d,
    queryFn: async () => {
      var _, y;
      const e = await D(r, i);
      console.log("🔍 Querying transfers with config:", {
        accountId: l,
        schema: "fund_ai",
        table: "p_trades_transfers",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const n = await r.schema("fund_ai").from("p_trades_transfers").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (n.error)
        throw console.error("❌ Max fetched_at query error:", n.error), n.error;
      if (!n.data || n.data.length === 0)
        return console.log("⚠️ No transfers found in database"), [];
      const u = n.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u);
      let s = r.schema("fund_ai").from("p_trades_transfers").select(`
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
          "reportDate",
          date,
          "dateTime",
          "settleDate",
          type,
          direction,
          company,
          account,
          "accountName",
          "deliveringBroker",
          quantity,
          "transferPrice",
          "positionAmount",
          "positionAmountInBase",
          "pnlAmount",
          "pnlAmountInBase",
          "cashTransfer",
          code,
          "clientReference",
          "transactionID",
          "levelOfDetail",
          "positionInstructionID",
          "positionInstructionSetID",
          "serialNumber",
          "deliveryType",
          "commodityType",
          fineness,
          weight
        `).eq("fetched_at", u);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), s = s.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all transfers"), s = s.order('"dateTime"', { ascending: !1 });
      const [o, c, h] = await Promise.all([
        s,
        r.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity"),
        i ? r.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (o.error)
        throw console.error("❌ Transfers query error:", o.error), o.error;
      if (c.error)
        throw console.error("❌ Accounts query error:", c.error), c.error;
      console.log("✅ Transfers query success:", {
        latestFetchedAt: u,
        transfersCount: (_ = o.data) == null ? void 0 : _.length,
        accountsCount: (y = c.data) == null ? void 0 : y.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (c.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), f = new Map(
        (h.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (o.data || []).map((t) => {
        let p = b.get(t.internal_account_id) || void 0;
        return f.has(t.internal_account_id) && (p = f.get(t.internal_account_id)), {
          ...t,
          legal_entity: p
        };
      });
    },
    staleTime: 6e4
  }), a = r.channel(`transfers:${l}`).on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_trades_transfers",
      event: "*"
    },
    () => g.invalidateQueries({ queryKey: d })
  ).subscribe();
  return {
    ...m,
    _cleanup: () => {
      var e;
      (e = a == null ? void 0 : a.unsubscribe) == null || e.call(a);
    }
  };
}
export {
  C as useTransfersQuery
};
