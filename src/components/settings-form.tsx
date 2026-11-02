"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { mutate } from "@/lib/client";
export function SettingsForm({ threshold }: { threshold: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage(""); setError("");
    const value = Number(new FormData(e.currentTarget).get("threshold"));
    try { await mutate("/api/settings", "PATCH", { defaultLowStockThreshold: value }); setMessage("Your workspace settings have been saved."); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="settings-form"><label>Default low-stock threshold<div className="unit-input"><input name="threshold" type="number" min={0} step={1} max={2147483647} defaultValue={threshold} required /><span>units</span></div><span className="field-hint">Applies to products without a custom threshold. Zero is a valid threshold.</span></label>{error && <p role="alert" className="alert error">{error}</p>}{message && <p role="status" className="alert success">{message}</p>}<button disabled={busy} className="button primary"><Check size={17} />{busy ? "Saving…" : "Save settings"}</button></form>;
}
