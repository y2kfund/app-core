import { useQueryClient as h, useQuery as m } from "@tanstack/vue-query";
import { useSupabase as b, queryKeys as v, fetchUserAccessibleAccounts as M } from "./index.js";
function N(r, s) {
  const i = b(), o = v.nlvMargin(r, s), u = h(), f = m({
    queryKey: o,
    queryFn: async () => {
      const a = await M(i, s);
      console.log("🔍 Querying NLV/Margin with config:", {
        limit: r,
        userId: s || "none",
        accessibleAccountIds: a.length > 0 ? a : "all"
      });
      const { data: t, error: _ } = await i.schema("hf").rpc("get_nlv_margin_with_excess", {
        p_limit: r
      });
      if (_) throw _;
      let n = t || [], g = /* @__PURE__ */ new Map();
      if (s) {
        const { data: e } = await i.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", s);
        g = new Map((e || []).map((d) => [d.internal_account_id, d.alias]));
      }
      n = n.map((e) => ({
        ...e,
        legal_entity: g.get(e.nlv_internal_account_id || "") || e.legal_entity
      }));
      const { data: p } = await i.schema("hf").from("maintenance_margin_metadata").select("internal_account_id, analyst_ratings, founder_led, next_earnings"), y = new Map(
        (p || []).map((e) => [e.internal_account_id, e])
      );
      return n = n.map((e) => ({
        ...e,
        ...y.get(e.nlv_internal_account_id) || {}
      })), a.length > 0 && n.length > 0 ? n[0] && "nlv_internal_account_id" in n[0] ? (console.log("🔒 Applying access filter for NLV/Margin data"), n = n.filter(
        (e) => e.nlv_internal_account_id && a.includes(e.nlv_internal_account_id)
      )) : console.warn("⚠️ NLV/Margin data missing nlv_internal_account_id field, cannot filter by access") : console.log("🔓 No access filter applied - showing all NLV/Margin data"), console.log("✅ NLV/Margin query success:", {
        totalRows: (t == null ? void 0 : t.length) || 0,
        filteredRows: n.length,
        filtered: a.length > 0
      }), n;
    },
    staleTime: 6e4
  }), c = i.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "netliquidation",
      event: "*"
    },
    () => u.invalidateQueries({ queryKey: o })
  ).subscribe(), l = i.channel("maintenance_margin_all").on(
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
      var a, t;
      (a = c == null ? void 0 : c.unsubscribe) == null || a.call(c), (t = l == null ? void 0 : l.unsubscribe) == null || t.call(l);
    }
  };
}
export {
  N as useNlvMarginQuery
};
