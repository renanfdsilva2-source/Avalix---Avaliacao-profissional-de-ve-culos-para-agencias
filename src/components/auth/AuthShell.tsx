import { AvalixLogo } from "@/components/AvalixLogo";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(214_100%_43%/0.25),transparent_55%),radial-gradient(circle_at_85%_85%,hsl(211_100%_52%/0.18),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
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

        <div className="panel !p-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} AVALIX · Plataforma Corporativa de Avaliação Veicular
        </p>
      </div>
    </div>
  );
}
