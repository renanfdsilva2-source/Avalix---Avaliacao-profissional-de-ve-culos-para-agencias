import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
};

export const PremiumGate = ({ children, fallback, feature = "este recurso" }: Props) => {
  const { active, loading } = useSubscription();
  if (loading) return null;
  if (active) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Assinatura necess\u00e1ria para usar {feature}.
      </p>
      <Button asChild size="sm">
        <Link to="/billing">Ver planos</Link>
      </Button>
    </div>
  );
};
