import { CartProvider } from "@/components/storefront/cart/cart-context";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { PageVisitTracker } from "@/components/admin/analytics/page-visit-tracker";
import { readCart } from "@/lib/cart/cart";
import { resolveCart } from "@/lib/cart/queries";
import { getCategories } from "@/lib/catalog/queries";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, cart] = await Promise.all([
    getCategories(),
    resolveCart(await readCart()),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CartProvider cart={cart}>
        <Header categories={categories} cart={cart} />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} />
        <PageVisitTracker />
      </CartProvider>
    </div>
  );
}