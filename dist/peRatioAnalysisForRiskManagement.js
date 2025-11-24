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
      const R = s.map((e) => e.symbolRoot);
      console.log("📋 Symbol roots:", R);
      const { data: i, error: m } = await P.schema("hf").from("financial_data").select("*").in("symbol", R);
      if (m)
        throw console.error("❌ Error fetching financial data:", m), m;
      console.log(`💰 Found ${(i == null ? void 0 : i.length) || 0} financial data record(s)`);
      const b = /* @__PURE__ */ new Map();
      i && i.forEach((e) => {
        b.set(e.symbol, e);
      });
      const r = s.map((e) => {
        const t = b.get(e.symbolRoot);
        return {
          symbolRoot: e.symbolRoot,
          capitalInvested: e.capitalInvested,
          totalQuantity: e.totalQuantity,
          currentMarketPrice: e.currentMarketPrice,
          positionCount: e.positionCount,
          // Financial data (null if not found)
          peRatio: (t == null ? void 0 : t.pe_ratio) || null,
          eps: (t == null ? void 0 : t.eps) || null,
          marketCap: (t == null ? void 0 : t.market_cap) || null,
          week52High: (t == null ? void 0 : t.week_52_high) || null,
          week52Low: (t == null ? void 0 : t.week_52_low) || null,
          computedPegRatio: (t == null ? void 0 : t.computed_peg_ratio) || null,
          lastUpdatedAt: (t == null ? void 0 : t.last_updated_at) || null
        };
      }), o = r.filter((e) => e.peRatio !== null), g = r.filter((e) => e.peRatio === null), v = r.reduce((e, t) => e + t.capitalInvested, 0), f = o.reduce((e, t) => e + t.capitalInvested, 0), _ = g.reduce((e, t) => e + t.capitalInvested, 0);
      let u = null;
      o.length > 0 && (u = o.reduce((t, p) => t + (p.peRatio || 0), 0) / o.length);
      let l = null;
      if (o.length > 0) {
        const e = o.map((p) => p.peRatio).sort((p, x) => p - x), t = Math.floor(e.length / 2);
        e.length % 2 === 0 ? l = (e[t - 1] + e[t]) / 2 : l = e[t];
      }
      const c = o.length > 0 ? Math.min(...o.map((e) => e.peRatio)) : null, d = o.length > 0 ? Math.max(...o.map((e) => e.peRatio)) : null, w = {
        positions: [...r].sort((e, t) => e.peRatio === null && t.peRatio !== null ? 1 : e.peRatio !== null && t.peRatio === null ? -1 : e.peRatio === null && t.peRatio === null ? t.capitalInvested - e.capitalInvested : e.peRatio - t.peRatio),
        statistics: {
          averagePE: u,
          medianPE: l,
          minPE: c,
          maxPE: d,
          totalCapital: v,
          capitalWithPE: f,
          capitalWithoutPE: _,
          symbolsWithPE: o.length,
          symbolsWithoutPE: g.length
        }
      };
      return console.log("✅ P/E ratio analysis completed:", {
        totalPositions: r.length,
        withPE: o.length,
        withoutPE: g.length,
        averagePE: u == null ? void 0 : u.toFixed(2),
        medianPE: l == null ? void 0 : l.toFixed(2),
        minPE: c == null ? void 0 : c.toFixed(2),
        maxPE: d == null ? void 0 : d.toFixed(2),
        totalCapital: `$${v.toFixed(2)}`,
        capitalWithPE: `$${f.toFixed(2)}`,
        capitalWithoutPE: `$${_.toFixed(2)}`
      }), w;
    },
    enabled: Q(() => !!y.data.value && y.data.value.length > 0),
    // Only run when top20 data is available
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
  }), n = P.channel("pe-ratio-analysis").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positions",
      event: "*"
    },
    () => {
      console.log("🔄 positions changed, invalidating P/E analysis query"), E.invalidateQueries({ queryKey: h });
    }
  ).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "financial_data",
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
      console.log("🧹 Cleaning up P/E analysis subscription"), (s = n == null ? void 0 : n.unsubscribe) == null || s.call(n);
    }
  };
}
export {
  $ as peRatioAnalysisQueryKeys,
  T as usePEAnalysisQuery
};
