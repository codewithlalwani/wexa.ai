import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "StockFlow — Inventory, simplified", template: "%s · StockFlow" }, description: "A clear, calm workspace for your products and inventory." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
