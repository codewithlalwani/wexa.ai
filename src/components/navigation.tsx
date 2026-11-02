"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Package, Settings2, LogOut, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { mutate } from "@/lib/client";

export function Navigation({ organization, email }: { organization: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try { await mutate("/api/auth/logout", "POST"); router.push("/login"); router.refresh(); }
    catch { setError("Could not log out. Try again."); setBusy(false); }
  }
  return <aside className="sidebar">
    <Link href="/dashboard" aria-label="StockFlow dashboard"><Brand /></Link>
    <button className="mobile-logout icon-button" onClick={logout} disabled={busy} aria-label="Log out"><LogOut size={18} /></button>
    {error && <p role="alert" className="mobile-logout-error error-text">{error}</p>}
    <div className="workspace"><span className="workspace-avatar">{organization[0]?.toUpperCase()}</span><div><strong>{organization}</strong><span>Your workspace</span></div></div>
    <p className="nav-caption">WORKSPACE</p>
    <nav aria-label="Main navigation">{[
      { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
      { href: "/products", label: "Products", Icon: Package },
      { href: "/settings", label: "Settings", Icon: Settings2 },
    ].map(({ href, label, Icon }) => <Link key={href} href={href} className={`nav-link ${pathname.startsWith(href) ? "active" : ""}`} aria-current={pathname.startsWith(href) ? "page" : undefined}><Icon size={19} />{label}{pathname.startsWith(href) && <span className="active-dot" />}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-note"><span className="eyebrow">LESS GUESSWORK.</span><p>More room to grow.</p><span>A clear view of what’s in stock.</span><ArrowUpRight size={22} /></div>
    <div className="account"><span className="account-avatar">{email[0].toUpperCase()}</span><div><strong>Workspace owner</strong><span title={email}>{email}</span></div><button className="icon-button" onClick={logout} disabled={busy} aria-label="Log out"><LogOut size={18} /></button></div>
    {error && <p role="alert" className="error-text">{error}</p>}</div>
  </aside>;
}
