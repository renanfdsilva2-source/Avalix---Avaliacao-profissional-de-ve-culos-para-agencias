import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const PRICE_ID = "price_1TX2FQIQMOY14aKmD0m61ZWw";

const Billing = () => {
  const sub = useSubscription();
  const [params, setParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") {
      toast.success("Pagamento conclu\u00eddo! Atualizando assinatura\u2026");
      sub.refresh();
      params.delete("status");
      params.delete("session_id");
      setParams(params, { replace: true });
    } else if (status === "canceled") {
      toast.info("Checkout cancelado.");
      params.delete("status");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL de checkout n\u00e3o retornada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const onPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL do portal n\u00e3o retornada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano e pagamentos com seguran\u00e7a via Stripe.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Status atual</CardTitle>
            <CardDescription>Atualizado em tempo real com a Stripe.</CardDescription>
          </div>
          <Badge variant={sub.active ? "default" : "secondary"}>
            {sub.loading ? "verificando\u2026" : sub.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sub.plan && <p>Plano: <span className="font-medium">{sub.plan}</span></p>}
          {sub.current_period_end && (
            <p>
              {sub.cancel_at_period_end ? "Encerra em " : "Pr\u00f3xima renova\u00e7\u00e3o em "}
              <span className="font-medium">
                {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
              </span>
            </p>
          )}
          {sub.active && (
            <p className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Assinatura ativa
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plano Avalix Pro</CardTitle>
          <CardDescription>Acesso completo \u00e0 plataforma de avalia\u00e7\u00e3o.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sub.active ? (
            <Button onClick={onPortal} disabled={portalLoading}>
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerenciar assinatura
            </Button>
          ) : (
            <Button onClick={onSubscribe} disabled={checkoutLoading}>
              {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assinar agora
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => sub.refresh()} disabled={sub.loading}>
            Atualizar status
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default Billing;
