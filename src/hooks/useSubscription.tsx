import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionInfo = {
  active: boolean;
  status: string;
  plan: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

const DEFAULT: SubscriptionInfo = {
  active: false,
  status: "inactive",
  plan: null,
  current_period_end: null,
  cancel_at_period_end: false,
};

export function useSubscription() {
  const [data, setData] = useState<SubscriptionInfo>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Leitura r\u00e1pida do cache local em subscribers
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setData(DEFAULT);
        return;
      }
      const { data: row } = await supabase
        .from("subscribers")
        .select("status, plan, current_period_end, cancel_at_period_end")
        .maybeSingle();
      if (row) {
        setData({
          active: ["active", "trialing"].includes(row.status),
          status: row.status,
          plan: row.plan,
          current_period_end: row.current_period_end,
          cancel_at_period_end: row.cancel_at_period_end,
        });
      }

      // 2) Sincroniza com Stripe em background
      const { data: fresh, error: fnErr } = await supabase.functions.invoke("check-subscription");
      if (fnErr) throw fnErr;
      if (fresh) {
        setData({
          active: !!fresh.active,
          status: fresh.status ?? "inactive",
          plan: fresh.plan ?? null,
          current_period_end: fresh.current_period_end
            ? new Date(fresh.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: !!fresh.cancel_at_period_end,
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
