import { Plus, Trash2 } from "lucide-react";
import { Field } from "./Field";

export interface RepairItem {
  label: string;
  checked: boolean;
  value: string; // string for input
}
export interface CustomRepair {
  label: string;
  value: string;
}

export const DEFAULT_REPAIRS: Omit<RepairItem, "checked" | "value">[] = [
  { label: "Freios" },
  { label: "Suspensão" },
  { label: "Embreagem" },
  { label: "Ar-condicionado" },
  { label: "Motor (revisão)" },
  { label: "Câmbio" },
  { label: "Bateria" },
  { label: "Vidros elétricos" },
  { label: "Faróis / Lanternas" },
  { label: "Escapamento" },
  { label: "Direção" },
  { label: "Alinhamento / Balanceamento" },
];

interface RepairsPanelProps {
  items: RepairItem[];
  onItemsChange: (items: RepairItem[]) => void;
  customs: CustomRepair[];
  onCustomsChange: (items: CustomRepair[]) => void;
}

export const RepairsPanel = ({ items, onItemsChange, customs, onCustomsChange }: RepairsPanelProps) => {
  const toggle = (i: number) => {
    const next = [...items];
    next[i] = { ...next[i], checked: !next[i].checked };
    onItemsChange(next);
  };
  const setVal = (i: number, v: string) => {
    const next = [...items];
    next[i] = { ...next[i], value: v };
    onItemsChange(next);
  };
  const addCustom = () => onCustomsChange([...customs, { label: "", value: "" }]);
  const updateCustom = (i: number, patch: Partial<CustomRepair>) => {
    const next = [...customs];
    next[i] = { ...next[i], ...patch };
    onCustomsChange(next);
  };
  const removeCustom = (i: number) => onCustomsChange(customs.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => (
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
                onChange={() => toggle(i)}
                className="h-4 w-4 accent-primary"
              />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.checked && (
                <input
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={item.value}
                  onChange={(e) => setVal(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-28 h-9 rounded-lg bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary"
                />
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
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
