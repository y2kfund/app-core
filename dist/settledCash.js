import { useQueryClient as v, useQuery as C } from "@tanstack/vue-query";
import { useSupabase as M, queryKeys as R, fetchUserAccessibleAccounts as E } from "./index.js";
function Q(f, u, d) {
  const l = M(), m = () => d && typeof d == "object" && "value" in d ? d.value : d, g = [...R.settledCash(f, u), m()], w = v(), b = C({
    queryKey: g,
    queryFn: async () => {
      const r = m(), i = await E(l, u);
      console.log("🔍 Querying Settled Cash with config:", {
        limit: f,
        userId: u || "none",
        asOfDate: r || "latest",
        accessibleAccountIds: i.length > 0 ? i : "all"
      });
      let a = [];
      if (r) {
        const n = (/* @__PURE__ */ new Date(r + "T23:59:59.999Z")).toISOString();
        console.log("📅 Fetching historical Settled Cash data for date:", r, "up to:", n);
        let s = i;
        if (s.length === 0) {
          const { data: t, error: e } = await l.schema("hf").from("settledcash").select("internal_account_id").neq("internal_account_id", null);
          if (e)
            throw console.error("❌ Error fetching all account IDs:", e), e;
          s = Array.from(new Set((t || []).map((c) => c.internal_account_id)));
        }
        const p = s.map(async (t) => {
          const { data: e, error: c } = await l.schema("hf").from("settledcash").select("*").eq("internal_account_id", t).lte("fetched_at", n).order("fetched_at", { ascending: !1 }).limit(1).single();
          return c && c.code !== "PGRST116" ? (console.error(`❌ Error fetching Settled Cash for ${t}:`, c), null) : e;
        });
        a = (await Promise.all(p)).filter((t) => t !== null);
        const { data: A } = await l.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), h = new Map(
          (A || []).map((t) => [t.internal_account_id, t])
        );
        a = a.map((t) => {
          var e, c, o;
          return {
            ...t,
            legal_entity: (e = h.get(t.internal_account_id || "")) == null ? void 0 : e.legal_entity,
            archived: ((c = h.get(t.internal_account_id || "")) == null ? void 0 : c.archived) || !1,
            sync_mode: (o = h.get(t.internal_account_id || "")) == null ? void 0 : o.sync_mode
          };
        });
      } else {
        const { data: n, error: s } = await l.schema("hf").from("settledcash").select("internal_account_id").neq("internal_account_id", null);
        if (s)
          throw console.error("❌ Error fetching all account IDs:", s), s;
        const S = Array.from(new Set((n || []).map((e) => e.internal_account_id))).map(async (e) => {
          const { data: c, error: o } = await l.schema("hf").from("settledcash").select("*").eq("internal_account_id", e).order("fetched_at", { ascending: !1 }).limit(1).single();
          return o && o.code !== "PGRST116" ? (console.error(`❌ Error fetching latest Settled Cash for ${e}:`, o), null) : c;
        });
        a = (await Promise.all(S)).filter((e) => e !== null);
        const { data: h } = await l.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity, archived, sync_mode"), t = new Map(
          (h || []).map((e) => [e.internal_account_id, e])
        );
        a = a.map((e) => {
          var c, o, q;
          return {
            ...e,
            legal_entity: (c = t.get(e.internal_account_id || "")) == null ? void 0 : c.legal_entity,
            archived: ((o = t.get(e.internal_account_id || "")) == null ? void 0 : o.archived) || !1,
            sync_mode: (q = t.get(e.internal_account_id || "")) == null ? void 0 : q.sync_mode
          };
        });
      }
      let y = /* @__PURE__ */ new Map();
      if (u) {
        const { data: n } = await l.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", u);
        y = new Map((n || []).map((s) => [s.internal_account_id, s.alias]));
      }
      return a = a.map((n) => ({
        ...n,
        legal_entity: y.get(n.internal_account_id || "") || n.legal_entity
      })), i.length > 0 && a.length > 0 && a[0] && "internal_account_id" in a[0] && (console.log("🔒 Applying access filter for Settled Cash data"), a = a.filter(
        (n) => n.internal_account_id && i.includes(n.internal_account_id)
      )), console.log("✅ Settled Cash query success:", {
        totalRows: a.length,
        asOfDate: r || "latest",
        filtered: i.length > 0
      }), a;
    },
    staleTime: 6e4
  }), _ = l.channel("settledcash_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "settledcash",
      event: "*"
    },
    () => w.invalidateQueries({ queryKey: g })
  ).subscribe();
  return {
    ...b,
    _cleanup: () => {
      var r;
      (r = _ == null ? void 0 : _.unsubscribe) == null || r.call(_);
    }
  };
}
export {
  Q as useSettledCashQuery
};
