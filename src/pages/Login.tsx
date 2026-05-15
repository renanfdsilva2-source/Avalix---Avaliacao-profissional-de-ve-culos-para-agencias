import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { authErrorMessage, withAuthTimeout } from "@/lib/authTimeout";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await withAuthTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
      );
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message);
        return;
      }
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
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
