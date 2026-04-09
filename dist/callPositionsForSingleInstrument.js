import { useQuery as m, useQueryClient as w } from "@tanstack/vue-query";
import { fetchUserAccessibleAccounts as v, useSupabase as g } from "./index.js";
import { isRef as A, computed as d } from "vue";
async function C(e) {
  const { data: i, error: t } = await e.schema("fund_ai").from("p_positions_positions").select("fetched_at").order("fetched_at", { ascending: !1 });
  if (t)
    throw console.error("❌ Error fetching fetched_at timestamps:", t), t;
  return [...new Set(i.map((a) => a.fetched_at))];
}
async function b(e, i, t, s) {
  var p;
  const a = await v(e, t);
  console.log("🔍 Querying call positions with:", {
    symbolRoot: i,
    userId: t || "none",
    fetchedAt: s || "latest",
    accessibleAccountIds: a.length > 0 ? a : "all"
  });
  let c = s;
  if (!c) {
    const { data: n, error: u } = await e.schema("fund_ai").from("p_positions_positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
    if (u)
      throw console.error("❌ Error fetching latest fetched_at:", u), u;
    c = n.fetched_at;
  }
  console.log("📅 Using fetched_at:", c);
  let o = e.schema("fund_ai").from("p_positions_positions").select("*").eq("fetched_at", c).ilike("symbol", `%${i}% C %`);
  a.length > 0 && (o = o.in("internal_account_id", a));
  const { data: r, error: _ } = await o;
  if (_)
    throw console.error("❌ Error fetching call positions:", _), _;
  const [l, y] = await Promise.all([
    e.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity"),
    t ? e.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", t) : { data: [], error: null }
  ]);
  if (l.error)
    throw console.error("❌ Accounts query error:", l.error), l.error;
  console.log("✅ Call positions query success:", {
    positionsCount: (r == null ? void 0 : r.length) || 0,
    accountsCount: (p = l.data) == null ? void 0 : p.length,
    filtered: a.length > 0
  });
  const f = new Map(
    (y.data || []).map((n) => [n.internal_account_id, n.alias])
  ), q = new Map(
    (l.data || []).map((n) => [n.internal_account_id, n.legal_entity])
  ), h = (r || []).map((n) => {
    let u = q.get(n.internal_account_id) || void 0;
    return f.has(n.internal_account_id) && (u = f.get(n.internal_account_id)), {
      ...n,
      legal_entity: u
    };
  });
  return console.log("✅ Enriched call positions with accounts", h.length), h;
}
function T(e, i, t) {
  const s = g(), a = w(), c = A(t) ? d(() => t.value) : d(() => t), o = d(
    () => ["callPositions", e, i, c.value]
  ), r = m({
    queryKey: o,
    queryFn: async () => e ? await b(
      s,
      e,
      i,
      c.value
    ) : [],
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  }), _ = s.channel(`call-positions:${e}:${i}:${c.value || "latest"}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "fund_ai",
      table: "p_positions_positions",
      filter: `symbol=ilike.%${e}%C%`
    },
    () => {
      console.log("🔄 Call positions changed, invalidating query..."), a.invalidateQueries({ queryKey: o.value });
    }
  ).subscribe();
  return { ...r, _cleanup: () => {
    _.unsubscribe();
  } };
}
function $() {
  const e = g();
  return m({
    queryKey: ["availableFetchedAt"],
    queryFn: () => C(e),
    staleTime: 3e5
    // 5 minutes
  });
}
export {
  C as fetchAvailableFetchedAtTimestamps,
  b as fetchCallPositionsForSymbol,
  $ as useAvailableFetchedAtQuery,
  T as useCallPositionsQuery
};
