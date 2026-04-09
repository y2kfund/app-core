import { computed as M } from "vue";
import { useQueryClient as q, useQuery as R } from "@tanstack/vue-query";
import { useSupabase as A } from "./index.js";
import { useTop20PositionsByCapitalQuery as S } from "./relativeCapitalDeployedForRiskManagement.js";
const k = {
  all: (c) => ["capitalAcrossThesis", c]
};
function x(c) {
  const p = A(), T = q(), d = k.all(c), f = S(c), I = R({
    queryKey: d,
    queryFn: async () => {
      console.log("📊 [CapitalAcrossThesis] Starting query for userId:", c || "all accounts");
      const i = f.data.value;
      if (!i || i.length === 0)
        return console.log("⚠️ No top 20 positions found"), [];
      console.log(`✅ Retrieved ${i.length} top positions`);
      const C = i.map((t) => t.symbolRoot);
      console.log("📋 Symbol roots:", C);
      const { data: r, error: _ } = await p.schema("fund_ai").from("p_positions_thesis_connections").select("*").in("symbol_root", C);
      if (_)
        throw console.error("❌ Error fetching thesis connections:", _), _;
      console.log(`🔗 Found ${(r == null ? void 0 : r.length) || 0} thesis connection(s)`);
      const u = /* @__PURE__ */ new Map();
      r && r.forEach((t) => {
        u.has(t.symbol_root) || u.set(t.symbol_root, []), u.get(t.symbol_root).push(t.thesis_id);
      });
      const v = Array.from(
        new Set(
          (r == null ? void 0 : r.map((t) => t.thesis_id)) || []
        )
      );
      let m = /* @__PURE__ */ new Map();
      if (v.length > 0) {
        const { data: t, error: s } = await p.schema("fund_ai").from("p_thesis_master").select("*").in("id", v);
        if (s)
          throw console.error("❌ Error fetching thesis master:", s), s;
        console.log(`📚 Fetched ${(t == null ? void 0 : t.length) || 0} thesis record(s)`), t && t.forEach((e) => {
          m.set(e.id, e);
        });
        const l = Array.from(
          new Set(
            (t == null ? void 0 : t.map((e) => e.parent_thesis_id).filter((e) => e !== null)) || []
          )
        );
        if (l.length > 0) {
          const { data: e, error: o } = await p.schema("fund_ai").from("p_thesis_master").select("*").in("id", l);
          o && console.error("❌ Error fetching parent thesis:", o), console.log(`👪 Fetched ${(e == null ? void 0 : e.length) || 0} parent thesis record(s)`), e && e.forEach((a) => {
            m.set(a.id, a);
          });
        }
      }
      const y = /* @__PURE__ */ new Map(), w = (t, s, l = null, e = null) => {
        const o = t || "UNASSIGNED";
        return y.has(o) || y.set(o, {
          thesisId: t,
          thesisTitle: s,
          parentThesisId: l,
          parentThesisTitle: e,
          totalCapital: 0,
          symbols: /* @__PURE__ */ new Map()
        }), y.get(o);
      };
      i.forEach((t) => {
        const s = t.symbolRoot, l = u.get(s) || [];
        if (l.length === 0) {
          const e = w(null, "Unassigned");
          e.totalCapital += t.capitalInvested, e.symbols.set(s, {
            symbolRoot: t.symbolRoot,
            capitalInvested: t.capitalInvested,
            totalQuantity: t.totalQuantity,
            currentMarketPrice: t.currentMarketPrice,
            positionCount: t.positionCount
          });
        } else {
          const e = t.capitalInvested / l.length;
          l.forEach((o) => {
            const a = m.get(o);
            if (!a) {
              console.warn(`⚠️ Thesis ${o} not found in p_thesis_master`);
              return;
            }
            let E = null;
            if (a.parent_thesis_id) {
              const b = m.get(a.parent_thesis_id);
              E = (b == null ? void 0 : b.title) || null;
            }
            const g = w(
              a.id,
              a.title,
              a.parent_thesis_id,
              E
            );
            g.totalCapital += e;
            const Q = g.symbols.get(s);
            Q ? Q.capitalInvested += e : g.symbols.set(s, {
              symbolRoot: t.symbolRoot,
              capitalInvested: e,
              totalQuantity: t.totalQuantity,
              currentMarketPrice: t.currentMarketPrice,
              positionCount: t.positionCount
            });
          });
        }
      });
      const n = [];
      return y.forEach((t) => {
        n.push({
          thesisId: t.thesisId,
          thesisTitle: t.thesisTitle,
          parentThesisId: t.parentThesisId,
          parentThesisTitle: t.parentThesisTitle,
          totalCapital: t.totalCapital,
          symbolCount: t.symbols.size,
          symbols: Array.from(t.symbols.values())
        });
      }), n.sort((t, s) => s.totalCapital - t.totalCapital), console.log("✅ Capital across thesis calculated:", {
        thesisCount: n.length,
        totalCapital: n.reduce((t, s) => t + s.totalCapital, 0),
        breakdown: n.map((t) => ({
          thesis: t.thesisTitle,
          parent: t.parentThesisTitle || "none",
          capital: `$${t.totalCapital.toFixed(2)}`,
          symbols: t.symbolCount
        }))
      }), n;
    },
    enabled: M(() => !!f.data.value && f.data.value.length > 0),
    // Only run when top20 data is available
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
  }), h = p.channel("capital-across-thesis").on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_positions_thesis_connections",
      event: "*"
    },
    () => {
      console.log("🔄 p_positions_thesis_connections changed, invalidating query"), T.invalidateQueries({ queryKey: d });
    }
  ).on(
    "postgres_changes",
    {
      schema: "fund_ai",
      table: "p_thesis_master",
      event: "*"
    },
    () => {
      console.log("🔄 p_thesis_master changed, invalidating query"), T.invalidateQueries({ queryKey: d });
    }
  ).subscribe();
  return {
    ...I,
    _cleanup: () => {
      var i;
      console.log("🧹 Cleaning up capital across thesis subscription"), (i = h == null ? void 0 : h.unsubscribe) == null || i.call(h);
    }
  };
}
export {
  k as capitalAcrossThesisQueryKeys,
  x as useCapitalAcrossThesisQuery
};
