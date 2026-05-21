import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const PLANS = [
  {
    priceId: "price_1TX2FQIQMOY14aKmrFOjQxrP",
    nome: "Mensal",
    valor: "R$ 69,90",
    periodo: "por mês",
    destaque: true,
  },
  {
    priceId: "price_1TX2FQIQMOY14aKmZdT9yiZy",
    nome: "Trimestral",
    valor: "R$ 208,00",
    periodo: "a cada 3 meses",
    destaque: false,
  },
  {
    priceId: "price_1TX2FQIQMOY14aKmD0m61ZWw",
    nome: "Anual",
    valor: "R$ 837,00",
    periodo: "por ano",
    destaque: false,
  },
];

const Billing = () => {
  const sub = useSubscription();
  const [params, setParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") {
      toast.success("Pagamento concluído! Atualizando assinatura…");
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

  const onSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL de checkout não retornada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const onPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("URL do portal não retornada");
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
          Gerencie seu plano e pagamentos com segurança via Stripe.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Status atual</CardTitle>
            <CardDescription>Atualizado em tempo real com a Stripe.</CardDescription>
          </div>
          <Badge variant={sub.active ? "default" : "secondary"}>
            {sub.loading ? "verificando…" : sub.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sub.plan && <p>Plano: <span className="font-medium">{sub.plan}</span></p>}
          {sub.current_period_end && (
            <p>
              {sub.cancel_at_period_end ? "Encerra em " : "Próxima renovação em "}
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

      {sub.active ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar assinatura</CardTitle>
            <CardDescription>Altere ou cancele seu plano quando quiser.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={onPortal} disabled={portalLoading}>
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Acessar portal de pagamentos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => sub.refresh()} disabled={sub.loading}>
              Atualizar status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Escolha seu plano</h2>
          {PLANS.map((plan) => (
            <Card
              key={plan.priceId}
              className={plan.destaque ? "border-primary ring-1 ring-primary/40" : ""}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plan.nome}</CardTitle>
                  {plan.destaque && (
                    <Badge className="text-[10px] flex items-center gap-1">
                      <Star className="h-3 w-3" /> Recomendado
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{plan.valor}</p>
                  <p className="text-xs text-muted-foreground">{plan.periodo}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={plan.destaque ? "default" : "outline"}
                  onClick={() => onSubscribe(plan.priceId)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === plan.priceId && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Assinar {plan.nome}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => sub.refresh()}
            disabled={sub.loading}
          >
            Atualizar status
          </Button>
        </div>
      )}
    </main>
  );
};

export default Billing;
