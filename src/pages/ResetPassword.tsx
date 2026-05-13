import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase delivers a recovery session via URL hash. Wait for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada");
    navigate("/", { replace: true });
  };

  return (
    <AuthShell title="Redefinir senha" subtitle="Defina uma nova senha para sua conta.">
      {!ready ? (
        <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="field-label">Nova senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-1.5">
            <label className="field-label">Confirmar nova senha</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring"
              placeholder="Repita a senha"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary-corp w-full h-11 rounded-lg disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
