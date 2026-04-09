import { useQueryClient as v, useQuery as C } from "@tanstack/vue-query";
import { useSupabase as M, queryKeys as R, fetchUserAccessibleAccounts as E } from "./index.js";
function Q(h, d, _) {
  const l = M(), m = () => _ && typeof _ == "object" && "value" in _ ? _.value : _, g = [...R.settledCash(h, d), m()], q = v(), w = C({
    queryKey: g,
    queryFn: async () => {
      const i = m(), r = await E(l, d);
      console.log("🔍 Querying Settled Cash with config:", {
        limit: h,
        userId: d || "none",
        asOfDate: i || "latest",
        accessibleAccountIds: r.length > 0 ? r : "all"
      });
      let a = [];
      if (i) {
        const n = (/* @__PURE__ */ new Date(i + "T23:59:59.999Z")).toISOString();
        console.log("📅 Fetching historical Settled Cash data for date:", i, "up to:", n);
        let s = r;
        if (s.length === 0) {
          const { data: t, error: e } = await l.schema("fund_ai").from("p_dashboard_settledcash").select("internal_account_id").neq("internal_account_id", null);
          if (e)
            throw console.error("❌ Error fetching all account IDs:", e), e;
          s = Array.from(new Set((t || []).map((c) => c.internal_account_id)));
        }
        const p = s.map(async (t) => {
          const { data: e, error: c } = await l.schema("fund_ai").from("p_dashboard_settledcash").select("*").eq("internal_account_id", t).lte("fetched_at", n).order("fetched_at", { ascending: !1 }).limit(1).single();
          return c && c.code !== "PGRST116" ? (console.error(`❌ Error fetching Settled Cash for ${t}:`, c), null) : e;
        });
        a = (await Promise.all(p)).filter((t) => t !== null);
        const { data: S } = await l.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), f = new Map(
          (S || []).map((t) => [t.internal_account_id, t])
        );
        a = a.map((t) => {
          var e, c, o;
          return {
            ...t,
            legal_entity: (e = f.get(t.internal_account_id || "")) == null ? void 0 : e.legal_entity,
            archived: ((c = f.get(t.internal_account_id || "")) == null ? void 0 : c.archived) || !1,
            sync_mode: (o = f.get(t.internal_account_id || "")) == null ? void 0 : o.sync_mode
          };
        });
      } else {
        const { data: n, error: s } = await l.schema("fund_ai").from("p_dashboard_settledcash").select("internal_account_id").neq("internal_account_id", null);
        if (s)
          throw console.error("❌ Error fetching all account IDs:", s), s;
        const b = Array.from(new Set((n || []).map((e) => e.internal_account_id))).map(async (e) => {
          const { data: c, error: o } = await l.schema("fund_ai").from("p_dashboard_settledcash").select("*").eq("internal_account_id", e).order("fetched_at", { ascending: !1 }).limit(1).single();
          return o && o.code !== "PGRST116" ? (console.error(`❌ Error fetching latest Settled Cash for ${e}:`, o), null) : c;
        });
        a = (await Promise.all(b)).filter((e) => e !== null);
        const { data: f } = await l.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), t = new Map(
          (f || []).map((e) => [e.internal_account_id, e])
        );
        a = a.map((e) => {
          var c, o, A;
          return {
            ...e,
            legal_entity: (c = t.get(e.internal_account_id || "")) == null ? void 0 : c.legal_entity,
            archived: ((o = t.get(e.internal_account_id || "")) == null ? void 0 : o.archived) || !1,
            sync_mode: (A = t.get(e.internal_account_id || "")) == null ? void 0 : A.sync_mode
          };
        });
      }
      let y = /* @__PURE__ */ new Map();
      if (d) {
        const { data: n } = await l.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", d);
        y = new Map((n || []).map((s) => [s.internal_account_id, s.alias]));
      }
      return a = a.map((n) => ({
        ...n,
        legal_entity: y.get(n.internal_account_id || "") || n.legal_entity
      })), r.length > 0 && a.length > 0 && a[0] && "internal_account_id" in a[0] && (console.log("🔒 Applying access filter for Settled Cash data"), a = a.filter(
        (n) => n.internal_account_id && r.includes(n.internal_account_id)
      )), console.log("✅ Settled Cash query success:", {
        totalRows: a.length,
        asOfDate: i || "latest",
        filtered: r.length > 0
      }), a;
    },
    staleTime: 6e4
  }), u = l.channel("settledcash_all").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_dashboard_settledcash",
      event: "*"
    },
    () => q.invalidateQueries({ queryKey: g })
  ).subscribe();
  return {
    ...w,
    _cleanup: () => {
      var i;
      (i = u == null ? void 0 : u.unsubscribe) == null || i.call(u);
    }
  };
}
export {
  Q as useSettledCashQuery
};
