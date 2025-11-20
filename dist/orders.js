import { useQueryClient as b, useQuery as A } from "@tanstack/vue-query";
import { useSupabase as Q, queryKeys as F, fetchUserAccessibleAccounts as M } from "./index.js";
function R(u, l, i) {
  const a = Q(), d = F.orders(u), y = b(), p = A({
    queryKey: d,
    queryFn: async () => {
      var h, g;
      const r = await M(a, l), s = await a.schema("hf").from("orders").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (s.error)
        throw console.error("❌ Max fetched_at query error:", s.error), s.error;
      if (!s.data || s.data.length === 0)
        return console.log("⚠️ No orders found in database"), [];
      const f = s.data[0].fetched_at;
      let t = a.schema("hf").from("orders").select("*").eq("fetched_at", f);
      r.length > 0 ? (console.log("🔒 Applying access filter for accounts:", r), t = t.in("internal_account_id", r)) : console.log("🔓 No access filter applied - showing all orders"), i && i.trim() !== "" && (console.log("🔍 Filtering orders for symbol root:", i), t = t.ilike("symbol", `${i}%`)), t = t.order('"tradeDate"', { ascending: !1 });
      const [c, n, q] = await Promise.all([
        t,
        a.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        l ? a.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", l) : { data: [], error: null }
      ]);
      if (c.error)
        throw console.error("❌ Orders query error:", c.error), c.error;
      if (n.error)
        throw console.error("❌ Accounts query error:", n.error), n.error;
      console.log("✅ Orders query success:", {
        latestFetchedAt: f,
        ordersCount: (h = c.data) == null ? void 0 : h.length,
        accountsCount: (g = n.data) == null ? void 0 : g.length,
        filtered: r.length > 0,
        accessibleAccounts: r.length > 0 ? r : "all"
      });
      const w = new Map(
        (n.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), _ = new Map(
        (q.data || []).map((e) => [e.internal_account_id, e.alias])
      );
      return (c.data || []).map((e) => {
        let m = w.get(e.internal_account_id) || void 0;
        return _.has(e.internal_account_id) && (m = _.get(e.internal_account_id)), {
          ...e,
          legal_entity: m
        };
      });
    },
    staleTime: 6e4
  }), o = a.channel(`orders:${u}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "orders",
      event: "*"
    },
    () => y.invalidateQueries({ queryKey: d })
  ).subscribe();
  return {
    ...p,
    _cleanup: () => {
      var r;
      (r = o == null ? void 0 : o.unsubscribe) == null || r.call(o);
    }
  };
}
export {
  R as useOrderQuery
};
