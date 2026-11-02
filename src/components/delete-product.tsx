"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { mutate } from "@/lib/client";
export function DeleteProduct({ id, name }: { id: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true); setError("");
    try { await mutate(`/api/products/${id}`, "DELETE"); dialog.current?.close(); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete. Try again."); }
    finally { setBusy(false); }
  }
  return <><button className="icon-button danger-hover" aria-label={`Delete ${name}`} onClick={() => { setError(""); dialog.current?.showModal(); }}><Trash2 size={16} /></button><dialog ref={dialog} className="confirm-dialog" aria-labelledby={`delete-title-${id}`} onCancel={(e) => { if (busy) e.preventDefault(); }}><div className="dialog-icon"><Trash2 size={24} /></div><h2 id={`delete-title-${id}`}>Delete this product?</h2><p><strong>{name}</strong> will be permanently removed from your inventory. This cannot be undone.</p>{error && <p role="alert" className="error-text">{error}</p>}<div className="form-actions"><button autoFocus className="button secondary" disabled={busy} onClick={() => dialog.current?.close()}>Keep product</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete product"}</button></div></dialog></>;
}
