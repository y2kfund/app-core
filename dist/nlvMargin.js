import { useQueryClient as d, useQuery as p } from "@tanstack/vue-query";
import { useSupabase as h, queryKeys as b, fetchUserAccessibleAccounts as v } from "./index.js";
function M(r, i) {
  const s = h(), o = b.nlvMargin(r, i), u = d(), f = p({
    queryKey: o,
    queryFn: async () => {
      const n = await v(s, i);
      console.log("🔍 Querying NLV/Margin with config:", {
        limit: r,
        userId: i || "none",
        accessibleAccountIds: n.length > 0 ? n : "all"
      });
      const { data: t, error: _ } = await s.schema("hf").rpc("get_nlv_margin_with_excess_and_sync_type", {
        p_limit: r
      });
      if (_) throw _;
      let e = t || [], g = /* @__PURE__ */ new Map();
      if (i) {
        const { data: a } = await s.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", i);
        g = new Map((a || []).map((y) => [y.internal_account_id, y.alias]));
      }
      return e = e.map((a) => ({
        ...a,
        legal_entity: g.get(a.nlv_internal_account_id || "") || a.legal_entity
      })), n.length > 0 && e.length > 0 ? e[0] && "nlv_internal_account_id" in e[0] ? (console.log("🔒 Applying access filter for NLV/Margin data"), e = e.filter(
        (a) => a.nlv_internal_account_id && n.includes(a.nlv_internal_account_id)
      )) : console.warn("⚠️ NLV/Margin data missing nlv_internal_account_id field, cannot filter by access") : console.log("🔓 No access filter applied - showing all NLV/Margin data"), console.log("✅ NLV/Margin query success:", {
        totalRows: (t == null ? void 0 : t.length) || 0,
        filteredRows: e.length,
        filtered: n.length > 0
      }), e;
    },
    staleTime: 6e4
  }), c = s.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "netliquidation",
      event: "*"
    },
    () => u.invalidateQueries({ queryKey: o })
  ).subscribe(), l = s.channel("maintenance_margin_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "maintenance_margin",
      event: "*"
    },
    () => u.invalidateQueries({ queryKey: o })
  ).subscribe();
  return {
    ...f,
    _cleanup: () => {
      var n, t;
      (n = c == null ? void 0 : c.unsubscribe) == null || n.call(c), (t = l == null ? void 0 : l.unsubscribe) == null || t.call(l);
    }
  };
}
export {
  M as useNlvMarginQuery
};
