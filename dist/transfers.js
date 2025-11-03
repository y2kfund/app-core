import { useQueryClient as A, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as w, queryKeys as T, fetchUserAccessibleAccounts as D } from "./index.js";
function C(l, i) {
  const r = w(), d = T.transfers(l), m = A(), p = q({
    queryKey: d,
    queryFn: async () => {
      var y, h;
      const e = await D(r, i);
      console.log("🔍 Querying transfers with config:", {
        accountId: l,
        schema: "hf",
        table: "transfers",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const n = await r.schema("hf").from("transfers").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (n.error)
        throw console.error("❌ Max fetched_at query error:", n.error), n.error;
      if (!n.data || n.data.length === 0)
        return console.log("⚠️ No transfers found in database"), [];
      const u = n.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u);
      let a = r.schema("hf").from("transfers").select(`
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
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), a = a.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all transfers"), a = a.order('"dateTime"', { ascending: !1 });
      const [o, c, _] = await Promise.all([
        a,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        i ? r.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (o.error)
        throw console.error("❌ Transfers query error:", o.error), o.error;
      if (c.error)
        throw console.error("❌ Accounts query error:", c.error), c.error;
      console.log("✅ Transfers query success:", {
        latestFetchedAt: u,
        transfersCount: (y = o.data) == null ? void 0 : y.length,
        accountsCount: (h = c.data) == null ? void 0 : h.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (c.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), f = new Map(
        (_.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (o.data || []).map((t) => {
        let g = b.get(t.internal_account_id) || void 0;
        return f.has(t.internal_account_id) && (g = f.get(t.internal_account_id)), {
          ...t,
          legal_entity: g
        };
      });
    },
    staleTime: 6e4
  }), s = r.channel(`transfers:${l}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "transfers",
      event: "*"
    },
    () => m.invalidateQueries({ queryKey: d })
  ).subscribe();
  return {
    ...p,
    _cleanup: () => {
      var e;
      (e = s == null ? void 0 : s.unsubscribe) == null || e.call(s);
    }
  };
}
export {
  C as useTransfersQuery
};
