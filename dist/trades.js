import { useQueryClient as q, useQuery as w } from "@tanstack/vue-query";
import { useSupabase as C, queryKeys as A, fetchUserAccessibleAccounts as P } from "./index.js";
function Q(l, i) {
  const r = C(), d = A.trades(l), g = q(), m = w({
    queryKey: d,
    queryFn: async () => {
      var f, _;
      const e = await P(r, i);
      console.log("Querying trades with config:", {
        accountId: l,
        schema: "hf",
        table: "trades",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const a = await r.schema("hf").from("trades").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (a.error)
        throw console.error("❌ Max fetched_at query error:", a.error), a.error;
      if (!a.data || a.data.length === 0)
        return console.log("⚠️ No trades found in database"), [];
      const u = a.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", u), console.log("Trades fetch for these fields: ", {
        id: !0,
        accountId: !0,
        internal_account_id: !0,
        symbol: !0,
        assetCategory: !0,
        quantity: !0,
        tradePrice: !0,
        buySell: !0,
        tradeDate: !0,
        settleDateTarget: !0,
        ibCommission: !0,
        fetched_at: !0,
        description: !0,
        currency: !0,
        netCash: !0,
        proceeds: !0,
        fifoPnlRealized: !0,
        openCloseIndicator: !0,
        multiplier: !0,
        mtmPnl: !0,
        closePrice: !0,
        underlyingSymbol: !0,
        putCall: !0,
        strike: !0,
        expiry: !0,
        tradeID: !0,
        conid: !0,
        contract_quantity: !0,
        accounting_quantity: !0,
        underlyingConid: !0,
        tradeMoney: !0
      });
      let o = r.schema("hf").from("trades").select(`
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
        `).eq("fetched_at", u);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), o = o.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), o = o.order('"tradeDate"', { ascending: !1 });
      const [c, s, p] = await Promise.all([
        o,
        r.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        i ? r.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (c.error)
        throw console.error("❌ Trades query error:", c.error), c.error;
      if (s.error)
        throw console.error("❌ Accounts query error:", s.error), s.error;
      console.log("✅ Trades query success:", {
        latestFetchedAt: u,
        tradesCount: (f = c.data) == null ? void 0 : f.length,
        accountsCount: (_ = s.data) == null ? void 0 : _.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const b = new Map(
        (s.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), y = new Map(
        (p.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (c.data || []).map((t) => {
        let h = b.get(t.internal_account_id) || void 0;
        return y.has(t.internal_account_id) && (h = y.get(t.internal_account_id)), {
          ...t,
          legal_entity: h
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
  Q as useTradeQuery
};
