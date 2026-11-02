"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, Info, LoaderCircle, Package } from "lucide-react";
import type { ProductView } from "@/services/inventory";
import { mutate, RequestError } from "@/lib/client";

export function ProductForm({ product, defaultThreshold }: { product?: ProductView; defaultThreshold: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const fieldError = (name: string) => fields[name] ? <span className="error-text">{fields[name]}</span> : null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setFields({});
    const form = new FormData(event.currentTarget);
    const input = {
      name: form.get("name"), sku: form.get("sku"), description: form.get("description") || null,
      quantityOnHand: Number(form.get("quantityOnHand")),
      costPrice: form.get("costPrice") || null, sellingPrice: form.get("sellingPrice") || null,
      lowStockThreshold: form.get("lowStockThreshold") === "" ? null : Number(form.get("lowStockThreshold")),
    };
    try { await mutate(product ? `/api/products/${product.id}` : "/api/products", product ? "PATCH" : "POST", input); router.push("/products"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save. Try again."); if (e instanceof RequestError) setFields(e.fields); setBusy(false); }
  }
  return <div className="form-layout"><form className="panel product-form" onSubmit={submit}>
    <div className="form-section"><h2><Package size={19} />Product details</h2><p className="muted">The essentials that make your product easy to find.</p>
      <div className="form-grid"><label className="span-two">Product name <span className="required">*</span><input name="name" required maxLength={150} defaultValue={product?.name} placeholder="e.g. Everyday canvas tote" aria-invalid={!!fields.name} />{fieldError("name")}</label>
      <label className="span-two">SKU <span className="required">*</span><input name="sku" required maxLength={64} defaultValue={product?.sku} placeholder="e.g. TOTE-001" aria-invalid={!!fields.sku} /><span className="field-hint">A unique code within your workspace. Saved in uppercase.</span>{fieldError("sku")}</label>
      <label className="span-two">Description <span className="optional">Optional</span><textarea name="description" maxLength={5000} rows={3} defaultValue={product?.description ?? ""} placeholder="Add a little context about this product…" />{fieldError("description")}</label></div>
    </div>
    <div className="form-section"><h2>Stock & pricing</h2><p className="muted">Keep quantities current and know when to restock.</p><div className="form-grid">
      <label>Quantity on hand <span className="required">*</span><input name="quantityOnHand" type="number" min={0} max={2147483647} step={1} required defaultValue={product?.quantityOnHand ?? 0} aria-invalid={!!fields.quantityOnHand} />{fieldError("quantityOnHand")}</label>
      <label>Low-stock threshold<input name="lowStockThreshold" type="number" min={0} max={2147483647} step={1} defaultValue={product?.lowStockThreshold ?? ""} placeholder={`Workspace default (${defaultThreshold})`} aria-invalid={!!fields.lowStockThreshold} />{fieldError("lowStockThreshold")}</label>
      <label>Cost price <span className="optional">Optional</span><input name="costPrice" inputMode="decimal" pattern="[0-9]{1,10}(\.[0-9]{1,2})?" defaultValue={product?.costPrice ?? ""} placeholder="0.00" aria-invalid={!!fields.costPrice} />{fieldError("costPrice")}</label>
      <label>Selling price <span className="optional">Optional</span><input name="sellingPrice" inputMode="decimal" pattern="[0-9]{1,10}(\.[0-9]{1,2})?" defaultValue={product?.sellingPrice ?? ""} placeholder="0.00" aria-invalid={!!fields.sellingPrice} />{fieldError("sellingPrice")}</label>
    </div></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="form-actions"><Link className="button secondary" href="/products">Cancel</Link><button className="button primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{busy ? "Saving…" : product ? "Save changes" : "Create product"}</button></div>
  </form><aside className="form-help"><div className="help-icon"><Info size={22} /></div><h3>A little clarity goes a long way.</h3><p>Use a consistent SKU format to find products quickly as your inventory grows.</p><hr /><h4>When is stock low?</h4><p>A product needs attention when its quantity reaches or falls below its threshold.</p><p>Leave the threshold blank to use your workspace default of <strong>{defaultThreshold} units</strong>.</p><hr /><p>Prices are stored as entered, with two decimal places. Use one currency consistently across your workspace.</p></aside></div>;
}
