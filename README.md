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
tools/migration/     reads a copy of the PrestaShop database (URL inventory today, import next)
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
pnpm dev
# once, in a second terminal while the server runs: TND, French, Tunisia zone, TVA 19%, shipping, payment methods
pnpm --filter @karcher/server setup:channel
```

- Storefront: http://localhost:3001 · CMS admin: http://localhost:3001/admin-cms (creates the first user)
- Vendure dashboard: http://localhost:3000/dashboard (superadmin credentials from `apps/server/.env`)
- Dev mailbox (emails Vendure would send): http://localhost:3000/mailbox

The database schema comes from migrations in `apps/server/src/migrations`. After changing an entity or a custom
field, run `pnpm --filter @karcher/server migration:generate <name>`, review the file, then `migrate`.
`setup:channel` sets the shipping rate to 0; set the real delivery prices in the dashboard.

## Everyday commands

| Command                                            | What it does                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                         | Runs the storefront, Vendure server, worker and dashboard             |
| `pnpm typecheck`                                   | TypeScript across every package                                       |
| `pnpm test`                                        | Unit tests (legacy URL parsing in `packages/seo`)                     |
| `pnpm codegen`                                     | Regenerates Shop API types (Vendure server must be running)           |
| `pnpm --filter @karcher/storefront generate:types` | Regenerates `payload-types.ts` after a CMS schema change              |
| `pnpm --filter @karcher/migration inventory`       | Lists every PrestaShop URL from a database copy, for the Gate A check |

## How legacy URLs work

| Old URL                                          | Internal route           | Found by                                                     |
| ------------------------------------------------ | ------------------------ | ------------------------------------------------------------ |
| `/home-garden/867-aspirateur-laveur-fcv-3.html`  | `/p/867`                 | Vendure product `customFields.legacyId`                      |
| `/12-home-garden`                                | `/c/12`                  | Vendure collection `customFields.legacyId`                   |
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

The shopper's Vendure session token lives in the httpOnly `kgei_session` cookie (`src/lib/session.ts`); every cart,
checkout and account change is a Server Action. Category pages filter with `?q=` (facet value ids), sort with
`?order=` and page with `?page=`, PrestaShop's parameter names, which `robots.txt` already handles.

In dev the checkout also offers Vendure's test payment method, which settles at once. To try the Konnect flow
without Konnect, point `KONNECT_API_URL` in `apps/server/.env` at a mock of its API.

## Conventions

- TypeScript strict everywhere.
- Each Vendure plugin owns its entities, GraphQL extensions and services; plugins never import each other.
- URLs are built and parsed only in `packages/seo`.
- Shop API documents are written with `graphql(...)` from `@karcher/graphql`; their types come from `pnpm codegen`
  and the generated files in `packages/graphql/src/generated` are committed, so builds never need a running server.
  Types are matched to the exact text of each document: format a file before running `pnpm codegen`, not after.
- Prices are integers in millimes (TND has 3 decimals; see `TndMoneyStrategy`).

## Not done yet

Still to build, per the migration plan: e-mail templates in French, the PrestaShop -> Vendure import script, and
production deployment. Before going live:

- Check `apps/server/src/plugins/konnect-payment/types.ts` against Konnect's API docs; the flow is tested only
  against a local mock of the same shapes.
- Set the real delivery prices (the `standard` shipping method is free until then).
- Clear the storefront's cached catalog data when products change in Vendure; today a change shows up within
  5 minutes (`revalidate` in `src/lib/vendure.ts`).
