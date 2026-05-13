import { Camera, X, Pencil, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PhotoEditor } from "./PhotoEditor";

interface PhotoSlotProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  onLabelChange?: (newLabel: string) => void;
  onRemoveSlot?: () => void;
}

export const PhotoSlot = ({ label, value, onChange, onLabelChange, onRemoveSlot }: PhotoSlotProps) => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo selecionado não é uma imagem.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => toast.error("Não foi possível ler a foto. Tente novamente.");
    try {
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar a foto.");
    }
  };

  return (
    <>
      <div className="relative group">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (value) return;
            setPicking(true);
          }}
          className="w-full aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/60 transition-smooth flex flex-col items-center justify-center gap-2 overflow-hidden relative"
        >
          {value ? (
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="h-7 w-7 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium px-2 text-center">{label}</span>
              <span className="text-[10px] text-muted-foreground/70">Câmera ou galeria</span>
            </>
          )}
        </button>

        {picking && !value && (
          <div
            className="absolute inset-0 z-20 rounded-xl bg-background/95 backdrop-blur flex flex-col items-center justify-center gap-2 p-2 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setPicking(false); cameraRef.current?.click(); }}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" /> Tirar foto
            </button>
            <button
              type="button"
              onClick={() => { setPicking(false); galleryRef.current?.click(); }}
              className="w-full h-9 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold flex items-center justify-center gap-2"
            >
              <ImagePlus className="h-4 w-4" /> Da galeria
            </button>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="text-[10px] text-muted-foreground mt-1"
            >
              Cancelar
            </button>
          </div>
        )}

        {onLabelChange && (
          <input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Legenda"
            className="absolute -top-2 left-2 right-10 h-6 text-[10px] font-semibold bg-background border border-border rounded px-2 focus:outline-none focus:border-primary"
          />
        )}

        {value && (
          <>
            <span className="absolute bottom-2 left-2 right-2 text-center text-xs font-semibold bg-background/80 backdrop-blur rounded-md py-1 pointer-events-none">
              {label}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="absolute top-2 left-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-smooth"
              aria-label="Editar foto"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg transition-smooth"
              aria-label={`Remover foto ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}

        {!value && onRemoveSlot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSlot();
            }}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-lg"
            aria-label="Remover slot"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing && value && (
        <PhotoEditor
          src={value}
          onClose={() => setEditing(false)}
          onSave={(url) => {
            onChange(url);
            setEditing(false);
          }}
        />
      )}
    </>
  );
};
