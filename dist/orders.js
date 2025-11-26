import { useQueryClient as k, useQuery as Q } from "@tanstack/vue-query";
import { useSupabase as S, queryKeys as E, fetchUserAccessibleAccounts as K } from "./index.js";
function x(_, n, s) {
  const t = S(), g = E.orders(_), q = k(), A = Q({
    queryKey: g,
    queryFn: async () => {
      var y, w;
      const r = await K(t, n), c = await t.schema("hf").from("orders").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1);
      if (c.error)
        throw console.error("❌ Max fetched_at query error:", c.error), c.error;
      if (!c.data || c.data.length === 0)
        return console.log("⚠️ No orders found in database"), [];
      const p = c.data[0].fetched_at;
      let o = t.schema("hf").from("orders").select("*").eq("fetched_at", p);
      r.length > 0 ? (console.log("🔒 Applying access filter for accounts:", r), o = o.in("internal_account_id", r)) : console.log("🔓 No access filter applied - showing all orders"), s && s.trim() !== "" && (console.log("🔍 Filtering orders for symbol root:", s), o = o.ilike("symbol", `${s}%`)), o = o.order('"tradeDate"', { ascending: !1 });
      let u = /* @__PURE__ */ new Set();
      if (n && s)
        try {
          const e = `%|${s}|%|STK|%`;
          console.log("🔍 Fetching attached orders with pattern:", e);
          const { data: a, error: h } = await t.schema("hf").from("position_order_mappings").select("order_id").eq("user_id", n).like("mapping_key", e);
          console.log("🔍 Fetched position-order mappings:", a), h ? console.error("⚠️ Error fetching position-order mappings:", h) : a && a.length > 0 && (a.forEach((f) => {
            f.order_id && u.add(String(f.order_id));
          }), console.log(`✅ Found ${u.size} attached orders`));
        } catch (e) {
          console.error("⚠️ Error checking attached orders:", e);
        }
      const [l, d, b] = await Promise.all([
        o,
        t.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        n ? t.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
      ]);
      if (l.error)
        throw console.error("❌ Orders query error:", l.error), l.error;
      if (d.error)
        throw console.error("❌ Accounts query error:", d.error), d.error;
      console.log("✅ Orders query success:", {
        latestFetchedAt: p,
        ordersCount: (y = l.data) == null ? void 0 : y.length,
        accountsCount: (w = d.data) == null ? void 0 : w.length,
        attachedCount: u.size,
        filtered: r.length > 0,
        accessibleAccounts: r.length > 0 ? r : "all"
      });
      const F = new Map(
        (d.data || []).map((e) => [e.internal_account_id, e.legal_entity])
      ), m = new Map(
        (b.data || []).map((e) => [e.internal_account_id, e.alias])
      );
      return (l.data || []).map((e) => {
        let a = F.get(e.internal_account_id) || void 0;
        m.has(e.internal_account_id) && (a = m.get(e.internal_account_id));
        const h = String(e.id), f = u.has(h);
        return {
          ...e,
          legal_entity: a,
          isAttached: f
        };
      });
    },
    staleTime: 6e4
  }), i = t.channel(`orders:${_}`).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "orders",
      event: "*"
    },
    () => q.invalidateQueries({ queryKey: g })
  ).subscribe();
  return {
    ...A,
    _cleanup: () => {
      var r;
      (r = i == null ? void 0 : i.unsubscribe) == null || r.call(i);
    }
  };
}
export {
  x as useOrderQuery
};
