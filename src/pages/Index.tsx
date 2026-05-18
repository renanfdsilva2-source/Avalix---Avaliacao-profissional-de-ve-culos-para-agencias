import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Car,
  Wrench,
  Fuel,
  PaintBucket,
  Camera,
  PenTool,
  Shield,
  FileDown,
  Share2,
  Calculator,
  Save,
  FolderOpen,
  Plus,
  FileCheck,
  ShieldCheck,
  Banknote,
  LogOut,
  CloudOff,
  CloudUpload,
  CheckCircle2,
} from "lucide-react";
import { Panel } from "@/components/Panel";
import { AvalixLogo } from "@/components/AvalixLogo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Field } from "@/components/Field";
import { ToggleChip } from "@/components/ToggleChip";
import { Counter } from "@/components/Counter";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SignaturePad } from "@/components/SignaturePad";
import {
  RepairsPanel,
  DEFAULT_REPAIRS,
  type RepairItem,
  type CustomRepair,
} from "@/components/RepairsPanel";
import { DocumentationPanel, emptyDocumentation, type DocumentationData } from "@/components/DocumentationPanel";
import { DraftsList } from "@/components/DraftsList";
import { generateEvaluationPdf } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumGate } from "@/components/PremiumGate";
import { useNavigate } from "react-router-dom";
import { uploadAllPhotos } from "@/lib/storage";
import {
  loadLocalDraft,
  saveLocalDraft,
  clearLocalDraft,
  enqueueOfflineSave,
  loadOfflineQueue,
  removeOfflineQueueItem,
  type OfflineQueueItem,
} from "@/lib/localDraft";
import { getErrorMessage, retryWithBackoff } from "@/lib/resilience";

type Cambio = "manual" | "automatico" | null;
type SimNao = "sim" | "nao" | null;
type EvaluationStatus = "draft" | "completed";
type SyncState = "idle" | "saving" | "saved" | "offline" | "error" | "pending";

const DEFAULT_PHOTO_SLOTS = [
  { key: "frente", label: "Frente" },
  { key: "traseira", label: "Traseira" },
  { key: "lateral_esq", label: "Lateral Esq." },
  { key: "lateral_dir", label: "Lateral Dir." },
  { key: "painel", label: "Painel" },
  { key: "motor", label: "Motor" },
  { key: "bancos_dianteiros", label: "Bancos diant." },
  { key: "bancos_traseiros", label: "Bancos tras." },
  { key: "porta_malas", label: "Porta-malas" },
  { key: "volante", label: "Volante" },
  { key: "console", label: "Console" },
  { key: "teto_interno", label: "Teto interno" },
];

interface PhotoSlotState {
  key: string;
  label: string;
  src: string | null;
}

const parseMoney = (v: string) => {
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};
const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const createEvaluationId = () => crypto.randomUUID();

const initialRepairs = (): RepairItem[] =>
  DEFAULT_REPAIRS.map((r) => ({ label: r.label, checked: false, value: "" }));

const Index = () => {
  const navigate = useNavigate();
  const { active: isPremium } = useSubscription();
  const requirePremium = (feature: string) => {
    if (isPremium) return true;
    toast.error(`Assinatura necessária para ${feature}.`);
    navigate("/billing");
    return false;
  };

  // Loaded eval id (null = new)
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>("draft");
  const [showDrafts, setShowDrafts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loadedLocalDraft, setLoadedLocalDraft] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const latestStateRef = useRef<Record<string, unknown> | null>(null);
  const latestEvaluationIdRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const pendingSyncRef = useRef(false);

  // Vehicle
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [cor, setCor] = useState("");
  const [fipe, setFipe] = useState("");
  const [km, setKm] = useState("");
  const [cambio, setCambio] = useState<Cambio>(null);

  // Damages
  const [pintura, setPintura] = useState(0);
  const [pneus, setPneus] = useState(0);
  const [higienizacao, setHigienizacao] = useState(false);
  const [outros, setOutros] = useState("");

  // Mechanical (legacy quick estimation)
  const [manutencao, setManutencao] = useState<SimNao>(null);
  const [manutencaoValor, setManutencaoValor] = useState("");

  // Repairs (detailed)
  const [repairs, setRepairs] = useState<RepairItem[]>(initialRepairs());
  const [customRepairs, setCustomRepairs] = useState<CustomRepair[]>([]);

  // GNV / paint
  const [gnv, setGnv] = useState<SimNao>(null);
  const [pinturaTotal, setPinturaTotal] = useState<SimNao>(null);

  // Blindagem & Financiamento
  const [blindado, setBlindado] = useState(false);
  const [financiado, setFinanciado] = useState(false);
  const [financiadoValor, setFinanciadoValor] = useState("");

  // Documentation
  const [documentation, setDocumentation] = useState<DocumentationData>(emptyDocumentation);

  // Photos (dynamic list)
  const [photos, setPhotos] = useState<PhotoSlotState[]>(
    DEFAULT_PHOTO_SLOTS.map((s) => ({ ...s, src: null }))
  );

  // Signature & LGPD
  const [signature, setSignature] = useState<string | null>(null);
  const [lgpd, setLgpd] = useState(false);

  // Auto-save status
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const localSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fipeValue = parseMoney(fipe);

  const repairsTotal = useMemo(() => {
    const a = repairs.filter((r) => r.checked).reduce((s, r) => s + parseMoney(r.value), 0);
    const b = customRepairs.reduce((s, r) => s + parseMoney(r.value), 0);
    return a + b;
  }, [repairs, customRepairs]);

  const breakdown = useMemo(() => {
    const items: { label: string; value: number }[] = [];
    if (cambio === "manual") items.push({ label: "Câmbio Manual", value: -10000 });
    if (cambio === "automatico") items.push({ label: "Câmbio Automático", value: -15000 });
    if (pintura > 0) items.push({ label: `Pintura (${pintura} peça${pintura > 1 ? "s" : ""})`, value: -500 * pintura });
    if (pneus > 0) items.push({ label: `Pneus (${pneus} un)`, value: -350 * pneus });
    if (higienizacao) items.push({ label: "Higienização", value: -300 });
    const o = parseMoney(outros);
    if (o > 0) items.push({ label: "Outros descontos", value: -o });
    const m = documentation.debitos || 0;
    if (m > 0) items.push({ label: "Multas / Débitos", value: -m });
    if (manutencao === "sim") {
      const mv = parseMoney(manutencaoValor);
      if (mv > 0) items.push({ label: "Manutenção (estimativa)", value: -mv });
    }
    if (repairsTotal > 0) items.push({ label: "Reparos detalhados", value: -repairsTotal });
    if (gnv === "sim") items.push({ label: "Possui GNV", value: -3000 });
    if (pinturaTotal === "sim") items.push({ label: "Necessita pintura total", value: -4500 });
    if (blindado) items.push({ label: "Blindagem", value: -15000 });
    if (financiado) {
      const fv = parseMoney(financiadoValor);
      if (fv > 0) items.push({ label: "Saldo financiado", value: -fv });
    }
    return items;
  }, [cambio, pintura, pneus, higienizacao, outros, documentation.debitos, manutencao, manutencaoValor, gnv, pinturaTotal, repairsTotal, blindado, financiado, financiadoValor]);

  const totalDescontos = breakdown.reduce((sum, i) => sum + i.value, 0);
  const valorFinal = Math.max(0, fipeValue + totalDescontos);

  // ---------- Local + cloud auto-save -----------------------------------
  const stateSnapshot = useMemo(
    () => ({
      placa, marca, modelo, ano, cor, fipe, km, cambio,
      pintura, pneus, higienizacao, outros,
      manutencao, manutencaoValor,
      repairs, customRepairs,
      gnv, pinturaTotal,
      blindado, financiado, financiadoValor,
      documentation,
      photos,
      signature, lgpd,
      status: evaluationStatus,
      clientUpdatedAt: new Date().toISOString(),
    }),
    [placa, marca, modelo, ano, cor, fipe, km, cambio, pintura, pneus, higienizacao, outros, manutencao, manutencaoValor, repairs, customRepairs, gnv, pinturaTotal, blindado, financiado, financiadoValor, documentation, photos, signature, lgpd, evaluationStatus]
  );

  useEffect(() => {
    latestStateRef.current = stateSnapshot as Record<string, unknown>;
  }, [stateSnapshot]);

  useEffect(() => {
    latestEvaluationIdRef.current = evaluationId;
  }, [evaluationId]);

  // Hydrate from local IndexedDB on first mount
  useEffect(() => {
    (async () => {
      const draft = await loadLocalDraft();
      if (draft?.state) {
        console.info("[Avalix Sync] rascunho local recuperado", { evaluationId: draft.evaluationId, updatedAt: draft.updatedAt });
        setLoadedLocalDraft(true);
        const s = draft.state as Record<string, any>;
        const restoredId = draft.evaluationId ?? createEvaluationId();
        setEvaluationId(restoredId);
        setEvaluationStatus(s.status === "completed" || s.status === "final" ? "completed" : "draft");
        setPlaca(s.placa ?? ""); setMarca(s.marca ?? ""); setModelo(s.modelo ?? "");
        setAno(s.ano ?? ""); setCor(s.cor ?? ""); setFipe(s.fipe ?? "");
        setKm(s.km ?? ""); setCambio(s.cambio ?? null);
        setPintura(s.pintura ?? 0); setPneus(s.pneus ?? 0);
        setHigienizacao(!!s.higienizacao); setOutros(s.outros ?? "");
        setManutencao(s.manutencao ?? null); setManutencaoValor(s.manutencaoValor ?? "");
        if (Array.isArray(s.repairs) && s.repairs.length) setRepairs(s.repairs);
        if (Array.isArray(s.customRepairs)) setCustomRepairs(s.customRepairs);
        setGnv(s.gnv ?? null); setPinturaTotal(s.pinturaTotal ?? null);
        setBlindado(!!s.blindado);
        setFinanciado(!!s.financiado);
        setFinanciadoValor(s.financiadoValor ?? "");
        if (s.documentation) setDocumentation(s.documentation);
        if (Array.isArray(s.photos) && s.photos.length) setPhotos(s.photos);
        setSignature(s.signature ?? null);
        setLgpd(!!s.lgpd);
        setRecoveryChecked(true);
      } else {
        const newId = createEvaluationId();
        console.info("[Avalix Sync] novo rascunho local criado", { evaluationId: newId });
        setEvaluationId(newId);
        if (typeof navigator !== "undefined" && !navigator.onLine) setRecoveryChecked(true);
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated || loadedLocalDraft || !online) return;
    (async () => {
      try {
        const { data: userData } = await retryWithBackoff(
          () => supabase.auth.getUser(),
          { label: "verificação da sessão para recuperar rascunho", retries: 2, timeoutMs: 10000 },
        );
        if (!userData.user) return;
        const { data, error } = await retryWithBackoff(
          () => Promise.resolve(
            supabase
              .from("evaluations")
              .select("*")
              .eq("status", "draft")
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ),
          { label: "recuperação automática de rascunho", retries: 2, timeoutMs: 12000 },
        );
        if (error) throw error;
        if (data) {
          console.info("[Avalix Sync] rascunho remoto recuperado", { evaluationId: data.id });
          await loadEvaluation(data.id, { silent: true });
        }
      } catch (error) {
        console.warn("[Avalix Sync] recuperação automática de rascunho falhou", getErrorMessage(error), error);
      } finally {
        setRecoveryChecked(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, loadedLocalDraft, online]);

  // Online/offline status — auto-sync pending changes when connection returns
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      // Trigger immediate sync of any pending local changes
      if (hydrated) {
        toast.success("Conexão restaurada — sincronizando…");
        syncOfflineQueue();
      }
    };
    const goOffline = () => {
      setOnline(false);
      setSyncState("offline");
      toast.message("Modo offline — alterações salvas no dispositivo");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const syncOfflineQueue = async () => {
    const queue: OfflineQueueItem[] = await loadOfflineQueue();
    if (queue.length > 0) console.info("[Avalix Sync] fila offline encontrada", { total: queue.length });
    await autoSaveToCloud();
    await Promise.all(queue.map((item) => removeOfflineQueueItem(item.id)));
    if (queue.length > 0) console.info("[Avalix Sync] sincronização da fila concluída", { total: queue.length });
  };

  // Warn before leaving if there are unsynced changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (syncState === "saving" || syncState === "offline" || syncState === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [syncState]);

  // Debounced local save (IndexedDB) — works offline
  useEffect(() => {
    if (!hydrated || !recoveryChecked) return;
    if (localSaveTimer.current) clearTimeout(localSaveTimer.current);
    localSaveTimer.current = setTimeout(() => {
      const id = evaluationId ?? createEvaluationId();
      if (!evaluationId) setEvaluationId(id);
      console.info("[Avalix Sync] salvamento local iniciado", { evaluationId: id });
      saveLocalDraft({
        evaluationId: id,
        state: stateSnapshot as Record<string, unknown>,
        updatedAt: Date.now(),
        pendingUpload: photos.some((p) => p.src?.startsWith("data:")),
      });
      setSyncState(online ? "pending" : "offline");
      console.info("[Avalix Sync] salvamento local concluído", { evaluationId: id });
    }, 500);
  }, [hydrated, recoveryChecked, stateSnapshot, evaluationId]);

  // Debounced cloud auto-save
  useEffect(() => {
    if (!hydrated || !recoveryChecked) return;
    if (!online) { setSyncState("offline"); return; }
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(() => { autoSaveToCloud(); }, 1000);
    return () => { if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, recoveryChecked, online, stateSnapshot]);

  const persistOffline = async (status: EvaluationStatus, error?: unknown) => {
    const id = evaluationId ?? latestEvaluationIdRef.current ?? createEvaluationId();
    if (!evaluationId) setEvaluationId(id);
    const snapshot = latestStateRef.current ?? (stateSnapshot as Record<string, unknown>);
    const clientUpdatedAt = new Date().toISOString();
    await saveLocalDraft({ evaluationId: id, state: snapshot, updatedAt: Date.now(), pendingUpload: true });
    await enqueueOfflineSave({ evaluationId: id, state: snapshot, updatedAt: Date.now(), pendingUpload: true, status, clientUpdatedAt });
    setSyncState(navigator.onLine ? "error" : "offline");
    console.error("[Avalix Sync] falha no backend; rascunho mantido localmente", {
      evaluationId: id,
      status,
      error: error ? getErrorMessage(error) : "offline",
    }, error);
  };

  const ensureEvaluationId = () => {
    const id = evaluationId ?? latestEvaluationIdRef.current ?? createEvaluationId();
    if (!evaluationId) setEvaluationId(id);
    latestEvaluationIdRef.current = id;
    return id;
  };

  const autoSaveToCloud = async () => {
    if (syncingRef.current) {
      pendingSyncRef.current = true;
      return;
    }
    syncingRef.current = true;
    try {
      const { data: userData, error: userError } = await retryWithBackoff(
        () => supabase.auth.getUser(),
        { label: "verificação da sessão", retries: 2, timeoutMs: 10000 },
      );
      if (userError) throw userError;
      if (!userData.user) throw new Error("Sessão expirada. Faça login novamente para sincronizar.");
      setSyncState("saving");
      const id = ensureEvaluationId();
      const statusForSave = evaluationStatus;
      console.info("[Avalix Sync] autosave iniciado", { evaluationId: id, status: statusForSave });

      const initialRow = { id, user_id: userData.user.id, status: statusForSave, client_updated_at: new Date().toISOString() };
      const { error: initError } = await retryWithBackoff(
        () => Promise.resolve(supabase.from("evaluations").upsert(initialRow).select("id").single()),
        { label: "criação do rascunho", retries: 3, timeoutMs: 15000 },
      );
      if (initError) throw initError;

      const uploaded = await uploadAllPhotos(id!, photos);
      setPhotos((prev) =>
        prev.map((p) => {
          const u = uploaded.find((x) => x.key === p.key);
          return u && u.url ? { ...p, src: u.url } : p;
        })
      );
      const row = { id, user_id: userData.user.id, ...buildDbRow(statusForSave, uploaded) };
      const { error } = await retryWithBackoff(
        () => Promise.resolve(supabase.from("evaluations").upsert(row).select("id,updated_at").single()),
        { label: "autosave da avaliação", retries: 3, timeoutMs: 20000 },
      );
      if (error) throw error;
      setSyncState("saved");
      setLastSavedAt(new Date());
      await saveLocalDraft({ evaluationId: id, state: latestStateRef.current ?? stateSnapshot as Record<string, unknown>, updatedAt: Date.now(), pendingUpload: false });
      console.info("[Avalix Sync] autosave concluído", { evaluationId: id, status: statusForSave });
    } catch (e) {
      await persistOffline("draft", e);
    } finally {
      syncingRef.current = false;
      if (pendingSyncRef.current && online) {
        pendingSyncRef.current = false;
        setTimeout(() => autoSaveToCloud(), 0);
      }
    }
  };
  // ----------------------------------------------------------------------

  const repairLines = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    repairs.filter((r) => r.checked).forEach((r) => out.push({ label: r.label, value: parseMoney(r.value) }));
    customRepairs.forEach((r) => out.push({ label: r.label || "Reparo personalizado", value: parseMoney(r.value) }));
    return out;
  }, [repairs, customRepairs]);

  const collectForPdf = (uploaded?: { key: string; label: string; url: string | null }[]) => {
    const photoSrc = uploaded
      ? uploaded.filter((p) => p.url).map((p) => ({ label: p.label, src: p.url! }))
      : photos.filter((p) => p.src).map((p) => ({ label: p.label, src: p.src! }));
    return {
      veiculo: { placa, marca, modelo, ano, cor, fipe: fipeValue, km, cambio },
      photos: photoSrc,
      signature,
      breakdown,
      repairs: repairLines,
      documentation,
      fipeValue,
      totalDescontos,
      valorFinal,
    };
  };

  const snapshotWithUploadedPhotos = (uploaded: { key: string; label: string; url: string | null }[]) => ({
    ...(latestStateRef.current ?? (stateSnapshot as Record<string, unknown>)),
    photos: photos.map((p) => {
      const saved = uploaded.find((x) => x.key === p.key);
      return saved && saved.url ? { ...p, src: saved.url } : p;
    }),
    clientUpdatedAt: new Date().toISOString(),
  });

  const buildDbRow = (status: EvaluationStatus, uploaded: { key: string; label: string; url: string | null }[]) => ({
    status,
    placa,
    marca,
    modelo,
    ano,
    cor,
    fipe: fipeValue,
    km,
    cambio,
    pintura_pecas: pintura,
    pneus,
    higienizacao,
    outros_descontos: parseMoney(outros),
    multas: documentation.debitos || 0,
    manutencao_status: manutencao,
    manutencao_valor: parseMoney(manutencaoValor),
    gnv,
    pintura_total: pinturaTotal,
    blindado,
    financiado,
    financiado_valor: parseMoney(financiadoValor),
    repairs: repairs as any,
    custom_repairs: customRepairs as any,
    documentation: documentation as any,
    photos: uploaded.map((p) => ({ key: p.key, label: p.label, url: p.url })) as any,
    signature,
    fipe_value: fipeValue,
    total_descontos: totalDescontos,
    valor_final: valorFinal,
    client_updated_at: new Date().toISOString(),
    last_sync_error: null,
  });

  const persist = async (status: EvaluationStatus): Promise<{ id: string; uploaded: { key: string; label: string; url: string | null }[] } | null> => {
    setSaving(true);
    try {
      if (!navigator.onLine) throw new Error("Sem conexão com a internet.");
      const { data: userData, error: userError } = await retryWithBackoff(
        () => supabase.auth.getUser(),
        { label: "verificação da sessão", retries: 2, timeoutMs: 10000 },
      );
      if (userError) throw userError;
      if (!userData.user) throw new Error("Sessão expirada. Faça login novamente.");

      const id = ensureEvaluationId();
      console.info("[Avalix Sync] salvamento iniciado", { evaluationId: id, status });

      const { error: initError } = await retryWithBackoff(
        () => Promise.resolve(
          supabase
            .from("evaluations")
            .upsert({ id, user_id: userData.user.id, status: "draft", client_updated_at: new Date().toISOString() })
            .select("id")
            .single(),
        ),
        { label: "garantia do rascunho antes do upload", retries: 3, timeoutMs: 15000 },
      );
      if (initError) throw initError;

      const uploaded = await uploadAllPhotos(id, photos);
      setPhotos((prev) =>
        prev.map((p) => {
          const u = uploaded.find((x) => x.key === p.key);
          return u && u.url ? { ...p, src: u.url } : p;
        })
      );

      const row = { id, user_id: userData.user.id, ...buildDbRow(status, uploaded) };
      const { error } = await retryWithBackoff(
        () => Promise.resolve(supabase.from("evaluations").upsert(row).select("id,updated_at").single()),
        { label: status === "completed" ? "finalização da avaliação" : "salvamento do rascunho", retries: 3, timeoutMs: 20000 },
      );
      if (error) throw error;
      setEvaluationStatus(status);
      setSyncState("saved");
      setLastSavedAt(new Date());
      await saveLocalDraft({ evaluationId: id, state: snapshotWithUploadedPhotos(uploaded), updatedAt: Date.now(), pendingUpload: false });
      console.info("[Avalix Sync] salvamento concluído", { evaluationId: id, status });
      return { id, uploaded };
    } catch (e) {
      await persistOffline(status, e);
      console.error("[Avalix Sync] erro real ao salvar", e);
      toast.error("Não foi possível salvar no backend. Seus dados ficaram salvos neste dispositivo.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    // Sempre salva localmente primeiro (síncrono via auto-save IndexedDB).
    if (!online) {
      const id = ensureEvaluationId();
      await saveLocalDraft({
        evaluationId: id,
        state: stateSnapshot as Record<string, unknown>,
        updatedAt: Date.now(),
        pendingUpload: true,
      });
      await enqueueOfflineSave({
        evaluationId: id,
        state: stateSnapshot as Record<string, unknown>,
        updatedAt: Date.now(),
        pendingUpload: true,
        status: "draft",
        clientUpdatedAt: new Date().toISOString(),
      });
      setSyncState("offline");
      toast.success("Rascunho salvo no dispositivo. Será sincronizado quando voltar online.");
      return;
    }
    const saved = await persist("draft");
    if (saved) toast.success("Rascunho salvo!");
  };

  const resetForm = () => {
    setEvaluationId(null);
    setEvaluationStatus("draft");
    setPlaca(""); setMarca(""); setModelo(""); setAno(""); setCor("");
    setFipe(""); setKm(""); setCambio(null);
    setPintura(0); setPneus(0); setHigienizacao(false); setOutros("");
    setManutencao(null); setManutencaoValor("");
    setRepairs(initialRepairs()); setCustomRepairs([]);
    setGnv(null); setPinturaTotal(null);
    setBlindado(false); setFinanciado(false); setFinanciadoValor("");
    setDocumentation(emptyDocumentation);
    setPhotos(DEFAULT_PHOTO_SLOTS.map((s) => ({ ...s, src: null })));
    setSignature(null); setLgpd(false);
    clearLocalDraft();
    setSyncState("idle");
  };

  const loadEvaluation = async (id: string, options?: { silent?: boolean }) => {
    const { data, error } = await retryWithBackoff(
      () => Promise.resolve(supabase.from("evaluations").select("*").eq("id", id).maybeSingle()),
      { label: "carregamento da avaliação", retries: 2, timeoutMs: 12000 },
    );
    if (error || !data) {
      toast.error("Erro ao carregar avaliação");
      return;
    }
    setEvaluationId(id);
    setEvaluationStatus(data.status === "completed" || data.status === "final" ? "completed" : "draft");
    setPlaca(data.placa ?? "");
    setMarca(data.marca ?? "");
    setModelo(data.modelo ?? "");
    setAno(data.ano ?? "");
    setCor(data.cor ?? "");
    setFipe(data.fipe ? String(data.fipe).replace(".", ",") : "");
    setKm(data.km ?? "");
    setCambio((data.cambio as Cambio) ?? null);
    setPintura(data.pintura_pecas ?? 0);
    setPneus(data.pneus ?? 0);
    setHigienizacao(!!data.higienizacao);
    setOutros(data.outros_descontos ? String(data.outros_descontos).replace(".", ",") : "");
    
    setManutencao((data.manutencao_status as SimNao) ?? null);
    setManutencaoValor(data.manutencao_valor ? String(data.manutencao_valor).replace(".", ",") : "");
    const loadedRepairs = (data.repairs as unknown as RepairItem[]) || [];
    // Merge with defaults so any new defaults still show
    const merged = initialRepairs().map((d) => loadedRepairs.find((x) => x.label === d.label) || d);
    const extras = loadedRepairs.filter((x) => !DEFAULT_REPAIRS.find((d) => d.label === x.label));
    setRepairs([...merged, ...extras]);
    setCustomRepairs((data.custom_repairs as unknown as CustomRepair[]) || []);
    setDocumentation(((data.documentation as unknown) as DocumentationData) || emptyDocumentation);
    setGnv((data.gnv as SimNao) ?? null);
    setPinturaTotal((data.pintura_total as SimNao) ?? null);
    setBlindado(!!(data as any).blindado);
    setFinanciado(!!(data as any).financiado);
    setFinanciadoValor((data as any).financiado_valor ? String((data as any).financiado_valor).replace(".", ",") : "");
    const loadedPhotos = ((data.photos as unknown) as { key: string; label: string; url: string | null }[]) || [];
    if (loadedPhotos.length > 0) {
      setPhotos(loadedPhotos.map((p) => ({ key: p.key, label: p.label, src: p.url })));
    }
    setSignature(data.signature ?? null);
    setLgpd(false);
    setShowDrafts(false);
    setSyncState("saved");
    setLastSavedAt(new Date(data.updated_at));
    if (!options?.silent) toast.success("Avaliação carregada");
  };

  const handleDownload = async () => {
    if (!online) {
      toast.error("Sem conexão. Volte para a internet para finalizar e enviar ao banco.");
      return;
    }
    if (!placa || !marca || !modelo) {
      toast.error("Preencha placa, marca e modelo do veículo.");
      return;
    }
    if (!lgpd) {
      toast.error("É necessário aceitar os termos LGPD.");
      return;
    }
    if (fipeValue <= 0) {
      toast.error("Informe o valor FIPE antes de finalizar.");
      return;
    }
    setExporting(true);
    try {
      // Save as final + upload photos first
      const saved = await persist("completed");
      if (!saved) return;
      // Build PDF using uploaded URLs (state may not be updated synchronously)
      await generateEvaluationPdf(collectForPdf(saved.uploaded));
      console.info("[Avalix PDF] PDF gerado", { evaluationId: saved.id, photos: saved.uploaded.filter((p) => p.url).length });
      toast.success("Avaliação finalizada e PDF gerado!");
    } catch (e) {
      console.error("[Avalix PDF] erro real ao gerar PDF", e);
      toast.error(`Erro ao gerar PDF: ${getErrorMessage(e)}`);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    const data = collectForPdf();
    const text = `Avaliação ${data.veiculo.marca} ${data.veiculo.modelo} (${data.veiculo.placa})\nFIPE: ${formatBRL(data.fipeValue)}\nDescontos: ${formatBRL(Math.abs(data.totalDescontos))}\nValor Final: ${formatBRL(data.valorFinal)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AVALIX", text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Resumo copiado!");
    }
  };

  const addPhotoSlot = () => {
    const idx = photos.length + 1;
    setPhotos((p) => [...p, { key: `extra_${Date.now()}`, label: `Extra ${idx}`, src: null }]);
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-border/70" style={{ background: "var(--gradient-header)" }}>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-glow/50 to-transparent" />
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-2.5">
          <SidebarTrigger className="h-9 w-9 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/60 text-foreground transition-smooth" />
          <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-[hsl(214_50%_14%)] to-[hsl(213_64%_7%)] border border-primary/30 flex items-center justify-center shadow-button">
            <AvalixLogo size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold leading-tight tracking-[0.18em]">
              AVAL<span className="text-primary-glow">I</span>X
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate font-semibold flex items-center gap-1.5">
              {!online ? (
                <><CloudOff className="h-3 w-3 text-amber-400" /> Offline · salvo no dispositivo</>
              ) : syncState === "saving" ? (
                <><CloudUpload className="h-3 w-3 animate-pulse text-primary-glow" /> Sincronizando…</>
              ) : syncState === "saved" ? (
                <><CheckCircle2 className="h-3 w-3 text-success" /> Sincronizado</>
              ) : syncState === "error" ? (
                <><CloudOff className="h-3 w-3 text-destructive" /> Erro ao sincronizar</>
              ) : (
                <>{evaluationId ? "Editando avaliação" : "Nova avaliação"}</>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowDrafts(true)}
            className="h-10 w-10 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/60 flex items-center justify-center transition-smooth"
            aria-label="Avaliações salvas"
          >
            <FolderOpen className="h-4.5 w-4.5" />
          </button>
          {evaluationId && (
            <button
              onClick={resetForm}
              className="h-10 px-3 rounded-lg btn-primary-corp text-[11px] font-bold uppercase tracking-wider"
            >
              Nova
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="h-10 w-10 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/60 flex items-center justify-center transition-smooth"
            aria-label="Sair"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Panel id="sec-veiculo" icon={<Car className="h-5 w-5" />} title="Dados do Veículo">
          <Field label="Placa" placeholder="ABC1D23" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} maxLength={8} className="uppercase tracking-widest font-mono" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca" placeholder="Toyota" value={marca} onChange={(e) => setMarca(e.target.value)} />
            <Field label="Modelo" placeholder="Corolla" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ano" placeholder="2020" inputMode="numeric" value={ano} onChange={(e) => setAno(e.target.value)} />
            <Field label="Cor" placeholder="Prata" value={cor} onChange={(e) => setCor(e.target.value)} />
          </div>
          <Field label="Valor Tabela FIPE (R$)" placeholder="85.000,00" inputMode="decimal" value={fipe} onChange={(e) => setFipe(e.target.value)} />
          <Field label="Quilometragem" placeholder="75.000" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} />
          <div className="space-y-2">
            <span className="field-label block">Câmbio</span>
            <div className="grid grid-cols-2 gap-3">
              <ToggleChip active={cambio === "manual"} onClick={() => setCambio(cambio === "manual" ? null : "manual")}>Manual (−R$ 10.000)</ToggleChip>
              <ToggleChip active={cambio === "automatico"} onClick={() => setCambio(cambio === "automatico" ? null : "automatico")}>Automático (−R$ 15.000)</ToggleChip>
            </div>
          </div>
        </Panel>

        <Panel id="sec-documentacao" icon={<FileCheck className="h-5 w-5" />} title="Documentação">
          <DocumentationPanel value={documentation} onChange={setDocumentation} />
        </Panel>

        <Panel id="sec-avarias" icon={<Wrench className="h-5 w-5" />} title="Avarias e Descontos">
          <Counter label="Pintura" hint="R$ 500/peça" value={pintura} onChange={setPintura} />
          <Counter label="Pneus" hint="R$ 350/un" value={pneus} onChange={setPneus} />
          <ToggleChip active={higienizacao} onClick={() => setHigienizacao(!higienizacao)} className="w-full">
            Higienização (R$ 300)
          </ToggleChip>
          <Field label="Outros descontos (R$)" placeholder="0,00" inputMode="decimal" value={outros} onChange={(e) => setOutros(e.target.value)} />
        </Panel>

        <Panel id="sec-reparos" icon={<Wrench className="h-5 w-5" />} title="Reparos / Manutenção">
          <RepairsPanel
            items={repairs}
            onItemsChange={setRepairs}
            customs={customRepairs}
            onCustomsChange={setCustomRepairs}
          />
          <div className="rounded-xl bg-muted/30 p-3 text-sm flex justify-between mt-2">
            <span className="text-muted-foreground">Total reparos</span>
            <span className="font-bold tabular-nums text-destructive">{formatBRL(repairsTotal)}</span>
          </div>
        </Panel>

        <Panel id="sec-manutencao" icon={<Wrench className="h-5 w-5" />} title="Manutenção (estimativa rápida)">
          <div className="grid grid-cols-2 gap-3">
            <ToggleChip active={manutencao === "nao"} onClick={() => setManutencao(manutencao === "nao" ? null : "nao")}>Sem Manutenção</ToggleChip>
            <ToggleChip active={manutencao === "sim"} onClick={() => setManutencao(manutencao === "sim" ? null : "sim")}>Necessita Manutenção</ToggleChip>
          </div>
          {manutencao === "sim" && (
            <Field label="Valor estimado (R$)" placeholder="0,00" inputMode="decimal" value={manutencaoValor} onChange={(e) => setManutencaoValor(e.target.value)} />
          )}
        </Panel>

        <Panel id="sec-gnv" icon={<Fuel className="h-5 w-5" />} title="GNV">
          <div className="grid grid-cols-2 gap-3">
            <ToggleChip active={gnv === "nao"} onClick={() => setGnv(gnv === "nao" ? null : "nao")}>Sem GNV</ToggleChip>
            <ToggleChip active={gnv === "sim"} onClick={() => setGnv(gnv === "sim" ? null : "sim")}>Possui GNV (−R$ 3.000)</ToggleChip>
          </div>
        </Panel>

        <Panel id="sec-pintura" icon={<PaintBucket className="h-5 w-5" />} title="Pintura Total">
          <div className="grid grid-cols-2 gap-3">
            <ToggleChip active={pinturaTotal === "nao"} onClick={() => setPinturaTotal(pinturaTotal === "nao" ? null : "nao")}>Não Necessita</ToggleChip>
            <ToggleChip active={pinturaTotal === "sim"} onClick={() => setPinturaTotal(pinturaTotal === "sim" ? null : "sim")}>Necessita (−R$ 4.500)</ToggleChip>
          </div>
        </Panel>

        <Panel id="sec-blindagem" icon={<ShieldCheck className="h-5 w-5" />} title="Blindagem">
          <div className="grid grid-cols-2 gap-3">
            <ToggleChip active={!blindado} onClick={() => setBlindado(false)}>Não blindado</ToggleChip>
            <ToggleChip active={blindado} onClick={() => setBlindado(true)}>Blindado (−R$ 15.000)</ToggleChip>
          </div>
        </Panel>

        <Panel id="sec-financiamento" icon={<Banknote className="h-5 w-5" />} title="Financiamento">
          <div className="grid grid-cols-2 gap-3">
            <ToggleChip active={!financiado} onClick={() => { setFinanciado(false); setFinanciadoValor(""); }}>Quitado</ToggleChip>
            <ToggleChip active={financiado} onClick={() => setFinanciado(true)}>Em financiamento</ToggleChip>
          </div>
          {financiado && (
            <Field
              label="Saldo devedor (R$)"
              placeholder="0,00"
              inputMode="decimal"
              value={financiadoValor}
              onChange={(e) => setFinanciadoValor(e.target.value)}
            />
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            O saldo devedor informado será integralmente descontado do valor final do veículo.
          </p>
        </Panel>

        <Panel
          id="sec-fotos"
          icon={<Camera className="h-5 w-5" />}
          title="Fotos (exterior + interior)"
          action={
            <button
              type="button"
              onClick={addPhotoSlot}
              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Foto
            </button>
          }
        >
          <p className="text-xs text-muted-foreground -mt-1">
            Toque na foto para anotar com setas, retângulos ou texto. Use <strong>+ Foto</strong> para adicionar slots extras com legenda personalizada.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {photos.map((p, i) => {
              const isExtra = !DEFAULT_PHOTO_SLOTS.find((d) => d.key === p.key);
              return (
                <PhotoSlot
                  key={p.key}
                  label={p.label}
                  value={p.src}
                  onChange={(v) =>
                    setPhotos((arr) => arr.map((x, idx) => (idx === i ? { ...x, src: v } : x)))
                  }
                  onLabelChange={
                    isExtra
                      ? (newLabel) =>
                          setPhotos((arr) => arr.map((x, idx) => (idx === i ? { ...x, label: newLabel } : x)))
                      : undefined
                  }
                  onRemoveSlot={
                    isExtra ? () => setPhotos((arr) => arr.filter((_, idx) => idx !== i)) : undefined
                  }
                />
              );
            })}
          </div>
        </Panel>

        <Panel id="sec-resumo" icon={<Calculator className="h-5 w-5" />} title="Resumo da Avaliação">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Valor FIPE</span>
              <span className="font-semibold">{formatBRL(fipeValue)}</span>
            </div>
            {breakdown.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum desconto aplicado.</p>}
            {breakdown.map((b, i) => (
              <div key={i} className="flex justify-between py-1.5">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="text-destructive font-medium tabular-nums">{formatBRL(b.value)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t border-border">
              <span className="font-semibold">Total descontos</span>
              <span className="font-semibold text-destructive tabular-nums">{formatBRL(totalDescontos)}</span>
            </div>
            <div className="mt-4 rounded-xl p-5 text-primary-foreground shadow-elevated relative overflow-hidden border border-primary/40" style={{ background: "var(--gradient-primary)" }}>
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)" }} />
              <div className="relative text-[10px] uppercase tracking-[0.22em] font-bold opacity-90">Valor Final Sugerido</div>
              <div className="relative text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight">{formatBRL(valorFinal)}</div>
              <div className="relative mt-2 text-[10px] uppercase tracking-[0.2em] font-semibold opacity-75">AVALIX · Laudo Corporativo</div>
            </div>
          </div>
        </Panel>

        <Panel id="sec-assinatura" icon={<PenTool className="h-5 w-5" />} title="Assinatura do Avaliador">
          <SignaturePad onChange={setSignature} />
        </Panel>

        <Panel id="sec-lgpd" icon={<Shield className="h-5 w-5" />} title="LGPD - Proteção de Dados">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Em conformidade com a Lei nº 13.709/2018 (LGPD), os dados coletados serão utilizados exclusivamente para fins de avaliação comercial do veículo.
          </p>
          <ToggleChip active={lgpd} onClick={() => setLgpd(!lgpd)} className="w-full">
            {lgpd ? "✓ Termos Aceitos" : "Aceitar Termos LGPD"}
          </ToggleChip>
        </Panel>
      </main>

      {/* Sticky actions */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || exporting}
            className="h-12 rounded-lg bg-secondary/80 text-foreground font-semibold flex items-center justify-center gap-1.5 hover:bg-secondary transition-smooth border border-border text-sm disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando" : "Rascunho"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={saving || exporting}
            className="h-12 rounded-lg btn-primary-corp flex items-center justify-center gap-1.5 text-sm disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" /> {exporting ? "Gerando" : "Finalizar"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="h-12 rounded-lg bg-secondary/80 text-foreground font-semibold flex items-center justify-center gap-1.5 hover:bg-secondary transition-smooth border border-border text-sm"
          >
            <Share2 className="h-4 w-4" /> Enviar
          </button>
        </div>
      </div>

      <DraftsList open={showDrafts} onClose={() => setShowDrafts(false)} onLoad={loadEvaluation} />
    </div>
  );
};

export default Index;
