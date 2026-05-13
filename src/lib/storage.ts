import { supabase } from "@/integrations/supabase/client";

const BUCKET = "evaluation-photos";

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

export async function uploadPhoto(evaluationId: string, dataUrl: string, slotKey: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const path = `${evaluationId}/${slotKey}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw error;
  // Bucket is private; return a long-lived signed URL so authenticated users can view the photo.
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr || !signed) throw signErr ?? new Error("Failed to sign URL");
  return signed.signedUrl;
}

/** Upload all photos that are still data URLs; returns map keyed by slot. */
export async function uploadAllPhotos(
  evaluationId: string,
  photos: { key: string; label: string; src: string | null }[]
) {
  const out: { key: string; label: string; url: string | null }[] = [];
  for (const p of photos) {
    if (!p.src) {
      out.push({ key: p.key, label: p.label, url: null });
    } else if (p.src.startsWith("data:")) {
      const url = await uploadPhoto(evaluationId, p.src, p.key);
      out.push({ key: p.key, label: p.label, url });
    } else {
      out.push({ key: p.key, label: p.label, url: p.src });
    }
  }
  return out;
}
