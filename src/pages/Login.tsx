import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useState } from "react";
import { AvalixLogo } from "@/components/AvalixLogo";
import { ShieldCheck, Lock } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Decorative corporate backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(214_100%_43%/0.25),transparent_55%),radial-gradient(circle_at_85%_85%,hsl(211_100%_52%/0.18),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand block */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-5">
            <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[hsl(214_50%_14%)] to-[hsl(213_64%_7%)] border border-primary/30 flex items-center justify-center shadow-elevated">
              <AvalixLogo size={52} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[0.18em] text-foreground">
            AVAL<span className="text-primary-glow">I</span>X
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-[10px] font-semibold tracking-[0.32em] text-muted-foreground">
              AVALIAÇÃO DE VEÍCULOS
            </span>
            <span className="h-px w-8 bg-primary/60" />
          </div>
        </div>

        {/* Card */}
        <div className="panel !p-7 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Acesso ao sistema</h2>
            <p className="text-sm text-muted-foreground">
              Plataforma corporativa de avaliação veicular. Entre com sua conta Google autorizada.
            </p>
          </div>

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-white text-[hsl(213_64%_12%)] font-semibold flex items-center justify-center gap-3 shadow-button hover:bg-white/95 transition-smooth disabled:opacity-60 border border-white/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.4 35.8 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            {loading ? "Conectando..." : "Entrar com Google"}
          </button>

          <div className="corporate-divider" />

          <div className="grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary-glow" />
              <span>Conexão criptografada</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-glow" />
              <span>Conformidade LGPD</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} AVALIX · Plataforma Corporativa de Avaliação Veicular
        </p>
      </div>
    </div>
  );
}
