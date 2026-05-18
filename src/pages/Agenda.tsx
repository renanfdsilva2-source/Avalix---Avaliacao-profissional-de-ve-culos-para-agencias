import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Trash2, Plus, BellRing } from "lucide-react";
import { PremiumGate } from "@/components/PremiumGate";

interface Appointment {
  id: string;
  title: string;
  notes: string | null;
  scheduled_at: string;
  alarm_fired: boolean;
}

const toLocalInput = (d: Date) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

export default function Agenda() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id,title,notes,scheduled_at,alarm_fired")
      .order("scheduled_at", { ascending: true });
    if (error) toast.error("Erro ao carregar agendamentos");
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Informe um título");
    const date = new Date(when);
    if (isNaN(date.getTime())) return toast.error("Data inválida");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Sessão expirada"); }
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      title: title.trim(),
      notes: notes.trim() || null,
      scheduled_at: date.toISOString(),
    });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Agendamento criado");
    setTitle(""); setNotes("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    setItems((s) => s.filter((i) => i.id !== id));
  };

  const testAlarm = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ scheduled_at: new Date().toISOString(), alarm_fired: false })
      .eq("id", id);
    if (error) return toast.error("Erro ao disparar");
    toast.success("Alarme tocará em até 15s");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold">Agenda de avaliações</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <PremiumGate feature="a agenda de avaliações">

        <form onSubmit={create} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Novo agendamento</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Avaliação Honda Civic - João" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="when">Data e hora</Label>
            <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Endereço, telefone, observações..." />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Agendar"}
          </Button>
        </form>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximos</h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-6 text-center">
              Nenhum agendamento ainda.
            </div>
          ) : (
            items.map((a) => {
              const d = new Date(a.scheduled_at);
              const past = d.getTime() < Date.now();
              return (
                <div key={a.id} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${past ? "bg-muted-foreground" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{d.toLocaleString("pt-BR")}</div>
                    {a.notes && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{a.notes}</div>}
                  </div>
                  <button onClick={() => testAlarm(a.id)} className="p-2 rounded-md hover:bg-muted text-primary" title="Testar alarme agora">
                    <BellRing className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(a.id)} className="p-2 rounded-md hover:bg-muted text-destructive" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </section>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          O alarme só toca com o app aberto. Mantenha esta aba ativa para receber a notificação sonora.
        </p>
      </main>
    </div>
  );
}
