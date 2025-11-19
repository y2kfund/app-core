import { useQueryClient as v, useQuery as T } from "@tanstack/vue-query";
import { useSupabase as E, fetchUserAccessibleAccounts as F } from "./index.js";
const A = {
  top20: (e) => ["relativeCapitalDeployed", "top20", e]
};
function C(e) {
  if (!e) return "";
  const o = e.match(/^([A-Z]+)/);
  return o ? o[1] : e.split(/\s+/)[0];
}
function S(e, o) {
  return o === "STK" ? !0 : o === "OPT" ? e.includes(" P ") || e.includes(" P[") : !1;
}
function M(e) {
  const o = E(), k = v(), _ = A.top20(e), w = T({
    queryKey: _,
    queryFn: async () => {
      console.log("🔍 [Top20Capital] Querying with:", {
        userId: e || "none (all accounts)"
      });
      const n = await F(o, e);
      e && n.length === 0 ? console.log("⚠️ User has no account access restrictions - showing all accounts") : n.length > 0 && console.log("🔒 User has access to accounts:", n);
      const { data: f, error: h } = await o.schema("hf").from("positions").select("fetched_at").order("fetched_at", { ascending: !1 }).limit(1).single();
      if (h)
        throw console.error("❌ Error fetching latest fetched_at:", h), h;
      if (!f || !f.fetched_at)
        return console.log("⚠️ No positions found in database"), [];
      const q = f.fetched_at;
      console.log("📅 Latest fetched_at:", q);
      let d = o.schema("hf").from("positions").select("*").eq("fetched_at", q).in("asset_class", ["STK", "OPT"]);
      n.length > 0 && (d = d.in("internal_account_id", n));
      const { data: c, error: y } = await d;
      if (y)
        throw console.error("❌ Error fetching positions:", y), y;
      if (!c || c.length === 0)
        return console.log("📊 No positions found matching criteria"), [];
      console.log(`✅ Fetched ${c.length} position(s) from database`);
      const g = c.filter(
        (t) => S(t.symbol, t.asset_class)
      );
      if (console.log(`🔽 Filtered to ${g.length} position(s) (STK + PUT options only)`), g.length === 0)
        return console.log("⚠️ No positions after filtering"), [];
      const i = /* @__PURE__ */ new Map();
      g.forEach((t) => {
        const s = C(t.symbol);
        if (!s) return;
        const r = Math.abs(t.accounting_quantity ?? t.qty ?? 0);
        i.has(s) || i.set(s, {
          totalQuantity: 0,
          positions: []
        });
        const p = i.get(s);
        p.totalQuantity += r, p.positions.push(t);
      }), console.log(`📦 Grouped into ${i.size} unique symbol(s)`);
      const m = Array.from(i.keys());
      if (m.length === 0)
        return console.log("⚠️ No unique symbols found"), [];
      console.log("💰 Fetching market prices for symbols:", m);
      const { data: P, error: Q } = await o.schema("hf").from("market_price").select("symbol, market_price").in("symbol", m).order("id", { ascending: !1 });
      Q && console.warn("⚠️ Error fetching market prices:", Q);
      const l = /* @__PURE__ */ new Map();
      P && P.forEach((t) => {
        l.has(t.symbol) || l.set(t.symbol, t.market_price);
      }), console.log(`📊 Fetched prices for ${l.size} symbol(s)`);
      const u = [];
      i.forEach((t, s) => {
        const r = l.get(s) ?? null, p = r ? t.totalQuantity * r : 0;
        u.push({
          symbolRoot: s,
          totalQuantity: t.totalQuantity,
          currentMarketPrice: r,
          capitalInvested: p,
          positionCount: t.positions.length,
          positions: t.positions
        });
      }), u.sort((t, s) => s.capitalInvested - t.capitalInvested);
      const b = u.slice(0, 20);
      return console.log("✅ Top 20 positions by capital invested:", {
        totalGroups: u.length,
        top20Count: b.length,
        top20Symbols: b.map((t) => `${t.symbolRoot}: $${t.capitalInvested.toFixed(2)}`)
      }), b;
    },
    enabled: !0,
    // Always enabled
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
    // Retry failed queries up to 2 times
  }), a = o.channel("top20-capital-deployed").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => {
      console.log("🔄 Positions table changed, invalidating top 20 capital query"), k.invalidateQueries({ queryKey: _ });
    }
  ).subscribe();
  return {
    ...w,
    _cleanup: () => {
      var n;
      console.log("🧹 Cleaning up top 20 capital subscription"), (n = a == null ? void 0 : a.unsubscribe) == null || n.call(a);
    }
  };
}
export {
  A as relativeCapitalDeployedQueryKeys,
  M as useTop20PositionsByCapitalQuery
};
