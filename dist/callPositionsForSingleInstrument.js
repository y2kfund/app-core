import { useQuery as p, useQueryClient as w } from "@tanstack/vue-query";
import { fetchUserAccessibleAccounts as v, useSupabase as g } from "./index.js";
import { isRef as A, computed as f } from "vue";
async function C(e) {
  const { data: c, error: t } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 });
  if (t)
    throw console.error("❌ Error fetching fetched_at timestamps:", t), t;
  return [...new Set(c.map((n) => n.fetched_at))];
}
async function b(e, c, t, i) {
  var m;
  const n = await v(e, t);
  console.log("🔍 Querying call positions with:", {
    symbolRoot: c,
    userId: t || "none",
    fetchedAt: i || "latest",
    accessibleAccountIds: n.length > 0 ? n : "all"
  });
  let s = i;
  if (!s) {
    const { data: a, error: u } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
    if (u)
      throw console.error("❌ Error fetching latest fetched_at:", u), u;
    s = a.fetched_at;
  }
  console.log("📅 Using fetched_at:", s);
  let o = e.schema("hf").from("positions").select("*").eq("fetched_at", s).ilike("symbol", `%${c}% C %`);
  n.length > 0 && (o = o.in("internal_account_id", n));
  const { data: r, error: h } = await o;
  if (h)
    throw console.error("❌ Error fetching call positions:", h), h;
  const [l, y] = await Promise.all([
    e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
    t ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", t) : { data: [], error: null }
  ]);
  if (l.error)
    throw console.error("❌ Accounts query error:", l.error), l.error;
  console.log("✅ Call positions query success:", {
    positionsCount: (r == null ? void 0 : r.length) || 0,
    accountsCount: (m = l.data) == null ? void 0 : m.length,
    filtered: n.length > 0
  });
  const d = new Map(
    (y.data || []).map((a) => [a.internal_account_id, a.alias])
  ), q = new Map(
    (l.data || []).map((a) => [a.internal_account_id, a.legal_entity])
  ), _ = (r || []).map((a) => {
    let u = q.get(a.internal_account_id) || void 0;
    return d.has(a.internal_account_id) && (u = d.get(a.internal_account_id)), {
      ...a,
      legal_entity: u
    };
  });
  return console.log("✅ Enriched call positions with accounts", _.length), _;
}
function T(e, c, t) {
  const i = g(), n = w(), s = A(t) ? f(() => t.value) : f(() => t), o = f(
    () => ["callPositions", e, c, s.value]
  ), r = p({
    queryKey: o,
    queryFn: async () => e ? await b(
      i,
      e,
      c,
      s.value
    ) : [],
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  }), h = i.channel(`call-positions:${e}:${c}:${s.value || "latest"}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "hf",
      table: "positions",
      filter: `symbol=ilike.%${e}%C%`
    },
    () => {
      console.log("🔄 Call positions changed, invalidating query..."), n.invalidateQueries({ queryKey: o.value });
    }
  ).subscribe();
  return { ...r, _cleanup: () => {
    h.unsubscribe();
  } };
}
function $() {
  const e = g();
  return p({
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
