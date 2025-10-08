import { useQueryClient as u, useQuery as y } from "@tanstack/vue-query";
import { useSupabase as l, queryKeys as d, fetchUserAccessibleAccounts as b } from "./index.js";
function h(e, c) {
  const r = l(), a = d.trades(e), n = u(), o = y({
    queryKey: a,
    queryFn: async () => {
      if (c && !(await b(r, c)).includes(e))
        throw new Error("Access denied to this account");
      const { data: t, error: i } = await r.schema("hf").from("trades").select(`
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
        `).eq("internal_account_id", e).order('"tradeDate"', { ascending: !1 });
      if (i) throw i;
      return t || [];
    },
    staleTime: 6e4
  }), s = r.channel(`trades_${e}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "trades",
      event: "*",
      filter: `internal_account_id=eq.${e}`
    },
    () => n.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...o,
    _cleanup: () => {
      var t;
      (t = s == null ? void 0 : s.unsubscribe) == null || t.call(s);
    }
  };
}
export {
  h as useTradesQuery
};
