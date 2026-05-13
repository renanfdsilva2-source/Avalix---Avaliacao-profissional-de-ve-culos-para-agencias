import { ToggleChip } from "./ToggleChip";

export interface DocumentationData {
  ipva: "ok" | "atrasado" | null;
  licenciamento: "ok" | "atrasado" | null;
  multas: "sem" | "com" | null;
  transferencia: "ok" | "pendente" | null;
  debitos: number;
  observacoes: string;
}

export const emptyDocumentation: DocumentationData = {
  ipva: null,
  licenciamento: null,
  multas: null,
  transferencia: null,
  debitos: 0,
  observacoes: "",
};

interface Props {
  value: DocumentationData;
  onChange: (v: DocumentationData) => void;
}

const Row = ({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string; ok: boolean }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-2">
    <span className="field-label block">{label}</span>
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <ToggleChip
          key={o.id}
          active={selected === o.id}
          onClick={() => onSelect(o.id)}
          className={selected === o.id && !o.ok ? "!bg-destructive !border-destructive !text-destructive-foreground" : ""}
        >
          {o.label}
        </ToggleChip>
      ))}
    </div>
  </div>
);

export const DocumentationPanel = ({ value, onChange }: Props) => {
  const set = <K extends keyof DocumentationData>(k: K, v: DocumentationData[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <Row
        label="IPVA"
        selected={value.ipva}
        onSelect={(v) => set("ipva", v as DocumentationData["ipva"])}
        options={[
          { id: "ok", label: "Em dia", ok: true },
          { id: "atrasado", label: "Atrasado", ok: false },
        ]}
      />
      <Row
        label="Licenciamento"
        selected={value.licenciamento}
        onSelect={(v) => set("licenciamento", v as DocumentationData["licenciamento"])}
        options={[
          { id: "ok", label: "Em dia", ok: true },
          { id: "atrasado", label: "Atrasado", ok: false },
        ]}
      />
      <Row
        label="Multas"
        selected={value.multas}
        onSelect={(v) => set("multas", v as DocumentationData["multas"])}
        options={[
          { id: "sem", label: "Sem multas", ok: true },
          { id: "com", label: "Com multas", ok: false },
        ]}
      />
      <Row
        label="Transferência"
        selected={value.transferencia}
        onSelect={(v) => set("transferencia", v as DocumentationData["transferencia"])}
        options={[
          { id: "ok", label: "Regular", ok: true },
          { id: "pendente", label: "Pendente", ok: false },
        ]}
      />
      <div className="space-y-2">
        <label className="field-label block">Multas / Débitos (R$)</label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={value.debitos || ""}
          onChange={(e) => set("debitos", parseFloat(e.target.value) || 0)}
          placeholder="0,00"
          className="w-full rounded-xl bg-input/70 border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-smooth"
        />
      </div>
      <div className="space-y-2">
        <label className="field-label block">Observações sobre documentação</label>
        <textarea
          value={value.observacoes}
          onChange={(e) => set("observacoes", e.target.value)}
          rows={3}
          placeholder="Ex: alienação fiduciária, débitos pendentes, etc."
          className="w-full rounded-xl bg-input/70 border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-smooth resize-none"
        />
      </div>
    </div>
  );
};
