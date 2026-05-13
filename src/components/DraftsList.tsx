import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, Trash2, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  id: string;
  status: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  valor_final: number;
  updated_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (id: string) => void;
}

export const DraftsList = ({ open, onClose, onLoad }: Props) => {
  const [items, setItems] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("evaluations")
      .select("id,status,placa,marca,modelo,valor_final,updated_at")
      .order("updated_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar avaliações");
        else setItems((data ?? []) as Draft[]);
        setLoading(false);
      });
  }, [open]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    const { error } = await supabase.from("evaluations").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    setItems((s) => s.filter((i) => i.id !== id));
    toast.success("Avaliação excluída");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" /> Avaliações salvas
        </h3>
        <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center">
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma avaliação salva ainda.</p>
          </div>
        )}
        <ul className="space-y-2">
          {items.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3"
            >
              <button onClick={() => onLoad(d.id)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      d.status === "final" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.status === "final" ? "Final" : "Rascunho"}
                  </span>
                  <span className="font-semibold truncate">
                    {d.placa || "Sem placa"} — {d.marca} {d.modelo}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>{new Date(d.updated_at).toLocaleString("pt-BR")}</span>
                  <span className="font-semibold text-primary tabular-nums">
                    {Number(d.valor_final).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </button>
              <button
                onClick={() => remove(d.id)}
                className="h-10 w-10 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive flex items-center justify-center"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
