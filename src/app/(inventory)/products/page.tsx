import Link from "next/link";
import { Plus, Search, Package, ArrowLeft, ArrowRight } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { listProducts } from "@/services/inventory";
import { ProductTable } from "@/components/product-table";
export const metadata = { title: "Products" };
export default async function Products({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const user = await requirePageUser();
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.slice(0, 150) : "";
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.page) || 1)));
  const data = await listProducts(user, search, page);
  const pageUrl = (p: number) => `/products?${new URLSearchParams({ search, page: String(p) })}`;
  return <><div className="page-heading"><div><span className="eyebrow">EVERYTHING IN ITS PLACE</span><h1>Your products<span className="heading-dot">.</span></h1><p>One tidy home for everything you keep in stock.</p></div><Link className="button primary" href="/products/new"><Plus size={18} />Add product</Link></div><section className="panel"><div className="products-toolbar"><h2>All products <span className="count-pill">{data.total}</span></h2><form action="/products" className="search-form"><Search size={18} /><input name="search" aria-label="Search by name or SKU" defaultValue={search} placeholder="Search by name or SKU…" maxLength={150} /><button className="search-submit" type="submit">Search</button></form></div>
    {data.products.length ? <ProductTable products={data.products} /> : <div className="empty-state"><div className="empty-icon"><Package size={30} /></div><h3>{search || page > 1 ? "No products found." : "Let’s make room for your first product."}</h3><p>{search || page > 1 ? "Try a different name or SKU, or return to the full list." : "Add a product to start keeping track of your inventory."}</p><Link className="button secondary" href={search || page > 1 ? "/products" : "/products/new"}>{search || page > 1 ? "View all products" : "Add a product"}<ArrowRight size={16} /></Link></div>}
    <div className="pagination"><span>{data.products.length ? `${(page - 1) * 25 + 1}–${(page - 1) * 25 + data.products.length} of ${data.total} products` : `${data.total} products`}</span><div>{page > 1 && <Link className="button small secondary" href={pageUrl(page - 1)}><ArrowLeft size={15} />Previous</Link>}{page * 25 < data.total && <Link className="button small secondary" href={pageUrl(page + 1)}>Next<ArrowRight size={15} /></Link>}</div></div></section><p className="below-note">A product is low on stock when its quantity reaches or falls below its threshold.</p></>;
}
