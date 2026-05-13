import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { PROD_URL } from "@/lib/authConfig";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${PROD_URL}/`,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Conta criada com sucesso");
      navigate("/", { replace: true });
    } else {
      toast.success("Verifique seu email para confirmar a conta");
      navigate("/login", { replace: true });
    }
  };

  const inputCls =
    "w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring";

  return (
    <AuthShell title="Criar conta" subtitle="Cadastre-se para acessar a plataforma.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="field-label">Nome completo</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Senha</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Confirmar senha</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="Repita a senha"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary-corp w-full h-11 rounded-lg disabled:opacity-60">
          {loading ? "Criando..." : "Criar conta"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary-glow font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
