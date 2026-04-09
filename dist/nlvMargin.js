import { useQueryClient as A, useQuery as E } from "@tanstack/vue-query";
import { useSupabase as N, queryKeys as Q, fetchUserAccessibleAccounts as S } from "./index.js";
function V(g, _, u) {
  const c = N(), y = () => u && typeof u == "object" && "value" in u ? u.value : u, m = [...Q.nlvMargin(g, _), y()], v = A(), q = E({
    queryKey: m,
    queryFn: async () => {
      const l = y(), i = await S(c, _);
      console.log("🔍 Querying NLV/Margin with config:", {
        limit: g,
        userId: _ || "none",
        asOfDate: l || "latest",
        accessibleAccountIds: i.length > 0 ? i : "all"
      });
      let n = [];
      if (l) {
        const a = (/* @__PURE__ */ new Date(l + "T23:59:59.999Z")).toISOString();
        console.log("📅 Fetching historical NLV/Margin data for date:", l, "up to:", a);
        let r = i;
        if (r.length === 0) {
          const { data: e, error: t } = await c.schema("fund_ai").from("p_dashboard_netliquidation").select("internal_account_id").neq("internal_account_id", null);
          if (t)
            throw console.error("❌ Error fetching all account IDs:", t), t;
          r = Array.from(new Set((e || []).map((s) => s.internal_account_id)));
        }
        const M = r.map(async (e) => {
          const { data: t, error: s } = await c.schema("fund_ai").from("p_dashboard_netliquidation").select("*").eq("internal_account_id", e).lte("fetched_at", a).order("fetched_at", { ascending: !1 }).limit(1).single();
          if (s && s.code !== "PGRST116")
            return console.error(`❌ Error fetching NLV for ${e}:`, s), null;
          const { data: o, error: p } = await c.schema("fund_ai").from("p_dashboard_maintenance_margin").select("*").eq("internal_account_id", e).lte("fetched_at", a).order("fetched_at", { ascending: !1 }).limit(1).single();
          return p && p.code !== "PGRST116" ? (console.error(`❌ Error fetching MM for ${e}:`, p), null) : !t || !o ? null : {
            nlv_id: t.id,
            nlv_val: t.nlv,
            fetched_at_val: t.fetched_at,
            maintenance_val: parseFloat(o.maintenance),
            nlv_internal_account_id: e,
            excess_maintenance_margin: t.nlv - parseFloat(o.maintenance)
          };
        });
        n = (await Promise.all(M)).filter((e) => e !== null);
        const { data: w } = await c.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), h = new Map(
          (w || []).map((e) => [e.internal_account_id, e])
        );
        n = n.map((e) => {
          var t, s, o;
          return {
            ...e,
            legal_entity: (t = h.get(e.nlv_internal_account_id || "")) == null ? void 0 : t.legal_entity,
            archived: ((s = h.get(e.nlv_internal_account_id || "")) == null ? void 0 : s.archived) || !1,
            sync_mode: (o = h.get(e.nlv_internal_account_id || "")) == null ? void 0 : o.sync_mode
          };
        });
      } else {
        const { data: a, error: r } = await c.schema("fund_ai").rpc("get_nlv_margin_with_excess_and_sync_type", {
          p_limit: g
        });
        if (r) throw r;
        n = a || [];
      }
      let b = /* @__PURE__ */ new Map();
      if (_) {
        const { data: a } = await c.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", _);
        b = new Map((a || []).map((r) => [r.internal_account_id, r.alias]));
      }
      return n = n.map((a) => ({
        ...a,
        legal_entity: b.get(a.nlv_internal_account_id || "") || a.legal_entity
      })), i.length > 0 && n.length > 0 && n[0] && "nlv_internal_account_id" in n[0] && (console.log("🔒 Applying access filter for NLV/Margin data"), n = n.filter(
        (a) => a.nlv_internal_account_id && i.includes(a.nlv_internal_account_id)
      )), console.log("✅ NLV/Margin query success:", {
        totalRows: n.length,
        asOfDate: l || "latest",
        filtered: i.length > 0
      }), n;
    },
    staleTime: 6e4
  }), d = c.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_dashboard_netliquidation",
      event: "*"
    },
    () => v.invalidateQueries({ queryKey: m })
  ).subscribe(), f = c.channel("maintenance_margin_all").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_dashboard_maintenance_margin",
      event: "*"
    },
    () => v.invalidateQueries({ queryKey: m })
  ).subscribe();
  return {
    ...q,
    _cleanup: () => {
      var l, i;
      (l = d == null ? void 0 : d.unsubscribe) == null || l.call(d), (i = f == null ? void 0 : f.unsubscribe) == null || i.call(f);
    }
  };
}
export {
  V as useNlvMarginQuery
};
