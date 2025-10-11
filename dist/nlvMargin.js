import { useQueryClient as f, useQuery as y } from "@tanstack/vue-query";
import { useSupabase as b, queryKeys as d, fetchUserAccessibleAccounts as h } from "./index.js";
function q(a, r) {
  const c = b(), l = d.nlvMargin(a, r), o = f(), _ = y({
    queryKey: l,
    queryFn: async () => {
      const e = await h(c, r);
      console.log("🔍 Querying NLV/Margin with config:", {
        limit: a,
        userId: r || "none",
        accessibleAccountIds: e.length > 0 ? e : "all"
      });
      const { data: n, error: u } = await c.schema("hf").rpc("get_nlv_margin_with_excess", {
        p_limit: a
      });
      if (u) throw u;
      let s = n || [];
      return e.length > 0 && s.length > 0 ? s[0] && "nlv_internal_account_id" in s[0] ? (console.log("🔒 Applying access filter for NLV/Margin data"), s = s.filter(
        (g) => g.nlv_internal_account_id && e.includes(g.nlv_internal_account_id)
      )) : console.warn("⚠️ NLV/Margin data missing nlv_internal_account_id field, cannot filter by access") : console.log("🔓 No access filter applied - showing all NLV/Margin data"), console.log("✅ NLV/Margin query success:", {
        totalRows: (n == null ? void 0 : n.length) || 0,
        filteredRows: s.length,
        filtered: e.length > 0
      }), s;
    },
    staleTime: 6e4
  }), t = c.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "netliquidation",
      event: "*"
    },
    () => o.invalidateQueries({ queryKey: l })
  ).subscribe(), i = c.channel("maintenance_margin_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "maintenance_margin",
      event: "*"
    },
    () => o.invalidateQueries({ queryKey: l })
  ).subscribe();
  return {
    ..._,
    _cleanup: () => {
      var e, n;
      (e = t == null ? void 0 : t.unsubscribe) == null || e.call(t), (n = i == null ? void 0 : i.unsubscribe) == null || n.call(i);
    }
  };
}
export {
  q as useNlvMarginQuery
};
