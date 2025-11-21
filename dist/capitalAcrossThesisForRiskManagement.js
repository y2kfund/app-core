import { useQueryClient as I, useQuery as q } from "@tanstack/vue-query";
import { useSupabase as R } from "./index.js";
import { useTop20PositionsByCapitalQuery as S } from "./relativeCapitalDeployedForRiskManagement.js";
const k = {
  all: (c) => ["capitalAcrossThesis", c]
};
function K(c) {
  const p = R(), T = I(), m = k.all(c), C = S(c), A = q({
    queryKey: m,
    queryFn: async () => {
      var w;
      console.log("📊 [CapitalAcrossThesis] Starting query for userId:", c || "all accounts");
      const r = (w = C.data) == null ? void 0 : w.value;
      if (!r || r.length === 0)
        return console.log("⚠️ No top 20 positions found"), [];
      console.log(`✅ Retrieved ${r.length} top positions`);
      const _ = r.map((t) => t.symbolRoot);
      console.log("📋 Symbol roots:", _);
      const { data: i, error: f } = await p.schema("hf").from("positionsAndThesisConnection").select("*").in("symbol_root", _);
      if (f)
        throw console.error("❌ Error fetching thesis connections:", f), f;
      console.log(`🔗 Found ${(i == null ? void 0 : i.length) || 0} thesis connection(s)`);
      const u = /* @__PURE__ */ new Map();
      i && i.forEach((t) => {
        u.has(t.symbol_root) || u.set(t.symbol_root, []), u.get(t.symbol_root).push(t.thesis_id);
      });
      const M = Array.from(
        new Set(
          (i == null ? void 0 : i.map((t) => t.thesis_id)) || []
        )
      );
      let y = /* @__PURE__ */ new Map();
      if (M.length > 0) {
        const { data: t, error: s } = await p.schema("hf").from("thesisMaster").select("*").in("id", M);
        if (s)
          throw console.error("❌ Error fetching thesis master:", s), s;
        console.log(`📚 Fetched ${(t == null ? void 0 : t.length) || 0} thesis record(s)`), t && t.forEach((e) => {
          y.set(e.id, e);
        });
        const l = Array.from(
          new Set(
            (t == null ? void 0 : t.map((e) => e.parent_thesis_id).filter((e) => e !== null)) || []
          )
        );
        if (l.length > 0) {
          const { data: e, error: o } = await p.schema("hf").from("thesisMaster").select("*").in("id", l);
          o && console.error("❌ Error fetching parent thesis:", o), console.log(`👪 Fetched ${(e == null ? void 0 : e.length) || 0} parent thesis record(s)`), e && e.forEach((a) => {
            y.set(a.id, a);
          });
        }
      }
      const d = /* @__PURE__ */ new Map(), v = (t, s, l = null, e = null) => {
        const o = t || "UNASSIGNED";
        return d.has(o) || d.set(o, {
          thesisId: t,
          thesisTitle: s,
          parentThesisId: l,
          parentThesisTitle: e,
          totalCapital: 0,
          symbols: /* @__PURE__ */ new Map()
        }), d.get(o);
      };
      r.forEach((t) => {
        const s = t.symbolRoot, l = u.get(s) || [];
        if (l.length === 0) {
          const e = v(null, "Unassigned");
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
            const a = y.get(o);
            if (!a) {
              console.warn(`⚠️ Thesis ${o} not found in thesisMaster`);
              return;
            }
            let E = null;
            if (a.parent_thesis_id) {
              const g = y.get(a.parent_thesis_id);
              E = (g == null ? void 0 : g.title) || null;
            }
            const b = v(
              a.id,
              a.title,
              a.parent_thesis_id,
              E
            );
            b.totalCapital += e;
            const Q = b.symbols.get(s);
            Q ? Q.capitalInvested += e : b.symbols.set(s, {
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
      return d.forEach((t) => {
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
    enabled: !!C.data,
    // Only run when top20 data is available
    staleTime: 6e4,
    // 1 minute cache
    retry: 2
  }), h = p.channel("capital-across-thesis").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "positionsAndThesisConnection",
      event: "*"
    },
    () => {
      console.log("🔄 positionsAndThesisConnection changed, invalidating query"), T.invalidateQueries({ queryKey: m });
    }
  ).on(
    "postgres_changes",
    {
      schema: "hf",
      table: "thesisMaster",
      event: "*"
    },
    () => {
      console.log("🔄 thesisMaster changed, invalidating query"), T.invalidateQueries({ queryKey: m });
    }
  ).subscribe();
  return {
    ...A,
    _cleanup: () => {
      var r;
      console.log("🧹 Cleaning up capital across thesis subscription"), (r = h == null ? void 0 : h.unsubscribe) == null || r.call(h);
    }
  };
}
export {
  k as capitalAcrossThesisQueryKeys,
  K as useCapitalAcrossThesisQuery
};
