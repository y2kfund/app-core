import { computed as Q } from "vue";
import { useQueryClient as k, useQuery as C } from "@tanstack/vue-query";
import { useSupabase as F } from "./index.js";
import { useTop20PositionsByCapitalQuery as q } from "./relativeCapitalDeployedForRiskManagement.js";
const $ = {
  all: (a) => ["peRatioAnalysis", a]
};
function T(a) {
  const P = F(), E = k(), h = $.all(a), y = q(a), W = C({
    queryKey: h,
    queryFn: async () => {
      console.log("📊 [PEAnalysis] Starting P/E ratio analysis for userId:", a || "all accounts");
      const s = y.data.value;
      if (!s || s.length === 0)
        return console.log("⚠️ No top 20 positions found"), {
          positions: [],
          statistics: {
            averagePE: null,
            medianPE: null,
            minPE: null,
            maxPE: null,
            totalCapital: 0,
            capitalWithPE: 0,
            capitalWithoutPE: 0,
            symbolsWithPE: 0,
            symbolsWithoutPE: 0
          }
        };
      console.log(`✅ Retrieved ${s.length} top positions`);
      const _ = s.map((o) => o.symbolRoot);
      console.log("📋 Symbol roots:", _);
      const { data: n, error: m } = await P.schema("fund_ai").from("p_positions_financial_data").select("*").in("symbol", _);
      if (m)
        throw console.error("❌ Error fetching financial data:", m), m;
      console.log(`💰 Found ${(n == null ? void 0 : n.length) || 0} financial data record(s)`);
      const R = /* @__PURE__ */ new Map();
      n && n.forEach((o) => {
        R.set(o.symbol, o);
      });
      const r = s.map((o) => {
        const t = R.get(o.symbolRoot);
        return {
          symbolRoot: o.symbolRoot,
          capitalInvested: o.capitalInvested,
          totalQuantity: o.totalQuantity,
          currentMarketPrice: o.currentMarketPrice,
          positionCount: o.positionCount,
          // Financial data (null if not found)
          peRatio: (t == null ? void 0 : t.pe_ratio) || null,
          eps: (t == null ? void 0 : t.eps) || null,
          marketCap: (t == null ? void 0 : t.market_cap) || null,
          week52High: (t == null ? void 0 : t.week_52_high) || null,
          week52Low: (t == null ? void 0 : t.week_52_low) || null,
          computedPegRatio: (t == null ? void 0 : t.computed_peg_ratio) || null,
          lastUpdatedAt: (t == null ? void 0 : t.last_updated_at) || null
        };
      }), e = r.filter((o) => o.peRatio !== null), g = r.filter((o) => o.peRatio === null), b = r.reduce((o, t) => o + t.capitalInvested, 0), v = e.reduce((o, t) => o + t.capitalInvested, 0), f = g.reduce((o, t) => o + t.capitalInvested, 0);
      let u = null;
      e.length > 0 && (u = e.reduce((t, p) => t + (p.peRatio || 0), 0) / e.length);
      let l = null;
      if (e.length > 0) {
        const o = e.map((p) => p.peRatio).sort((p, x) => p - x), t = Math.floor(o.length / 2);
        o.length % 2 === 0 ? l = (o[t - 1] + o[t]) / 2 : l = o[t];
      }
      const c = e.length > 0 ? Math.min(...e.map((o) => o.peRatio)) : null, d = e.length > 0 ? Math.max(...e.map((o) => o.peRatio)) : null, w = {
        positions: [...r].sort((o, t) => o.peRatio === null && t.peRatio !== null ? 1 : o.peRatio !== null && t.peRatio === null ? -1 : o.peRatio === null && t.peRatio === null ? t.capitalInvested - o.capitalInvested : o.peRatio - t.peRatio),
        statistics: {
          averagePE: u,
          medianPE: l,
          minPE: c,
          maxPE: d,
          totalCapital: b,
          capitalWithPE: v,
          capitalWithoutPE: f,
          symbolsWithPE: e.length,
          symbolsWithoutPE: g.length
        }
      };
      return console.log("✅ P/E ratio analysis completed:", {
        totalPositions: r.length,
        withPE: e.length,
        withoutPE: g.length,
        averagePE: u == null ? void 0 : u.toFixed(2),
        medianPE: l == null ? void 0 : l.toFixed(2),
        minPE: c == null ? void 0 : c.toFixed(2),
        maxPE: d == null ? void 0 : d.toFixed(2),
        totalCapital: `$${b.toFixed(2)}`,
        capitalWithPE: `$${v.toFixed(2)}`,
        capitalWithoutPE: `$${f.toFixed(2)}`
      }), w;
    },
    enabled: Q(() => !!y.data.value && y.data.value.length > 0),
    // Only run when top20 data is available
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
  }), i = P.channel("pe-ratio-analysis").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_positions_positions",
      event: "*"
    },
    () => {
      console.log("🔄 positions changed, invalidating P/E analysis query"), E.invalidateQueries({ queryKey: h });
    }
  ).on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_positions_financial_data",
      event: "*"
    },
    () => {
      console.log("🔄 financial_data changed, invalidating P/E analysis query"), E.invalidateQueries({ queryKey: h });
    }
  ).subscribe();
  return {
    ...W,
    _cleanup: () => {
      var s;
      console.log("🧹 Cleaning up P/E analysis subscription"), (s = i == null ? void 0 : i.unsubscribe) == null || s.call(i);
    }
  };
}
export {
  $ as peRatioAnalysisQueryKeys,
  T as usePEAnalysisQuery
};
