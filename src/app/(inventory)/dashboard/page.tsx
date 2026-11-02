import Link from "next/link";
import { Package, Boxes, TriangleAlert, Plus, ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { dashboard } from "@/services/inventory";
import { ProductTable } from "@/components/product-table";
export const metadata = { title: "Overview" };
export default async function Dashboard() {
  const user = await requirePageUser();
  const data = await dashboard(user);
  return <><div className="page-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h1>Inventory overview<span className="heading-dot">.</span></h1><p>A little clarity for your day. Here’s where your stock stands.</p></div><Link className="button primary" href="/products/new"><Plus size={18} />Add product</Link></div>
    <div className="stats-grid">{[
      { label: "Total products", value: data.totalProducts, description: "Unique products in your workspace", Icon: Package, className: "" },
      { label: "Units on hand", value: data.totalQuantity, description: "Across your entire inventory", Icon: Boxes, className: "" },
      { label: "Low-stock products", value: data.lowStockCount, description: data.lowStockCount ? "A little attention goes a long way" : "Everything is above its threshold", Icon: TriangleAlert, className: "amber" },
    ].map(({ label, value, description, Icon, className }) => <section className={`stat-card ${className}`} key={label}><div className="stat-top"><h2>{label}</h2><span className="stat-icon"><Icon size={19} /></span></div><strong className="stat-number">{value.toLocaleString("en-US")}</strong><p>{description}</p></section>)}</div>
    <section className="panel"><div className="panel-heading"><div><h2><span className="status-marker" />Needs a little attention <span className="count-pill">{data.lowStockCount}</span></h2><p>Products at or below their low-stock threshold.</p></div><Link href="/products" className="text-link">View all products <ArrowRight size={16} /></Link></div>
    {data.lowStock.length ? <><ProductTable products={data.lowStock} lowStock />{data.lowStockCount > 100 && <p className="table-footnote">Showing the first 100 low-stock products. Use Products to find and update more.</p>}</> : <div className="empty-state"><div className="empty-icon">{data.totalProducts ? <CircleCheck size={30} /> : <Package size={30} />}</div><h3>{data.totalProducts ? "Your stock is looking healthy." : "Your next chapter starts with one product."}</h3><p>{data.totalProducts ? "No products are at or below their low-stock threshold." : "Add your first product and we’ll help you keep an eye on the details."}</p><Link className="button secondary" href={data.totalProducts ? "/products" : "/products/new"}>{data.totalProducts ? "Explore your inventory" : "Add your first product"}<ArrowRight size={16} /></Link></div>}
    </section><section className="tip-banner"><span className="tip-icon"><Sparkles size={23} /></span><div><h3>Small details. Smoother days.</h3><p>Your default low-stock threshold is <strong>{user.organization.defaultLowStockThreshold} units</strong>. Set a custom threshold on any product to make it your own.</p></div><Link href="/settings" className="text-link">Manage settings <ArrowRight size={16} /></Link></section>
  </>;
}
