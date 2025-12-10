import { useQueryClient as A, useQuery as E } from "@tanstack/vue-query";
import { useSupabase as N, queryKeys as Q, fetchUserAccessibleAccounts as S } from "./index.js";
function V(g, _, u) {
  const c = N(), v = () => u && typeof u == "object" && "value" in u ? u.value : u, h = [...Q.nlvMargin(g, _), v()], p = A(), q = E({
    queryKey: h,
    queryFn: async () => {
      const r = v(), i = await S(c, _);
      console.log("🔍 Querying NLV/Margin with config:", {
        limit: g,
        userId: _ || "none",
        asOfDate: r || "latest",
        accessibleAccountIds: i.length > 0 ? i : "all"
      });
      let t = [];
      if (r) {
        const n = (/* @__PURE__ */ new Date(r + "T23:59:59.999Z")).toISOString();
        console.log("📅 Fetching historical NLV/Margin data for date:", r, "up to:", n);
        let l = i;
        if (l.length === 0) {
          const { data: e, error: a } = await c.schema("hf").from("netliquidation").select("internal_account_id").neq("internal_account_id", null);
          if (a)
            throw console.error("❌ Error fetching all account IDs:", a), a;
          l = Array.from(new Set((e || []).map((s) => s.internal_account_id)));
        }
        const M = l.map(async (e) => {
          const { data: a, error: s } = await c.schema("hf").from("netliquidation").select("*").eq("internal_account_id", e).lte("fetched_at", n).order("fetched_at", { ascending: !1 }).limit(1).single();
          if (s && s.code !== "PGRST116")
            return console.error(`❌ Error fetching NLV for ${e}:`, s), null;
          const { data: o, error: y } = await c.schema("hf").from("maintenance_margin").select("*").eq("internal_account_id", e).lte("fetched_at", n).order("fetched_at", { ascending: !1 }).limit(1).single();
          return y && y.code !== "PGRST116" ? (console.error(`❌ Error fetching MM for ${e}:`, y), null) : !a || !o ? null : {
            nlv_id: a.id,
            nlv_val: a.nlv,
            fetched_at_val: a.fetched_at,
            maintenance_val: parseFloat(o.maintenance),
            nlv_internal_account_id: e,
            excess_maintenance_margin: a.nlv - parseFloat(o.maintenance)
          };
        });
        t = (await Promise.all(M)).filter((e) => e !== null);
        const { data: w } = await c.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), m = new Map(
          (w || []).map((e) => [e.internal_account_id, e])
        );
        t = t.map((e) => {
          var a, s, o;
          return {
            ...e,
            legal_entity: (a = m.get(e.nlv_internal_account_id || "")) == null ? void 0 : a.legal_entity,
            archived: ((s = m.get(e.nlv_internal_account_id || "")) == null ? void 0 : s.archived) || !1,
            sync_mode: (o = m.get(e.nlv_internal_account_id || "")) == null ? void 0 : o.sync_mode
          };
        });
      } else {
        const { data: n, error: l } = await c.schema("hf").rpc("get_nlv_margin_with_excess_and_sync_type", {
          p_limit: g
        });
        if (l) throw l;
        t = n || [];
      }
      let b = /* @__PURE__ */ new Map();
      if (_) {
        const { data: n } = await c.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", _);
        b = new Map((n || []).map((l) => [l.internal_account_id, l.alias]));
      }
      return t = t.map((n) => ({
        ...n,
        legal_entity: b.get(n.nlv_internal_account_id || "") || n.legal_entity
      })), i.length > 0 && t.length > 0 && t[0] && "nlv_internal_account_id" in t[0] && (console.log("🔒 Applying access filter for NLV/Margin data"), t = t.filter(
        (n) => n.nlv_internal_account_id && i.includes(n.nlv_internal_account_id)
      )), console.log("✅ NLV/Margin query success:", {
        totalRows: t.length,
        asOfDate: r || "latest",
        filtered: i.length > 0
      }), t;
    },
    staleTime: 6e4
  }), d = c.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "netliquidation",
      event: "*"
    },
    () => p.invalidateQueries({ queryKey: h })
  ).subscribe(), f = c.channel("maintenance_margin_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "maintenance_margin",
      event: "*"
    },
    () => p.invalidateQueries({ queryKey: h })
  ).subscribe();
  return {
    ...q,
    _cleanup: () => {
      var r, i;
      (r = d == null ? void 0 : d.unsubscribe) == null || r.call(d), (i = f == null ? void 0 : f.unsubscribe) == null || i.call(f);
    }
  };
}
export {
  V as useNlvMarginQuery
};
