import { useQueryClient as o, useQuery as y } from "@tanstack/vue-query";
import { useSupabase as b } from "./index.js";
function p(u) {
  const i = b(), a = ["nlvMargin", u], n = o(), c = y({
    queryKey: a,
    queryFn: async () => {
      const { data: t, error: s } = await i.schema("hf").rpc("get_nlv_margin", {
        p_limit: 10
      });
      if (s) throw s;
      return t || [];
    },
    staleTime: 6e4
  }), e = i.channel("netliquidation_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "netliquidation",
      event: "*"
    },
    () => n.invalidateQueries({ queryKey: a })
  ).subscribe(), r = i.channel("maintenance_margin_all").on(
    "postgres_changes",
    {
      schema: "hf",
      table: "maintenance_margin",
      event: "*"
    },
    () => n.invalidateQueries({ queryKey: a })
  ).subscribe();
  return {
    ...c,
    _cleanup: () => {
      var t, s;
      (t = e == null ? void 0 : e.unsubscribe) == null || t.call(e), (s = r == null ? void 0 : r.unsubscribe) == null || s.call(r);
    }
  };
}
export {
  p as useNlvMarginQuery
};
