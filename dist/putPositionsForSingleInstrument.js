import { useQueryClient as w, useQuery as m } from "@tanstack/vue-query";
import { fetchUserAccessibleAccounts as v, useSupabase as g } from "./index.js";
import { isRef as A, computed as f } from "vue";
async function P(e) {
  const { data: c, error: t } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 });
  if (t)
    throw console.error("❌ Error fetching fetched_at timestamps:", t), t;
  return [...new Set(c.map((a) => a.fetched_at))];
}
async function b(e, c, t, i) {
  var p;
  const a = await v(e, t);
  console.log("🔍 Querying put positions with:", {
    symbolRoot: c,
    userId: t || "none",
    fetchedAt: i || "latest",
    accessibleAccountIds: a.length > 0 ? a : "all"
  });
  let s = i;
  if (!s) {
    const { data: n, error: u } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
    if (u)
      throw console.error("❌ Error fetching latest fetched_at:", u), u;
    s = n.fetched_at;
  }
  console.log("📅 Using fetched_at:", s);
  let o = e.schema("hf").from("positions").select("*").eq("fetched_at", s).ilike("symbol", `%${c}% P %`);
  a.length > 0 && (o = o.in("internal_account_id", a));
  const { data: r, error: h } = await o;
  if (h)
    throw console.error("❌ Error fetching put positions:", h), h;
  const [l, y] = await Promise.all([
    e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
    t ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", t) : { data: [], error: null }
  ]);
  if (l.error)
    throw console.error("❌ Accounts query error:", l.error), l.error;
  console.log("✅ Put positions query success:", {
    positionsCount: (r == null ? void 0 : r.length) || 0,
    accountsCount: (p = l.data) == null ? void 0 : p.length,
    filtered: a.length > 0
  });
  const d = new Map(
    (y.data || []).map((n) => [n.internal_account_id, n.alias])
  ), q = new Map(
    (l.data || []).map((n) => [n.internal_account_id, n.legal_entity])
  ), _ = (r || []).map((n) => {
    let u = q.get(n.internal_account_id) || void 0;
    return d.has(n.internal_account_id) && (u = d.get(n.internal_account_id)), {
      ...n,
      legal_entity: u
    };
  });
  return console.log("✅ Enriched put positions with accounts", _.length), _;
}
function T(e, c, t) {
  const i = g(), a = w(), s = A(t) ? f(() => t.value) : f(() => t), o = f(
    () => ["putPositions", e, c, s.value]
  ), r = m({
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
  }), h = i.channel(`put-positions:${e}:${c}:${s.value || "latest"}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "hf",
      table: "positions",
      filter: `symbol=ilike.%${e}%C%`
    },
    () => {
      console.log("🔄 Put positions changed, invalidating query..."), a.invalidateQueries({ queryKey: o.value });
    }
  ).subscribe();
  return { ...r, _cleanup: () => {
    h.unsubscribe();
  } };
}
function $() {
  const e = g();
  return m({
    queryKey: ["availableFetchedAt"],
    queryFn: () => P(e),
    staleTime: 3e5
    // 5 minutes
  });
}
export {
  P as fetchAvailableFetchedAtTimestamps,
  b as fetchPutPositionsForSymbol,
  $ as useAvailableFetchedAtQuery,
  T as usePutPositionsQuery
};
