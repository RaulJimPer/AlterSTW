import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Demo catalog seed (feature 001). Runs with the service role (bypasses RLS),
// is idempotent via upserts on natural keys, and mirrors the canonical
// catalog written up in docs/seed-catalog.md. The app runtime never uses the
// service role.

const ENV_FILE = ".env.local";
if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} in ${ENV_FILE}`);
  }
  return value;
}

const sizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL", "Ãšnica"]);
const categorySlugs = [
  "camisetas",
  "sudaderas",
  "pantalones",
  "chaquetas",
  "accesorios",
] as const;
const categorySchema = z.enum(categorySlugs);

const sizeStockSchema = z.object({
  size: sizeSchema,
  stock: z.number().int().nonnegative(),
});

const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: categorySchema,
  priceCents: z.number().int().positive(),
  description: z.string().min(1),
  image: z.string().startsWith("/images/seed/"),
  publishedDaysAgo: z.number().int().nonnegative(),
  sizes: z.array(sizeStockSchema).min(1),
});

type SeedProduct = z.infer<typeof productSchema>;

const categories = [
  { slug: "camisetas", name: "Camisetas", sort_order: 1 },
  { slug: "sudaderas", name: "Sudaderas", sort_order: 2 },
  { slug: "pantalones", name: "Pantalones", sort_order: 3 },
  { slug: "chaquetas", name: "Chaquetas", sort_order: 4 },
  { slug: "accesorios", name: "Accesorios", sort_order: 5 },
];

const storeCatalog: SeedProduct[] = [
  {
    slug: "skull-crush-tee",
    name: "Skull Crush Tee",
    category: "camisetas",
    priceCents: 2500,
    description:
      "Camiseta negra de algodÃ³n orgÃ¡nico 240 g con print frontal de calavera en el pecho. Corte regular, cuello reforzado. El grito de la tribu, estampado en serigrafÃ­a a una sola pasada.",
    image: "/images/seed/skull-crush.jpg",
    publishedDaysAgo: 6,
    sizes: [
      { size: "S", stock: 4 },
      { size: "M", stock: 6 },
      { size: "L", stock: 5 },
      { size: "XL", stock: 2 },
    ],
  },
  {
    slug: "pin-stripe-riot-tee",
    name: "Pin-Stripe Riot Tee",
    category: "camisetas",
    priceCents: 2290,
    description:
      "Camiseta de rayas rojo/hueso de costura plana. Estampada como la prensa de ayer y cortada para los que despiertan el barrio. Ãšltimas unidades en talla pequeÃ±a o mediana.",
    image: "/images/seed/pinstripe-riot.jpg",
    publishedDaysAgo: 45,
    sizes: [
      { size: "XS", stock: 1 },
      { size: "S", stock: 1 },
      { size: "M", stock: 1 },
    ],
  },
  {
    slug: "faded-89-tee",
    name: "Faded '89 Tee",
    category: "camisetas",
    priceCents: 2150,
    description:
      "Camiseta lavada a la piedra con destiÃ±e controlado y dobladillo deshilachado. El que la ve del revÃ©s sabe de quÃ© barrio viene. ReposiciÃ³n en camino.",
    image: "/images/seed/faded-89.jpg",
    publishedDaysAgo: 30,
    sizes: [
      { size: "S", stock: 0 },
      { size: "M", stock: 0 },
      { size: "L", stock: 0 },
      { size: "XL", stock: 0 },
    ],
  },
  {
    slug: "after-dark-hoodie",
    name: "After Dark Hoodie",
    category: "sudaderas",
    priceCents: 5499,
    description:
      "Sudadera con capucha forrada en felpa de algodÃ³n perlado, 380 g. Bolsillo canguro, cordones planos y etiqueta tejida en el bajo. Para tu gente, despuÃ©s del bolo.",
    image: "/images/seed/after-dark-hoodie.jpg",
    publishedDaysAgo: 4,
    sizes: [
      { size: "S", stock: 2 },
      { size: "M", stock: 6 },
      { size: "L", stock: 4 },
    ],
  },
  {
    slug: "graff-cap",
    name: "Graff Cap",
    category: "accesorios",
    priceCents: 1800,
    description:
      "Gorra de seis paneles en sarga con parche frontal bordado y cierre trasero de hebilla. El pichoncillo del barrio no sale sin ella.",
    image: "/images/seed/graff-cap.jpg",
    publishedDaysAgo: 20,
    sizes: [{ size: "Ãšnica", stock: 8 }],
  },
  {
    slug: "cargo-unit-pants",
    name: "Cargo Unit Pants",
    category: "pantalones",
    priceCents: 4750,
    description:
      "PantalÃ³n de corte militar con bolsillos de fuelle y doble costura de refuerzo. Ripstop ligero y cintura ajustable con cordÃ³n interior. Para moverte por la ciudad sin soltar nada.",
    image: "/images/seed/cargo-unit.jpg",
    publishedDaysAgo: 60,
    sizes: [
      { size: "M", stock: 2 },
      { size: "L", stock: 1 },
      { size: "XL", stock: 1 },
    ],
  },
  {
    slug: "bomber-night",
    name: "Bomber Night",
    category: "chaquetas",
    priceCents: 6995,
    description:
      "Chaqueta bomber de nylon satinado con forro naranja y bolsillo frontal de seguridad. PuÃ±os de punto ribeteado y cremallera roja para que la vean venir de noche.",
    image: "/images/seed/bomber-night.jpg",
    publishedDaysAgo: 2,
    sizes: [
      { size: "S", stock: 1 },
      { size: "M", stock: 1 },
      { size: "L", stock: 1 },
    ],
  },
  {
    slug: "flannel-97",
    name: "Flannel '97",
    category: "camisetas",
    priceCents: 3200,
    description:
      "Camisa de franela a cuadros rojo/hueso, 260 g de algodÃ³n cepillado. Botones de carey y bolsillo al pecho. El clÃ¡sico que no envejece, como la hora del recreo.",
    image: "/images/seed/flannel-97.jpg",
    publishedDaysAgo: 50,
    sizes: [
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
      { size: "L", stock: 2 },
      { size: "XL", stock: 1 },
    ],
  },
  {
    slug: "stud-destroyer-vest",
    name: "Stud Destroyer Vest",
    category: "chaquetas",
    priceCents: 5900,
    description:
      "Chaqueta sin mangas en mezclilla lavada con remaches metÃ¡licos clavados a mano. MÃ¡s dura que el lunes sin cafÃ©. Cada remache, clavado, no pegado.",
    image: "/images/seed/stud-destroyer.jpg",
    publishedDaysAgo: 16,
    sizes: [
      { size: "M", stock: 1 },
      { size: "L", stock: 2 },
    ],
  },
  {
    slug: "leather-rebel",
    name: "Leather Rebel Jacket",
    category: "chaquetas",
    priceCents: 8990,
    description:
      "Chaqueta de piel curtida, cierre central y cuello estilo motero. Se porta, no se viste. Ãšltimas piezas del lote.",
    image: "/images/seed/leather-rebel.jpg",
    publishedDaysAgo: 120,
    sizes: [
      { size: "M", stock: 2 },
      { size: "L", stock: 1 },
    ],
  },
  {
    slug: "velvet-rider-pants",
    name: "Velvet Rider Pants",
    category: "pantalones",
    priceCents: 4300,
    description:
      "PantalÃ³n de pana con canalÃ© ancho en tonos morados. Corte recto de tiro medio y bolsillos al bies. El lujo tranquilo de quien llega solo a la cita.",
    image: "/images/seed/velvet-rider.jpg",
    publishedDaysAgo: 70,
    sizes: [
      { size: "S", stock: 1 },
      { size: "M", stock: 2 },
    ],
  },
  {
    slug: "denim-ghost",
    name: "Denim Ghost Patchwork",
    category: "chaquetas",
    priceCents: 6550,
    description:
      "Chaqueta vaquera de retales de denim cosidos a la vista, con forro interior. Ninguna igual, todas de la misma calle. Pieza de archivo.",
    image: "/images/seed/denim-ghost.jpg",
    publishedDaysAgo: 8,
    sizes: [{ size: "Ãšnica", stock: 7 }],
  },
];

const catalog = productSchema.array().parse(storeCatalog);

const DAY_MS = 24 * 60 * 60 * 1000;

function publishedAt(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_MS).toISOString();
}

function assertAssetOnDisk(image: string): void {
  const file = path.join("public", image);
  if (!existsSync(file)) {
    throw new Error(`Seed asset missing on disk: ${image}`);
  }
}

async function main(): Promise<void> {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (categories.length !== categorySlugs.length) {
    throw new Error("Category definitions do not match the declared slugs");
  }
  for (const product of catalog) {
    assertAssetOnDisk(product.image);
  }

  const { error: catUpsertError } = await db
    .from("categories")
    .upsert(categories, { onConflict: "slug", ignoreDuplicates: true });
  if (catUpsertError) {
    throw new Error(`categories upsert failed: ${catUpsertError.message}`);
  }

  const { data: categoryRows, error: catError } = await db
    .from("categories")
    .select("id, slug");
  if (catError) throw new Error(`categories read failed: ${catError.message}`);

  const idBySlug = new Map<string, number>();
  for (const row of (categoryRows as unknown) as { id: number; slug: string }[]) {
    idBySlug.set(row.slug, row.id);
  }
  for (const slug of categorySlugs) {
    if (!idBySlug.has(slug)) {
      throw new Error(`Category ${slug} has no row after upsert`);
    }
  }

  let created = 0;
  let updated = 0;
  let sizesWritten = 0;

  for (const product of catalog) {
    const categoryId = idBySlug.get(product.category);
    if (categoryId === undefined) {
      throw new Error(`Unknown category for ${product.slug}`);
    }

    const existing = await db
      .from("products")
      .select("id")
      .eq("slug", product.slug)
      .maybeSingle();
    if (existing.error) {
      throw new Error(`product lookup failed (${product.slug}): ${existing.error.message}`);
    }

    const { error: upsertError } = await db.from("products").upsert(
      {
        slug: product.slug,
        name: product.name,
        description: product.description,
        price_cents: product.priceCents,
        category_id: categoryId,
        images: [product.image],
        status: "published",
        published_at: publishedAt(product.publishedDaysAgo),
      },
      { onConflict: "slug" },
    );
    if (upsertError) {
      throw new Error(`product upsert failed (${product.slug}): ${upsertError.message}`);
    }

    const { data: detail, error: detailError } = await db
      .from("products")
      .select("id")
      .eq("slug", product.slug)
      .maybeSingle();
    if (detailError || detail === null) {
      throw new Error(`product read failed after upsert (${product.slug})`);
    }
    const productId = (detail as unknown as { id: number }).id;

    const { error: purgeError } = await db
      .from("product_sizes")
      .delete()
      .eq("product_id", productId);
    if (purgeError) {
      throw new Error(`product_sizes purge failed (${product.slug})`);
    }

    const rows = product.sizes.map((entry, index) => ({
      product_id: productId,
      size: entry.size,
      stock: entry.stock,
      sort_order: index,
    }));
    const { error: sizeError } = await db.from("product_sizes").insert(rows);
    if (sizeError) {
      throw new Error(`product_sizes insert failed (${product.slug})`);
    }
    sizesWritten += rows.length;

    if (existing.data === null) created += 1;
    else updated += 1;
  }

  const { data: countRows, error: countError } = await db
    .from("products")
    .select("id", { count: "exact" });
  if (countError) throw new Error(`products count failed: ${countError.message}`);

  console.log("AlterSTW seed complete");
  console.log(`  categories : ${categories.length}`);
  console.log(`  products   : ${countRows.length} rows (${created} created, ${updated} updated)`);
  console.log(`  sizes      : ${sizesWritten} rows`);
  console.log(`  status     : all 'published'`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`AlterSTW seed failed: ${message}`);
  process.exitCode = 1;
});