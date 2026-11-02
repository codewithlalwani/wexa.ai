import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getProduct } from "@/services/inventory";
import { ProductForm } from "@/components/product-form";
export const metadata = { title: "Edit product" };
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  let product;
  try { product = await getProduct(user, (await params).id); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  return <><Link href="/products" className="back-link"><ArrowLeft size={16} />Back to products</Link><div className="page-heading"><div><h1>Edit product<span className="heading-dot">.</span></h1><p>Keep the details and stock levels up to date.</p></div></div><ProductForm product={product} defaultThreshold={user.organization.defaultLowStockThreshold} /></>;
}
