import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
export const metadata = { title: "Add product" };
export default async function NewProduct() {
  const user = await requirePageUser();
  return <><Link href="/products" className="back-link"><ArrowLeft size={16} />Back to products</Link><div className="page-heading"><div><h1>Add a product<span className="heading-dot">.</span></h1><p>A few details now. A clearer picture of your stock.</p></div></div><ProductForm defaultThreshold={user.organization.defaultLowStockThreshold} /></>;
}
