import { useQueryClient as T, useQuery as $ } from "@tanstack/vue-query";
import { useSupabase as A, fetchUserAccessibleAccounts as D } from "./index.js";
const N = {
  top20: (o) => ["relativeCapitalDeployed", "top20", o]
};
function S(o) {
  if (!o) return "";
  const n = o.match(/^([A-Z]+)/);
  return n ? n[1] : o.split(/\s+/)[0];
}
function U(o, n) {
  return n === "STK" || n === "FUND" ? !0 : n === "OPT" ? o.includes(" P ") || o.includes(" P[") : !1;
}
function R(o) {
  const n = A(), k = T(), P = N.top20(o), v = $({
    queryKey: P,
    queryFn: async () => {
      console.log("🔍 [Top20Capital] Querying with:", {
        userId: o || "none (all accounts)"
      });
      const a = await D(n, o);
      o && a.length === 0 ? console.log("⚠️ User has no account access restrictions - showing all accounts") : a.length > 0 && console.log("🔒 User has access to accounts:", a);
      const { data: f, error: h } = await n.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
      if (h)
        throw console.error("❌ Error fetching latest fetched_at:", h), h;
      if (!f || !f.fetched_at)
        return console.log("⚠️ No positions found in database"), [];
      const E = f.fetched_at;
      console.log("📅 Latest fetched_at:", E);
      let d = n.schema("hf").from("positions").select("*").eq("fetched_at", E).in("asset_class", ["STK", "OPT", "FUND"]);
      a.length > 0 && (d = d.in("internal_account_id", a));
      const { data: l, error: g } = await d;
      if (g)
        throw console.error("❌ Error fetching positions:", g), g;
      if (!l || l.length === 0)
        return console.log("📊 No positions found matching criteria"), [];
      console.log(`✅ Fetched ${l.length} position(s) from database`);
      const m = l.filter(
        (t) => U(t.symbol, t.asset_class)
      );
      if (console.log(`🔽 Filtered to ${m.length} position(s) (STK + FUND + PUT options)`), m.length === 0)
        return console.log("⚠️ No positions after filtering"), [];
      const i = /* @__PURE__ */ new Map();
      m.forEach((t) => {
        const e = S(t.symbol);
        if (!e) return;
        const s = Math.abs(t.accounting_quantity ?? t.qty ?? 0);
        i.has(e) || i.set(e, {
          totalQuantity: 0,
          positions: []
        });
        const c = i.get(e);
        c.totalQuantity += s, c.positions.push(t);
      }), console.log(`📦 Grouped into ${i.size} unique symbol(s)`);
      const [y, M] = await Promise.all([
        n.schema("hf").from("user_accounts_master").select("internal_account_id, legal_entity"),
        o ? n.schema("hf").from("user_account_alias").select("internal_account_id, alias").eq("user_id", o) : { data: [], error: null }
      ]);
      y.error && console.error("⚠️ Error fetching accounts:", y.error);
      const _ = new Map(
        (M.data || []).map((t) => [t.internal_account_id, t.alias])
      ), b = new Map(
        (y.data || []).map((t) => [t.internal_account_id, t.legal_entity])
      );
      console.log(`📋 Fetched ${b.size} account(s), ${_.size} alias(es)`), i.forEach((t) => {
        t.positions = t.positions.map((e) => {
          let s = e.internal_account_id;
          if (_.has(e.internal_account_id))
            s = _.get(e.internal_account_id);
          else if (b.has(e.internal_account_id)) {
            const c = b.get(e.internal_account_id);
            c && (s = c);
          }
          return {
            ...e,
            account_display_name: s
          };
        });
      });
      const q = Array.from(i.keys());
      if (q.length === 0)
        return console.log("⚠️ No unique symbols found"), [];
      console.log("💰 Fetching market prices for symbols:", q);
      const { data: F, error: Q } = await n.schema("hf").from("market_price").select("symbol, market_price").in("symbol", q).order("id", { ascending: !1 });
      Q && console.warn("⚠️ Error fetching market prices:", Q);
      const u = /* @__PURE__ */ new Map();
      F && F.forEach((t) => {
        u.has(t.symbol) || u.set(t.symbol, t.market_price);
      }), console.log(`📊 Fetched prices for ${u.size} symbol(s)`);
      const p = [];
      i.forEach((t, e) => {
        const s = u.get(e) ?? null, c = s ? t.totalQuantity * s : 0;
        p.push({
          symbolRoot: e,
          totalQuantity: t.totalQuantity,
          currentMarketPrice: s,
          capitalInvested: c,
          positionCount: t.positions.length,
          positions: t.positions
        });
      }), p.sort((t, e) => e.capitalInvested - t.capitalInvested);
      const w = p.slice(0, 20);
      return console.log("✅ Top 20 positions by capital invested:", {
        totalGroups: p.length,
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
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => {
      console.log("🔄 Positions table changed, invalidating top 20 capital query"), k.invalidateQueries({ queryKey: P });
    }
  ).subscribe();
  return {
    ...v,
    _cleanup: () => {
      var a;
      console.log("🧹 Cleaning up top 20 capital subscription"), (a = r == null ? void 0 : r.unsubscribe) == null || a.call(r);
    }
  };
}
export {
  N as relativeCapitalDeployedQueryKeys,
  R as useTop20PositionsByCapitalQuery
};
