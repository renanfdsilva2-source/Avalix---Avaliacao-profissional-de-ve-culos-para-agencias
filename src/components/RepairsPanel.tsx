import { Plus, Trash2 } from "lucide-react";

export interface RepairItem {
  label: string;
  checked: boolean;
  value: string; // string for input
}
export interface CustomRepair {
  label: string;
  value: string;
}

export interface RepairCategory {
  category: string;
  items: string[];
}

export const REPAIR_CATEGORIES: RepairCategory[] = [
  {
    category: "Mecânica",
    items: [
      "Freios",
      "Suspensão",
      "Embreagem",
      "Motor (revisão)",
      "Câmbio",
      "Direção",
      "Alinhamento / Balanceamento",
      "Escapamento",
    ],
  },
  {
    category: "Elétrica",
    items: [
      "Bateria",
      "Vidros elétricos",
      "Faróis / Lanternas",
      "Ar-condicionado",
    ],
  },
  {
    category: "Itens internos",
    items: [
      "Bancos (estofado)",
      "Forração / carpete",
      "Painel / console",
      "Som / multimídia",
      "Volante / câmbio (revestimento)",
      "Forro do teto",
      "Tapetes",
      "Cintos de segurança",
      "Maçanetas internas",
      "Quebra-sol / espelho interno",
    ],
  },
];

// Flat list of every default item, preserving category order.
export const DEFAULT_REPAIRS: Omit<RepairItem, "checked" | "value">[] =
  REPAIR_CATEGORIES.flatMap((c) => c.items.map((label) => ({ label })));

interface RepairsPanelProps {
  items: RepairItem[];
  onItemsChange: (items: RepairItem[]) => void;
  customs: CustomRepair[];
  onCustomsChange: (items: CustomRepair[]) => void;
}

export const RepairsPanel = ({ items, onItemsChange, customs, onCustomsChange }: RepairsPanelProps) => {
  const updateByLabel = (label: string, patch: Partial<RepairItem>) => {
    onItemsChange(items.map((it) => (it.label === label ? { ...it, ...patch } : it)));
  };
  const findItem = (label: string) =>
    items.find((it) => it.label === label) || { label, checked: false, value: "" };

  const addCustom = () => onCustomsChange([...customs, { label: "", value: "" }]);
  const updateCustom = (i: number, patch: Partial<CustomRepair>) => {
    const next = [...customs];
    next[i] = { ...next[i], ...patch };
    onCustomsChange(next);
  };
  const removeCustom = (i: number) => onCustomsChange(customs.filter((_, idx) => idx !== i));

  // Items that exist in state but aren't part of any known category (e.g. legacy)
  const knownLabels = new Set(DEFAULT_REPAIRS.map((d) => d.label));
  const extras = items.filter((it) => !knownLabels.has(it.label));

  return (
    <div className="space-y-5">
      {REPAIR_CATEGORIES.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary-glow">
              {cat.category}
            </span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <div className="space-y-2">
            {cat.items.map((label) => {
              const item = findItem(label);
              return (
                <div
                  key={label}
                  className={`rounded-xl border transition-smooth ${
                    item.checked ? "bg-primary/5 border-primary/40" : "bg-muted/30 border-border"
                  }`}
                >
                  <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => updateByLabel(label, { checked: !item.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex-1 text-sm font-medium">{label}</span>
                    {item.checked && (
                      <input
                        inputMode="decimal"
                        placeholder="R$ 0,00"
                        value={item.value}
                        onChange={(e) => updateByLabel(label, { value: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-28 h-9 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary"
                      />
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {extras.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
              Outros
            </span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          {extras.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border transition-smooth ${
                item.checked ? "bg-primary/5 border-primary/40" : "bg-muted/30 border-border"
              }`}
            >
              <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => updateByLabel(item.label, { checked: !item.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.checked && (
                  <input
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    value={item.value}
                    onChange={(e) => updateByLabel(item.label, { value: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-28 h-9 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary"
                  />
                )}
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="field-label">Reparos personalizados</span>
          <button
            type="button"
            onClick={addCustom}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
        {customs.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum reparo personalizado.</p>
        )}
        {customs.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              placeholder="Descrição do reparo"
              value={c.label}
              onChange={(e) => updateCustom(i, { label: e.target.value })}
              className="flex-1 h-10 rounded-lg bg-input/70 border border-border px-3 text-sm focus:outline-none focus:border-primary"
            />
            <input
              inputMode="decimal"
              placeholder="R$"
              value={c.value}
              onChange={(e) => updateCustom(i, { value: e.target.value })}
              className="w-28 h-10 rounded-lg bg-input/70 border border-border px-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => removeCustom(i)}
              className="h-10 w-10 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive flex items-center justify-center"
              aria-label="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
