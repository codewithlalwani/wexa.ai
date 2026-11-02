import { requirePageUser } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><Navigation organization={user.organization.name} email={user.email} /><div className="main-shell"><header className="topbar"><span>Workspace <span className="breadcrumb-slash">/</span> <strong>{user.organization.name}</strong></span><span className="workspace-status"><span />Your inventory workspace</span></header><main id="main" className="main-content">{children}</main><footer className="app-footer">Made for the everyday flow of business.<span>StockFlow MVP</span></footer></div></div>;
}
