import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AlarmAppointment {
  id: string;
  title: string;
  notes: string | null;
  scheduled_at: string;
}

/**
 * Loud alarm: alternating siren tones via Web Audio API + vibration.
 * Stays on until user dismisses the modal.
 */
function useSiren() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  const start = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;

      const playBeep = (freq: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      };

      let high = true;
      const tick = () => {
        playBeep(high ? 1200 : 800, 0.45);
        high = !high;
        if (navigator.vibrate) navigator.vibrate(400);
      };
      tick();
      intervalRef.current = window.setInterval(tick, 500);
    } catch (e) {
      console.warn("siren failed", e);
    }
  }, []);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { start, stop };
}

export function useAppointmentAlarm() {
  const [active, setActive] = useState<AlarmAppointment | null>(null);
  const { start, stop } = useSiren();
  const firedIdsRef = useRef<Set<string>>(new Set());

  const check = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("appointments")
      .select("id,title,notes,scheduled_at")
      .eq("user_id", user.id)
      .eq("alarm_fired", false)
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(1);
    if (error) return;
    const next = data?.[0];
    if (!next || firedIdsRef.current.has(next.id)) return;
    firedIdsRef.current.add(next.id);
    setActive(next);
    start();
    // mark as fired so it doesn't ring again on next devices/sessions
    await supabase.from("appointments").update({ alarm_fired: true }).eq("id", next.id);
  }, [start]);

  useEffect(() => {
    check();
    const id = window.setInterval(check, 15000);
    return () => clearInterval(id);
  }, [check]);

  const dismiss = useCallback(() => {
    stop();
    setActive(null);
  }, [stop]);

  return { active, dismiss };
}
