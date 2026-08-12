import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { getCategories } from "@/lib/catalog/queries";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </div>
  );
}