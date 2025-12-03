import { useQueryClient as A, useQuery as k } from "@tanstack/vue-query";
import { useSupabase as F, queryKeys as Q, fetchUserAccessibleAccounts as S } from "./index.js";
function v(g, n, s) {
  const a = F(), _ = Q.orders(g), y = A(), w = k({
    queryKey: _,
    queryFn: async () => {
      var f, m;
      const r = await S(a, n);
      let t = a.schema("hf").from("orders").select("*");
      r.length > 0 ? (console.log("🔒 Applying access filter for accounts:", r), t = t.in("internal_account_id", r)) : console.log("🔓 No access filter applied - showing all orders"), s && s.trim() !== "" && (console.log("🔍 Filtering orders for symbol root:", s), t = t.ilike("symbol", `${s}%`)), t = t.order('"tradeDate"', { ascending: !1 });
      let d = /* @__PURE__ */ new Set();
      if (n && s)
        try {
          const e = `%|${s}|%|STK|%`;
          console.log("🔍 Fetching attached orders with pattern:", e);
          const { data: o, error: u } = await a.schema("hf").from("position_order_mappings").select("order_id").eq("user_id", n).like("mapping_key", e);
          console.log("🔍 Fetched position-order mappings:", o), u ? console.error("⚠️ Error fetching position-order mappings:", u) : o && o.length > 0 && (o.forEach((h) => {
            h.order_id && d.add(String(h.order_id));
          }), console.log(`✅ Found ${d.size} attached orders`));
        } catch (e) {
          console.error("⚠️ Error checking attached orders:", e);
        }
      const [i, l, q] = await Promise.all([
        t,
        a.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        n ? a.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
      ]);
      if (i.error)
        throw console.error("❌ Orders query error:", i.error), i.error;
      if (l.error)
        throw console.error("❌ Accounts query error:", l.error), l.error;
      console.log("✅ Orders query success:", {
        ordersCount: (f = i.data) == null ? void 0 : f.length,
        accountsCount: (m = l.data) == null ? void 0 : m.length,
        attachedCount: d.size,
        filtered: r.length > 0,
        accessibleAccounts: r.length > 0 ? r : "all"
      });
      const b = new Map(
        (l.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), p = new Map(
        (q.data || []).map((e) => [e.internal_account_id, e.alias])
      );
      return (i.data || []).map((e) => {
        let o = b.get(e.internal_account_id) || void 0;
        p.has(e.internal_account_id) && (o = p.get(e.internal_account_id));
        const u = String(e.id), h = d.has(u);
        return {
          ...e,
          legal_entity: o,
          isAttached: h
        };
      });
    },
    staleTime: 6e4
  }), c = a.channel(`orders:${g}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "orders",
      event: "*"
    },
    () => y.invalidateQueries({ queryKey: _ })
  ).subscribe();
  return {
    ...w,
    _cleanup: () => {
      var r;
      (r = c == null ? void 0 : c.unsubscribe) == null || r.call(c);
    }
  };
}
export {
  v as useOrderQuery
};
