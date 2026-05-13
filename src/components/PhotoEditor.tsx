import { useEffect, useRef, useState } from "react";
import { Eraser, Pen, Square, ArrowUpRight, Type, X, Check, Undo2 } from "lucide-react";

interface PhotoEditorProps {
  src: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

type Tool = "pen" | "arrow" | "rect" | "text";
type Stroke =
  | { tool: "pen"; color: string; size: number; points: { x: number; y: number }[] }
  | { tool: "arrow"; color: string; size: number; from: { x: number; y: number }; to: { x: number; y: number } }
  | { tool: "rect"; color: string; size: number; from: { x: number; y: number }; to: { x: number; y: number } }
  | { tool: "text"; color: string; size: number; pos: { x: number; y: number }; text: string };

const COLORS = ["#ff8c1e", "#ef4444", "#22c55e", "#3b82f6", "#facc15", "#ffffff"];

export const PhotoEditor = ({ src, onSave, onClose }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const draftRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);

  // Load image and size canvas. For remote URLs we fetch as a blob and convert
  // to a data URL first, so the canvas is never "tainted" and toDataURL works.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let usableSrc = src;
      if (!src.startsWith("data:")) {
        try {
          const res = await fetch(src, { mode: "cors" });
          const blob = await res.blob();
          usableSrc = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Falling back to direct image load", e);
        }
      }
      if (cancelled) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        imgRef.current = img;
        const canvas = canvasRef.current!;
        const maxW = Math.min(window.innerWidth - 32, 900);
        const scale = Math.min(1, maxW / img.naturalWidth);
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        redraw();
      };
      img.src = usableSrc;
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const all = [...strokes, ...(draftRef.current ? [draftRef.current] : [])];
    for (const s of all) drawStroke(ctx, s);
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (s.tool === "pen") {
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    } else if (s.tool === "rect") {
      ctx.strokeRect(s.from.x, s.from.y, s.to.x - s.from.x, s.to.y - s.from.y);
    } else if (s.tool === "arrow") {
      const { from, to } = s;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const head = Math.max(10, s.size * 3);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (s.tool === "text") {
      ctx.font = `bold ${Math.max(14, s.size * 4)}px sans-serif`;
      ctx.fillText(s.text, s.pos.x, s.pos.y);
    }
  };

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const handleDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getPos(e);
    if (tool === "text") {
      const text = prompt("Texto:");
      if (text) setStrokes((s) => [...s, { tool: "text", color, size, pos: p, text }]);
      return;
    }
    drawingRef.current = true;
    if (tool === "pen") draftRef.current = { tool: "pen", color, size, points: [p] };
    else if (tool === "arrow") draftRef.current = { tool: "arrow", color, size, from: p, to: p };
    else if (tool === "rect") draftRef.current = { tool: "rect", color, size, from: p, to: p };
    redraw();
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !draftRef.current) return;
    const p = getPos(e);
    const d = draftRef.current;
    if (d.tool === "pen") d.points.push(p);
    else if (d.tool === "arrow" || d.tool === "rect") d.to = p;
    redraw();
  };

  const handleUp = () => {
    if (draftRef.current) setStrokes((s) => [...s, draftRef.current!]);
    draftRef.current = null;
    drawingRef.current = false;
  };

  const handleSave = () => {
    const url = canvasRef.current!.toDataURL("image/jpeg", 0.9);
    onSave(url);
  };

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: "pen", icon: Pen, label: "Caneta" },
    { id: "arrow", icon: ArrowUpRight, label: "Seta" },
    { id: "rect", icon: Square, label: "Retângulo" },
    { id: "text", icon: Type, label: "Texto" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">Anotar foto</h3>
        <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center" aria-label="Fechar">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          className="max-w-full rounded-lg shadow-elevated touch-none cursor-crosshair bg-black"
        />
      </div>

      <div className="border-t border-border p-3 space-y-3 bg-background/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`h-10 px-3 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-smooth ${
                  tool === t.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/70"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
          <div className="flex items-center gap-1.5 ml-auto">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition-smooth ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Espessura</span>
          <input
            type="range"
            min={2}
            max={12}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <button
            onClick={() => setStrokes((s) => s.slice(0, -1))}
            className="h-10 px-3 rounded-lg bg-secondary hover:bg-secondary/70 flex items-center gap-1.5 text-sm font-medium"
          >
            <Undo2 className="h-4 w-4" /> Desfazer
          </button>
          <button
            onClick={() => setStrokes([])}
            className="h-10 px-3 rounded-lg bg-secondary hover:bg-secondary/70 flex items-center gap-1.5 text-sm font-medium"
          >
            <Eraser className="h-4 w-4" /> Limpar
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-glow"
          >
            <Check className="h-4 w-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
