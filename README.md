# karcher-gei.tn

The rebuild of [karcher-gei.tn](https://karcher-gei.tn) off PrestaShop: a **Next.js** storefront with **Payload CMS**
inside it, on a **Vendure** (NestJS) commerce backend. Every public URL keeps its exact PrestaShop path, so the
switch looks to Google like a hosting change, not a site move.

```text
apps/
  storefront/        Next.js 16 (App Router) + Payload 3 admin at /admin-cms      :3001
    src/proxy.ts       legacy URL rewrites (/home-garden/867-x.html -> /p/867) + permanent redirects to canonical
    src/cms/           Payload collections, globals and homepage blocks
  server/            Vendure 3.8 server + worker, dashboard at /dashboard           :3000
    src/plugins/       konnect-payment, quotes, warranty, forms, legacy-urls, meta-capi
packages/
  seo/               the only place URLs are parsed and built (+ JSON-LD); unit-tested
  ui/                Karcher design tokens (Tailwind v4) and shared components
  graphql/           typed Shop API client; `pnpm codegen` generates types from the server
  config/            shared tsconfig
tools/migration/     reads a copy of the PrestaShop database: URL inventory, import, URL check
```

## Requirements

- **Node.js 24** (Payload 3.92 needs `^22.23.4 || >=24.22.1`; Vendure 3.8 needs 22 or 24). See `.nvmrc`.
- pnpm 10 via Corepack: `corepack enable`
- Docker, for PostgreSQL

## First run

```bash
corepack enable
pnpm install
cp apps/server/.env.example apps/server/.env
cp apps/storefront/.env.example apps/storefront/.env
pnpm db:up
pnpm --filter @karcher/server migrate
pnpm --filter @karcher/storefront migrate
pnpm dev
# once, in a second terminal while the server runs: TND, French, Tunisia zone, TVA 19%, shipping, payment methods
pnpm --filter @karcher/server setup:channel
```

- Storefront: http://localhost:3001 · CMS admin: http://localhost:3001/admin-cms (creates the first user)
- Vendure dashboard: http://localhost:3000/dashboard (superadmin credentials from `apps/server/.env`)
- Dev mailbox (emails Vendure would send): http://localhost:3000/mailbox

Both database schemas come from migrations, never from automatic sync:

- Vendure (`apps/server/src/migrations`): after changing an entity or a custom field, run
  `pnpm --filter @karcher/server migration:generate <name>`, review the file, then `migrate`.
- Payload (`apps/storefront/src/migrations`): after changing a collection or global, run
  `pnpm --filter @karcher/storefront migrate:create <name>`, review the file, then `migrate`. In production
  the storefront applies pending Payload migrations when it starts.
  `setup:channel` sets the shipping rate to 0; set the real delivery prices in the dashboard.

## Everyday commands

| Command                                            | What it does                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                         | Runs the storefront, Vendure server, worker and dashboard             |
| `pnpm typecheck`                                   | TypeScript across every package                                       |
| `pnpm test`                                        | Unit tests (legacy URLs, PrestaShop price rules, CSV parsing)         |
| `pnpm test:e2e`                                    | Browser tests against the running stack (see "Browser tests")         |
| `pnpm codegen`                                     | Regenerates Shop API types (Vendure server must be running)           |
| `pnpm --filter @karcher/storefront generate:types` | Regenerates `payload-types.ts` after a CMS schema change              |
| `pnpm --filter @karcher/migration inventory`       | Lists every PrestaShop URL from a database copy, for the Gate A check |

## How legacy URLs work

| Old URL                                          | Internal route           | Found by                                                     |
| ------------------------------------------------ | ------------------------ | ------------------------------------------------------------ |
| `/home-garden/867-aspirateur-laveur-fcv-3.html`  | `/p/867`                 | Vendure product `customFields.legacyId`                      |
| `/12-home-garden`                                | `/c/12`                  | Vendure collection `customFields.legacyId`                   |
| `/2_karcher` (brand)                             | `/b/2`                   | "marque" facet value `customFields.legacyManufacturerId`     |
| `/3__fournisseur`, `/fournisseur` (supplier)     | 301 to `/brands`         | no supplier pages                                            |
| `/content/62-devenir-revendeur`                  | real route               | Payload page `legacyId`                                      |
| `/2292-home_default/aspirateur-laveur-fcv-3.jpg` | `/img/2292/home_default` | Vendure asset `customFields.legacyImageId`, 301 to the asset |
| `/promotions`, `/nous-contacter`, ...            | `/s/{page}`              | fixed list in `packages/seo`                                 |
| anything else                                    | catch-all                | `legacyRedirect` table in Vendure (dashboard), else 404      |

A request whose slug or category differs from the canonical one gets a permanent redirect to the canonical URL, as PrestaShop
does today (Next.js sends 308 where PrestaShop sends 301; Google treats them the same). Products created after the migration need a `legacyId` (SEO tab in the dashboard) to get a URL.

## Shopping and account pages

| Route                                                                        | What it does                                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/panier`                                                                    | Cart; the header count comes from `/panier/nombre`, so catalog pages stay cacheable      |
| `/commande`                                                                  | Checkout: contact, address (governorate), shipping, payment                              |
| `/commande/paiement`                                                         | Konnect failure URL (`?echec=1`) and retry for an unpaid order                           |
| `/commande/confirmation/{code}`                                              | Konnect success URL; refreshes until the webhook has settled the payment                 |
| `/compte`, `/compte/commandes`, `/compte/adresses`                           | Profile, password, e-mail, order history, addresses                                      |
| `/compte/connexion`, `/compte/inscription`, `/compte/mot-de-passe-oublie`    | Sign in, register, request a password reset                                              |
| `/compte/verification`, `/compte/mot-de-passe`, `/compte/verification-email` | Links of Vendure's e-mails; each asks for a click, so mail scanners cannot use the token |
| `/devis`                                                                     | Quote request for one product (`?produit=&variante=`) or the cart (`?panier=1`)          |
| `/garantie`                                                                  | Warranty registration                                                                    |
| `/recherche`                                                                 | Product search (`?s=`), not indexed                                                      |

The header menu, footer product links and homepage category tiles come from Vendure's collection tree (collections
need a `legacyId` to appear); the CMS Navigation links are added after them. Until staff fill the CMS, the homepage and
footer fall back to defaults built from the catalog. Search lives at `/recherche?s=`, PrestaShop's search URL.

The shopper's Vendure session token lives in the httpOnly `kgei_session` cookie (`src/lib/session.ts`); every cart,
checkout and account change is a Server Action. Category pages filter with `?q=` (facet value ids), sort with
`?order=` and page with `?page=`, PrestaShop's parameter names, which `robots.txt` already handles.

In dev the checkout also offers Vendure's test payment method, which settles at once. To try the Konnect flow
without Konnect, point `KONNECT_API_URL` in `apps/server/.env` at a mock of its API.

## Migrating from PrestaShop

`tools/migration` reads a **copy** of the PrestaShop database (never the live one) and imports it. Every step can run
again: products, categories and images are matched on their PrestaShop id, customers on their e-mail.

```bash
mysql prestashop_copy < dump.sql                   # the phpMyAdmin export, into a local MySQL/MariaDB
cp tools/migration/.env.example tools/migration/.env # database, image source, Vendure credentials
pnpm --filter @karcher/migration inventory         # every PrestaShop URL -> out/url-inventory.csv
pnpm --filter @karcher/migration import:shop       # catalog, customers, CMS export (see out/import-report.txt)
pnpm --filter @karcher/storefront import:cms       # CMS pages and fixed pages' meta tags into Payload
pnpm --filter @karcher/migration check:urls        # every URL of the inventory against the storefront
```

The Vendure server must be running, on a database prepared with `migrate` and `setup:channel`.

| PrestaShop                          | Vendure / Payload                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Products, descriptions, meta tags   | Products with `legacyId`, `ean13` (valid EAN-8/13 only), `urlCategory`, SEO fields    |
| Prices excluding VAT, tax rules     | Prices including VAT in millimes, one tax category per Tunisian rate (`TVA 7%`...)    |
| Combinations (`Version`, ...)       | Option groups and variants, each with its SKU, price and stock                        |
| Features                            | Facets: category filters and product specifications                                   |
| Images (`img/p`), legends           | Assets with `legacyImageId` and `alt`, cover first; folder copy or the live site      |
| Manufacturers (active)              | Values of the "marque" facet, with description and meta tags: brand pages             |
| Specific prices (current, everyone) | Sales: sale price, struck-through `regularPrice`, `saleEndsAt`; listed on /promotions |
| Date added, units sold              | `addedAt`, `unitsSold` on products: /nouveaux-produits, /meilleures-ventes            |
| Categories (active, level 2+)       | Collections with the same tree, listing the products assigned in PrestaShop           |
| Customers (registered, not deleted) | Customers with their PrestaShop password; addresses in Tunisia with the governorate   |
| CMS pages (active)                  | Payload pages with `legacyId`, HTML converted to rich text                            |
| Trafic & SEO (`meta`, `meta_lang`)  | Payload: homepage meta tags and the "Pages fixes (SEO)" global                        |
| Homepage (hook `displayHome`)       | Payload homepage: slider (`ps_imageslider`) and carousels (specials, featured, ...)   |

Passwords: PrestaShop 1.7+ bcrypt hashes (`$2y$`) are stored as `$2b$`, so customers sign in as before. PrestaShop 1.6
MD5 hashes cannot be converted; those customers, and accounts inactive in PrestaShop, are listed in
`out/password-reset.csv` and sign in after "Mot de passe oublié". Not migrated: order history, specific prices
for a customer group, a customer, a minimum quantity or a future date (counted or listed in the report), suppliers, carriers, customer groups, newsletter consent and meta keywords (ignored by search
engines). A fixed page whose friendly URL differs from `STATIC_PAGES` in `packages/seo` is reported in the import report.

Homepage: the modules PrestaShop shows on its homepage are rebuilt in order between the designed Kärcher
sections: the image slider (images from `modules/ps_imageslider/images`, next to `img/`), Promotions, "Coup de
cœur" (the featured products, a collection outside the menu), best sellers, new products. Other modules are
listed in the import report. `import:cms` writes the homepage only while it has no blocks
(`--replace-homepage` to rebuild it); staff then arrange the blocks in Payload. Uploaded images go to
`apps/storefront/media`, which needs persistent storage in production.

Sales after the migration: in the dashboard, on a variant, set the sale price as its price and the
previous price in "Prix barré" (Promotion tab), optionally with an end date. The variant joins /promotions, shows
its discount, and gets its regular price back at the end date (the `end-sales` scheduled task, every 15 minutes).

To try it without the real shop: `mysql prestashop < tools/migration/test/fixture.sql` (a small PrestaShop database
with combinations, two VAT rates, inactive entries and both kinds of password hashes) and
`PS_IMAGE_DIR=tools/migration/test/img/p`.

## Conventions

- TypeScript strict everywhere.
- Each Vendure plugin owns its entities, GraphQL extensions and services; plugins never import each other.
- URLs are built and parsed only in `packages/seo`.
- Shop API documents are written with `graphql(...)` from `@karcher/graphql`; their types come from `pnpm codegen`
  and the generated files in `packages/graphql/src/generated` are committed, so builds never need a running server.
  Types are matched to the exact text of each document: format a file before running `pnpm codegen`, not after.
- Prices are integers in millimes (TND has 3 decimals; see `TndMoneyStrategy`).

## Browser tests

`tools/e2e` drives the storefront in Chromium (Playwright): cart, guest checkout, Konnect success and
retry (against a local mock), the account lifecycle with its e-mails, quotes and warranty, filters and
search, sales, brand pages, and what the PrestaShop import must produce. They run against the running stack
loaded with the test fixture:

```bash
mysql prestashop < tools/migration/test/fixture.sql   # tools/migration/.env pointing at it
pnpm dev                                              # with KONNECT_API_URL=http://localhost:4010/api/v2
pnpm --filter @karcher/server setup:channel
pnpm --filter @karcher/migration import:shop
pnpm --filter @karcher/storefront import:cms
pnpm test:e2e
```

The Konnect mock starts with the tests; the setup gives the product they buy enough stock. Run them again
after the real import only on a copy: they place orders and create customers.

## Managing the catalog

The webmaster's guide, in French, is [docs/guide-webmaster.md](docs/guide-webmaster.md). Beyond Vendure's own
screens (products with rich descriptions, tables and images; facets; collections), `CatalogToolsPlugin` adds:

- **Catalog → Mise à jour CSV**: download the catalog, edit it in Excel, send it back; every row is checked and
  the changes previewed before they are applied (price, regular price, discount %, end of sale, stock, quote
  only, active, categories). Admin API: `catalogCsvExport`, `previewCatalogCsv`, `applyCatalogCsv`.
- A **Catégories** block on the product page (a tree of checkboxes over the hand-picked collections).
- **Filtres affichés** on each collection: which facets its page offers as filters.

Products and categories created in the dashboard get the next URL id from 10001 (`LegacyIdAssigner`), so they
have a URL at once and never take the URL of an old PrestaShop item.

## Professional range: price on quote only

Products with "Prix sur devis" ticked (custom field `quoteOnly`) never publish their price or stock: the
import ticks it for the PrestaShop "Professionnel" category tree (or the categories in
`PS_QUOTE_ONLY_CATEGORY_IDS`), and staff tick it in the dashboard for new products. The rule is enforced by
Vendure (`apps/server/src/plugins/quotes/quote-only.ts`), not only by the pages, since the Shop API is public:

- the Shop API and the search index give a price of 0 and a stock level of `ON_REQUEST`; only the dashboard
  sees the real price;
- the variants stop tracking inventory, so the search's in-stock filter reveals nothing;
- the product cannot be added to a cart; the storefront shows "Prix sur devis" and the quote request, with no
  JSON-LD offer, no sale, no stock filter or price sort on listings made only of such products.

## E-mails

Templates in French with the Kärcher look are in `apps/server/email-templates` (MJML and Handlebars;
`formatMoney` takes millimes). Customers get the order confirmation, account activation, password reset and
e-mail change; with `SALES_ALERT_EMAIL` set, the sales team gets paid orders, quote requests and form
messages, with reply-to set to the customer. In development they are written to the mailbox at
http://localhost:3000/mailbox; set an SMTP transport in `vendure-config.ts` before going live.

## Catalog cache

The storefront caches Shop API reads (`src/lib/vendure.ts`). When the catalog changes in Vendure (products,
prices, stock, categories, facets, images, VAT), `StorefrontCachePlugin` calls the storefront's
`/api/revalidate` (2 seconds after the last change, then again 30 seconds later for search and collection
updates), which expires every cached read. Both apps need the same `REVALIDATE_SECRET`; without it the cache
simply expires after 5 minutes.

## Not done yet

Still to do, per the migration plan: production deployment. Before going live:

- Run the import on the real database dump and review `out/import-report.txt`; `check:urls` must pass.
- Check `apps/server/src/plugins/konnect-payment/types.ts` against Konnect's API docs; the flow is tested only
  against a local mock of the same shapes.
- Set the real delivery prices (the `standard` shipping method is free until then).
- Set the same `REVALIDATE_SECRET` in both apps. With several storefront instances, give Next.js a shared
  cache handler so a refresh reaches all of them.
