import { useQueryClient as y, useQuery as w } from "@tanstack/vue-query";
import { fetchUserAccessibleAccounts as q, useSupabase as A } from "./index.js";
async function C(e, a, n) {
  var _;
  const c = await q(e, n);
  console.log("🔍 Querying call positions with:", {
    symbolRoot: a,
    userId: n || "none",
    accessibleAccountIds: c.length > 0 ? c : "all"
  });
  const { data: s, error: o } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
  if (o)
    throw console.error("❌ Error fetching latest fetched_at:", o), o;
  const r = s.fetched_at;
  console.log("📅 Latest fetched_at:", r);
  let l = e.schema("hf").from("positions").select("*").eq("fetched_at", r).ilike("symbol", `%${a}% C %`);
  c.length > 0 && (l = l.in("internal_account_id", c));
  const { data: u, error: h } = await l;
  if (h)
    throw console.error("❌ Error fetching call positions:", h), h;
  const [i, p] = await Promise.all([
    e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
    n ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
  ]);
  if (i.error)
    throw console.error("❌ Accounts query error:", i.error), i.error;
  console.log("✅ Call positions query success:", {
    positionsCount: (u == null ? void 0 : u.length) || 0,
    accountsCount: (_ = i.data) == null ? void 0 : _.length,
    filtered: c.length > 0
  });
  const f = new Map(
    (p.data || []).map((t) => [t.internal_account_id, t.alias])
  ), m = new Map(
    (i.data || []).map((t) => [t.internal_account_id, t.legal_entity])
  ), d = (u || []).map((t) => {
    let g = m.get(t.internal_account_id) || void 0;
    return f.has(t.internal_account_id) && (g = f.get(t.internal_account_id)), {
      ...t,
      legal_entity: g
    };
  });
  return console.log("✅ Enriched call positions with accounts", d.length), d;
}
function Q(e, a) {
  const n = A(), c = y(), s = ["callPositions", e, a], o = w({
    queryKey: s,
    queryFn: async () => e ? await C(n, e, a) : [],
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  }), r = n.channel(`call-positions:${e}:${a}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "hf",
      table: "positions",
      filter: `symbol=ilike.%${e}%P%`
    },
    () => {
      console.log("🔄 Call positions changed, invalidating query..."), c.invalidateQueries({ queryKey: s });
    }
  ).subscribe();
  return { ...o, _cleanup: () => {
    r.unsubscribe();
  } };
}
export {
  C as fetchCallPositionsForSymbol,
  Q as useCallPositionsQuery
};
