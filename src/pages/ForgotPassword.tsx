import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { PROD_URL } from "@/lib/authConfig";
import { authErrorMessage, withAuthTimeout } from "@/lib/authTimeout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await withAuthTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${PROD_URL}/reset-password`,
        }),
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Email de recuperação enviado");
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      {sent ? (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Se houver uma conta com <span className="text-foreground font-semibold">{email}</span>, você receberá um email com instruções.
          </p>
          <Link to="/login" className="block text-center w-full h-11 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-smooth font-semibold leading-[2.5rem]">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none text-sm focus-ring"
              placeholder="voce@empresa.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary-corp w-full h-11 rounded-lg disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary-glow font-semibold hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
