import { SlidersHorizontal, Building2 } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";
export const metadata = { title: "Settings" };
export default async function Settings() {
  const user = await requirePageUser();
  return <><div className="page-heading"><div><span className="eyebrow">MAKE IT YOUR OWN</span><h1>Workspace settings<span className="heading-dot">.</span></h1><p>The small preferences that keep your inventory running smoothly.</p></div></div><div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h2><SlidersHorizontal size={19} />Inventory defaults</h2><p>Set the baseline for low-stock alerts across your workspace.</p></div></div><SettingsForm threshold={user.organization.defaultLowStockThreshold} /></section><section className="panel organization-card"><span className="help-icon"><Building2 size={23} /></span><h2>{user.organization.name}</h2><p className="muted">Your organization</p><hr /><span className="eyebrow">WORKSPACE OWNER</span><p className="owner-email">{user.email}</p><span className="badge healthy"><span />Single-owner workspace</span></section></div></>;
}
