import Link from "next/link";
import { Pencil, Package, ArrowUpRight } from "lucide-react";
import type { ProductView } from "@/services/inventory";
import { DeleteProduct } from "./delete-product";
export function StockBadge({ product }: { product: ProductView }) {
  return <span className={`badge ${product.isLowStock ? "warning" : "healthy"}`}><span />{product.quantityOnHand === 0 ? "Out of stock" : product.isLowStock ? "Low stock" : "In stock"}</span>;
}
export function ProductTable({ products, lowStock = false }: { products: ProductView[]; lowStock?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>Product</th><th>SKU</th><th className="numeric">Quantity</th><th>{lowStock ? "Threshold" : "Stock status"}</th>{!lowStock && <th className="numeric">Selling price</th>}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((p) => <tr key={p.id}>
    <td><Link className="product-cell" href={`/products/${p.id}/edit`}><span className="product-icon"><Package size={19} /></span><strong>{p.name}</strong></Link></td><td><span className="sku">{p.sku}</span></td><td className="numeric quantity">{p.quantityOnHand.toLocaleString("en-US")}<span className="unit"> units</span></td><td>{lowStock ? <span className="threshold">{p.effectiveThreshold} units</span> : <StockBadge product={p} />}</td>
    {!lowStock && <td className="numeric">{p.sellingPrice === null ? <span className="muted">—</span> : p.sellingPrice}</td>}
    <td><div className="row-actions"><Link className={lowStock ? "text-link" : "icon-button"} aria-label={`Edit ${p.name}`} href={`/products/${p.id}/edit`}>{lowStock ? <>Update stock <ArrowUpRight size={15} /></> : <Pencil size={16} />}</Link>{!lowStock && <DeleteProduct id={p.id} name={p.name} />}</div></td>
  </tr>)}</tbody></table></div>;
}
