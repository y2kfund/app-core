import { useQueryClient as M, useQuery as D } from "@tanstack/vue-query";
import { useSupabase as N, fetchUserAccessibleAccounts as $ } from "./index.js";
const A = {
  top20: (e) => ["relativeCapitalDeployed", "top20", e]
};
function S(e, n) {
  if (!e) return "";
  if (n === "STK" || n === "FUND")
    return e;
  if (n === "OPT") {
    const l = e.match(/^([A-Z]+)/);
    return l ? l[1] : e.split(/\s+/)[0];
  }
  return e;
}
function U(e, n) {
  return n === "STK" || n === "FUND" ? !0 : n === "OPT" ? e.includes(" P ") || e.includes(" P[") : !1;
}
function x(e) {
  const n = N(), l = M(), F = A.top20(e), k = D({
    queryKey: F,
    queryFn: async () => {
      console.log("🔍 [Top20Capital] Querying with:", {
        userId: e || "none (all accounts)"
      });
      const s = await $(n, e);
      e && s.length === 0 ? console.log("⚠️ User has no account access restrictions - showing all accounts") : s.length > 0 && console.log("🔒 User has access to accounts:", s);
      const { data: d, error: _ } = await n.schema("fund_ai").from("p_positions_positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
      if (_)
        throw console.error("❌ Error fetching latest fetched_at:", _), _;
      if (!d || !d.fetched_at)
        return console.log("⚠️ No positions found in database"), [];
      const E = d.fetched_at;
      console.log("📅 Latest fetched_at:", E);
      let h = n.schema("fund_ai").from("p_positions_positions").select("*").eq("fetched_at", E).in("asset_class", ["STK", "OPT", "FUND"]);
      s.length > 0 && (h = h.in("internal_account_id", s));
      const { data: u, error: g } = await h;
      if (g)
        throw console.error("❌ Error fetching positions:", g), g;
      if (!u || u.length === 0)
        return console.log("📊 No positions found matching criteria"), [];
      console.log(`✅ Fetched ${u.length} position(s) from database`);
      const m = u.filter(
        (t) => U(t.symbol, t.asset_class)
      );
      if (console.log(`🔽 Filtered to ${m.length} position(s) (STK + FUND + PUT options)`), m.length === 0)
        return console.log("⚠️ No positions after filtering"), [];
      const a = /* @__PURE__ */ new Map();
      m.forEach((t) => {
        const o = S(t.symbol, t.asset_class);
        if (!o) return;
        const i = Math.abs(t.accounting_quantity ?? t.qty ?? 0);
        a.has(o) || a.set(o, {
          totalQuantity: 0,
          positions: []
        });
        const c = a.get(o);
        c.totalQuantity += i, c.positions.push(t);
      }), console.log(`📦 Grouped into ${a.size} unique symbol(s)`);
      const [y, v] = await Promise.all([
        n.schema("fund_ai").from("core_accounts_master").select("internal_account_id, legal_entity"),
        e ? n.schema("fund_ai").from("core_accounts_alias").select("internal_account_id, alias").eq("user_id", e) : { data: [], error: null }
      ]);
      y.error && console.error("⚠️ Error fetching accounts:", y.error);
      const b = new Map(
        (v.data || []).map((t) => [t.internal_account_id, t.alias])
      ), P = new Map(
        (y.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      );
      console.log(`📋 Fetched ${P.size} account(s), ${b.size} alias(es)`), a.forEach((t) => {
        t.positions = t.positions.map((o) => {
          let i = o.internal_account_id;
          if (b.has(o.internal_account_id))
            i = b.get(o.internal_account_id);
          else if (P.has(o.internal_account_id)) {
            const c = P.get(o.internal_account_id);
            c && (i = c);
          }
          return {
            ...o,
            account_display_name: i
          };
        });
      });
      const q = Array.from(a.keys());
      if (q.length === 0)
        return console.log("⚠️ No unique symbols found"), [];
      console.log("💰 Fetching market prices for symbols:", q);
      const { data: Q, error: T } = await n.schema("fund_ai").from("p_positions_market_price").select("symbol, market_price").in("symbol", q).order("id", { ascending: !1 });
      T && console.warn("⚠️ Error fetching market prices:", T);
      const p = /* @__PURE__ */ new Map();
      Q && Q.forEach((t) => {
        p.has(t.symbol) || p.set(t.symbol, t.market_price);
      }), console.log(`📊 Fetched prices for ${p.size} symbol(s)`);
      const f = [];
      a.forEach((t, o) => {
        const i = p.get(o) ?? null, c = i ? t.totalQuantity * i : 0;
        f.push({
          symbolRoot: o,
          totalQuantity: t.totalQuantity,
          currentMarketPrice: i,
          capitalInvested: c,
          positionCount: t.positions.length,
          positions: t.positions
        });
      }), f.sort((t, o) => o.capitalInvested - t.capitalInvested);
      const w = f.slice(0, 20);
      return console.log("✅ Top 20 positions by capital invested:", {
        totalGroups: f.length,
        top20Count: w.length,
        top20Symbols: w.map((t) => `${t.symbolRoot}: $${t.capitalInvested.toFixed(2)}`)
      }), w;
    },
    enabled: !0,
    // Always enabled
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
    // Retry failed queries up to 2 times
  }), r = n.channel("top20-capital-deployed").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_positions_positions",
      event: "*"
    },
    () => {
      console.log("🔄 Positions table changed, invalidating top 20 capital query"), l.invalidateQueries({ queryKey: F });
    }
  ).subscribe();
  return {
    ...k,
    _cleanup: () => {
      var s;
      console.log("🧹 Cleaning up top 20 capital subscription"), (s = r == null ? void 0 : r.unsubscribe) == null || s.call(r);
    }
  };
}
export {
  A as relativeCapitalDeployedQueryKeys,
  x as useTop20PositionsByCapitalQuery
};
