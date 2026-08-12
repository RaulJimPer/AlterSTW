# AlterSTW — Demo seed catalog

Source of truth for the demo rows written by `scripts/seed.ts` (feature 001).
The live product data lives in Supabase; this document is the human-readable
reference the owner greets every dev environment with.

Storefront copy is Spanish (site language); this doc is prose in English.

## Command

```powershell
npm run seed
```

Idempotent: upserts by `slug`, resets `product_sizes` per product, and always
keeps the five categories. Requires `SUPABASE_SERVICE_ROLE_KEY` in
`.env.local` (server-only, never used by the app runtime).

## Categories

| slug | name | order |
|---|---|---|
| `camisetas` | Camisetas | 1 |
| `sudaderas` | Sudaderas | 2 |
| `pantalones` | Pantalones | 3 |
| `chaquetas` | Chaquetas | 4 |
| `accesorios` | Accesorios | 5 |

## Products (12)

Money is integer EUR cents. `publishedDaysAgo` drives the NUEVO badge
(`< 14`), `stockTotal` the ÚLTIMAS/AGOTADO stamps. Sizes follow the canonical
order `XS S M L XL XXL Única`.

| slug | name | cat | price | badge | sizes (stock) |
|---|---|---|---|---|---|
| `skull-crush-tee` | Skull Crush Tee | camisetas | 2500 | NUEVO | S4 M6 L5 XL2 |
| `pin-stripe-riot-tee` | Pin-Stripe Riot Tee | camisetas | 2290 | ÚLTIMAS | XS1 S1 M1 |
| `faded-89-tee` | Faded '89 Tee | camisetas | 2150 | AGOTADO | S0 M0 L0 XL0 |
| `after-dark-hoodie` | After Dark Hoodie | sudaderas | 5499 | NUEVO | S2 M6 L4 |
| `graff-cap` | Graff Cap | accesorios | 1800 | — | Única 8 |
| `cargo-unit-pants` | Cargo Unit Pants | pantalones | 4750 | — | M2 L1 XL1 |
| `bomber-night` | Bomber Night | chaquetas | 6995 | NUEVO | S1 M1 L1 |
| `flannel-97` | Flannel '97 | camisetas | 3200 | — | S2 M3 L2 XL1 |
| `stud-destroyer-vest` | Stud Destroyer Vest | chaquetas | 5900 | ÚLTIMAS | M1 L2 |
| `leather-rebel` | Leather Rebel Jacket | chaquetas | 8990 | ÚLTIMAS | M2 L1 |
| `velvet-rider-pants` | Velvet Rider Pants | pantalones | 4300 | ÚLTIMAS | S1 M2 |
| `denim-ghost` | Denim Ghost Patchwork | chaquetas | 6550 | NUEVO | Única 7 |

Badge mix on purpose: 4 NUEVO + 4 ÚLTIMAS + 1 AGOTADO + 3 neutral, so every
availability state and the `av` filter have something to show.

## Copy (Spanish)

- **Skull Crush Tee** — *Camiseta negra de algodón orgánico 240 g con print
  frontal de calavera en el pecho. Corte regular, cuello reforzado. El grito
  de la tribu, estampado en serigrafía a una sola pasada.*
- **Pin-Stripe Riot Tee** — *Camiseta de rayas rojo/hueso de costura plana.
  Estampada como la prensa de ayer y cortada para los que despiertan el
  barrio. Últimas unidades en talla pequeña o mediana.*
- **Faded '89 Tee** — *Camiseta lavada a la piedra con destiñe controlado y
  dobladillo deshilachado. El que la ve del revés sabe de qué barrio viene.
  Reposición en camino.*
- **After Dark Hoodie** — *Sudadera con capucha forrada en felpa de algodón
  perlado, 380 g. Bolsillo canguro, cordones planos y etiqueta tejida en el
  bajo. Para tu gente, después del bolo.*
- **Graff Cap** — *Gorra de seis paneles en sarga con parche frontal bordado
  y cierre trasero de hebilla. El pichoncillo del barrio no sale sin ella.*
- **Cargo Unit Pants** — *Pantalón de corte militar con bolsillos de fuelle y
  doble costura de refuerzo. Ripstop ligero y cintura ajustable con cordón
  interior. Para moverte por la ciudad sin soltar nada.*
- **Bomber Night** — *Chaqueta bomber de nylon satinado con forro naranja y
  bolsillo frontal de seguridad. Puños de punto ribeteado y cremallera roja
  para que la vean venir de noche.*
- **Flannel '97** — *Camisa de franela a cuadros rojo/hueso, 260 g de algodón
  cepillado. Botones de carey y bolsillo al pecho. El clásico que no envejece,
  como la hora del recreo.*
- **Stud Destroyer Vest** — *Chaqueta sin mangas en mezclilla lavada con
  remaches metálicos clavados a mano. Más dura que el lunes sin café. Cada
  remache, clavado, no pegado.*
- **Leather Rebel Jacket** — *Chaqueta de piel curtida, cierre central y
  cuello estilo motero. Se porta, no se viste. Últimas piezas del lote.*
- **Velvet Rider Pants** — *Pantalón de pana con canalé ancho en tonos
  morados. Corte recto de tiro medio y bolsillos al bies. El lujo tranquilo de
  quien llega solo a la cita.*
- **Denim Ghost Patchwork** — *Chaqueta vaquera de retales de denim cosidos a
  la vista, con forro interior. Ninguna igual, todas de la misma calle. Pieza
  de archivo.*

## Images

Each product references exactly one asset in `public/images/seed/` — real
garment photos only (punk / alternative / vintage / second-hand vibe), no
faces, from free-license sources:

- Photos from Pexels (Pexels License): `skull-crush.jpg`, `pinstripe-riot.jpg`,
  `faded-89.jpg`, `graff-cap.jpg`, `cargo-unit.jpg`, `bomber-night.jpg`,
  `flannel-97.jpg`, `velvet-rider.jpg`.
- Photos from Unsplash (Unsplash License): `leather-rebel.jpg`,
  `after-dark-hoodie.jpg`.
- Photos from Wikimedia Commons: `stud-destroyer.jpg` (CC BY-SA 2.0),
  `denim-ghost.jpg` (CC0).

Sources and license details live in `public/images/seed/CREDITS.txt`.
`fallback.svg` (prenda no disponible) is an in-house SVG used only as the
app's fallback when a product has no images — it is not seeded as product
data.