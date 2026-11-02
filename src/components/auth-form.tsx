"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { mutate, RequestError } from "@/lib/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setFields({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await mutate(`/api/auth/${mode}`, "POST", values); router.push("/dashboard"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not connect. Try again."); if (e instanceof RequestError) setFields(e.fields); setBusy(false); }
  }
  return <div className="auth-form-wrap"><span className="eyebrow">YOUR INVENTORY, IN ORDER</span><h1>{signup ? "A fresh start for your stock." : "Welcome back."}</h1><p className="muted">{signup ? "Create your workspace and make room for simpler days." : "Let’s see how your inventory is doing today."}</p>
    <form onSubmit={submit} className="form-stack">
      {signup && <label>Organization name<input name="organizationName" placeholder="e.g. The Everyday Store" required maxLength={100} autoComplete="organization" aria-invalid={!!fields.organizationName} />{fields.organizationName && <span className="error-text">{fields.organizationName}</span>}</label>}
      <label>Email address<input name="email" type="email" placeholder="you@yourstore.com" required maxLength={254} autoComplete="email" aria-invalid={!!fields.email} />{fields.email && <span className="error-text">{fields.email}</span>}</label>
      <label>Password<input name="password" type="password" placeholder={signup ? "At least 12 characters" : "Enter your password"} required minLength={signup ? 12 : 1} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} aria-invalid={!!fields.password} />{fields.password && <span className="error-text">{fields.password}</span>}</label>
      {signup && <label>Confirm password<input name="confirmPassword" type="password" placeholder="Enter your password again" required maxLength={128} autoComplete="new-password" aria-invalid={!!fields.confirmPassword} />{fields.confirmPassword && <span className="error-text">{fields.confirmPassword}</span>}</label>}
      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="button primary full" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin" /> : null}{busy ? "One moment…" : signup ? "Create workspace" : "Log in"}{!busy && <ArrowRight size={18} />}</button>
    </form>
    <p className="auth-switch">{signup ? "Already have a workspace?" : "New to StockFlow?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link></p>
    {!signup && <p className="auth-footnote">Need access help? Contact your workspace administrator.</p>}
  </div>;
}
