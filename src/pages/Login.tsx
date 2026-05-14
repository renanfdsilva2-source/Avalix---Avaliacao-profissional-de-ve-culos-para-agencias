import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AvalixLogo } from "@/components/AvalixLogo";
import { Lock, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthShell
      title="Acesso ao sistema"
      subtitle="Plataforma corporativa de avaliação veicular."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="field-label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-9 pr-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring"
              placeholder="voce@empresa.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="field-label">Senha</label>
            <Link to="/forgot-password" className="text-[11px] font-semibold text-primary-glow hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-9 pr-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-corp w-full h-11 rounded-lg disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link
          to="/register"
          className="block text-center w-full h-11 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-smooth text-sm font-semibold leading-[2.5rem]"
        >
          Criar conta
        </Link>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full h-11 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-smooth text-sm font-semibold flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
          </svg>
          Continuar com Google
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
      </form>
    </AuthShell>
  );
}
