import { useQueryClient as w, useQuery as C } from "@tanstack/vue-query";
import { useSupabase as A, queryKeys as P, fetchUserAccessibleAccounts as D } from "./index.js";
function R(u, i, l) {
  const a = A(), y = P.trades(u), m = w(), p = C({
    queryKey: y,
    queryFn: async () => {
      var _, h;
      const e = await D(a, i);
      console.log("Querying trades with config:", {
        accountId: u,
        schema: "hf",
        table: "trades",
        userId: i || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const n = await a.schema("hf").from("trades").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (n.error)
        throw console.error("❌ Max fetched_at query error:", n.error), n.error;
      if (!n.data || n.data.length === 0)
        return console.log("⚠️ No trades found in database"), [];
      const d = n.data[0].fetched_at;
      console.log("📅 Latest fetched_at:", d), console.log("Trades fetch for these fields: ", {
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
      let r = a.schema("hf").from("trades").select(`
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
        `).eq("fetched_at", d);
      e.length > 0 ? (console.log("🔒 Applying access filter for accounts:", e), r = r.in("internal_account_id", e)) : console.log("🔓 No access filter applied - showing all trades"), l && l.trim() !== "" && (console.log("🔍 Filtering trades for symbol root:", l), r = r.ilike("symbol", `${l}%`)), r = r.order('"tradeDate"', { ascending: !1 });
      const [o, s, b] = await Promise.all([
        r,
        a.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        i ? a.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", i) : { data: [], error: null }
      ]);
      if (o.error)
        throw console.error("❌ Trades query error:", o.error), o.error;
      if (s.error)
        throw console.error("❌ Accounts query error:", s.error), s.error;
      console.log("✅ Trades query success:", {
        latestFetchedAt: d,
        tradesCount: (_ = o.data) == null ? void 0 : _.length,
        accountsCount: (h = s.data) == null ? void 0 : h.length,
        filtered: e.length > 0,
        accessibleAccounts: e.length > 0 ? e : "all"
      });
      const q = new Map(
        (s.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      ), f = new Map(
        (b.data || []).map((t) => [t.internal_account_id, t.alias])
      );
      return (o.data || []).map((t) => {
        let g = q.get(t.internal_account_id) || void 0;
        return f.has(t.internal_account_id) && (g = f.get(t.internal_account_id)), {
          ...t,
          legal_entity: g
        };
      });
    },
    staleTime: 6e4
  }), c = a.channel(`trades:${u}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*"
    },
    () => m.invalidateQueries({ queryKey: y })
  ).subscribe();
  return {
    ...p,
    _cleanup: () => {
      var e;
      (e = c == null ? void 0 : c.unsubscribe) == null || e.call(c);
    }
  };
}
export {
  R as useTradeQuery
};
