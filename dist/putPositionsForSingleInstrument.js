import { useQueryClient as y, useQuery as w } from "@tanstack/vue-query";
import { fetchUserAccessibleAccounts as q, useSupabase as P } from "./index.js";
async function A(e, a, n) {
  var _;
  const c = await q(e, n);
  console.log("🔍 Querying put positions with:", {
    symbolRoot: a,
    userId: n || "none",
    accessibleAccountIds: c.length > 0 ? c : "all"
  });
  const { data: s, error: o } = await e.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
  if (o)
    throw console.error("❌ Error fetching latest fetched_at:", o), o;
  const r = s.fetched_at;
  console.log("📅 Latest fetched_at:", r);
  let l = e.schema("hf").from("positions").select("*").eq("fetched_at", r).ilike("symbol", `%${a}%P%`);
  c.length > 0 && (l = l.in("internal_account_id", c));
  const { data: u, error: h } = await l;
  if (h)
    throw console.error("❌ Error fetching put positions:", h), h;
  const [i, g] = await Promise.all([
    e.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
    n ? e.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", n) : { data: [], error: null }
  ]);
  if (i.error)
    throw console.error("❌ Accounts query error:", i.error), i.error;
  console.log("✅ Put positions query success:", {
    positionsCount: (u == null ? void 0 : u.length) || 0,
    accountsCount: (_ = i.data) == null ? void 0 : _.length,
    filtered: c.length > 0
  });
  const f = new Map(
    (g.data || []).map((t) => [t.internal_account_id, t.alias])
  ), m = new Map(
    (i.data || []).map((t) => [t.internal_account_id, t.legal_entity])
  ), d = (u || []).map((t) => {
    let p = m.get(t.internal_account_id) || void 0;
    return f.has(t.internal_account_id) && (p = f.get(t.internal_account_id)), {
      ...t,
      legal_entity: p
    };
  });
  return console.log("✅ Enriched put positions with accounts", d.length), d;
}
function b(e, a) {
  const n = P(), c = y(), s = ["putPositions", e, a], o = w({
    queryKey: s,
    queryFn: async () => e ? await A(n, e, a) : [],
    enabled: !!e,
    staleTime: 6e4
    // 1 minute
  }), r = n.channel(`put-positions:${e}:${a}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "hf",
      table: "positions",
      filter: `symbol=ilike.%${e}%P%`
    },
    () => {
      console.log("🔄 Put positions changed, invalidating query..."), c.invalidateQueries({ queryKey: s });
    }
  ).subscribe();
  return { ...o, _cleanup: () => {
    r.unsubscribe();
  } };
}
export {
  A as fetchPutPositionsForSymbol,
  b as usePutPositionsQuery
};
