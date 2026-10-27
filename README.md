# karcher-gei.tn

The rebuild of [karcher-gei.tn](https://karcher-gei.tn) off PrestaShop: a **Next.js** storefront with **Payload CMS**
inside it, on a **Vendure** (NestJS) commerce backend. Every public URL keeps its exact PrestaShop path, so the
switch looks to Google like a hosting change, not a site move.

```text
apps/
  storefront/        Next.js 16 (App Router) + Payload 3 admin at /admin-cms      :3001
    src/proxy.ts       legacy URL rewrites (/home-garden/867-x.html -> /p/867) + 301s to canonical
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
pnpm dev
```

- Storefront: http://localhost:3001 · CMS admin: http://localhost:3001/admin-cms (creates the first user)
- Vendure dashboard: http://localhost:3000/dashboard (superadmin credentials from `apps/server/.env`)
- Dev mailbox (emails Vendure would send): http://localhost:3000/mailbox

`DB_SYNCHRONIZE=true` lets Vendure create its tables on a fresh local database. Before any shared environment,
switch it off and use migrations: `cd apps/server && npx vendure migrate`.

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the storefront, Vendure server, worker and dashboard |
| `pnpm typecheck` | TypeScript across every package |
| `pnpm test` | Unit tests (legacy URL parsing in `packages/seo`) |
| `pnpm codegen` | Regenerates Shop API types (Vendure server must be running) |
| `pnpm --filter @karcher/storefront generate:types` | Regenerates `payload-types.ts` after a CMS schema change |
| `pnpm --filter @karcher/migration inventory` | Lists every PrestaShop URL from a database copy, for the Gate A check |

## How legacy URLs work

| Old URL | Internal route | Found by |
| --- | --- | --- |
| `/home-garden/867-aspirateur-laveur-fcv-3.html` | `/p/867` | Vendure product `customFields.legacyId` |
| `/12-home-garden` | `/c/12` | Vendure collection `customFields.legacyId` |
| `/content/62-devenir-revendeur` | real route | Payload page `legacyId` |
| `/2292-home_default/aspirateur-laveur-fcv-3.jpg` | `/img/2292/home_default` | Vendure asset `customFields.legacyImageId`, 301 to the asset |
| `/promotions`, `/nous-contacter`, ... | `/s/{page}` | fixed list in `packages/seo` |
| anything else | catch-all | `legacyRedirect` table in Vendure (dashboard), else 404 |

A request whose slug or category differs from the canonical one gets a 301 to the canonical URL, as PrestaShop
does today. Products created after the migration need a `legacyId` (SEO tab in the dashboard) to get a URL.

## Conventions

- TypeScript strict everywhere.
- Each Vendure plugin owns its entities, GraphQL extensions and services; plugins never import each other.
- URLs are built and parsed only in `packages/seo`.
- Prices are integers in millimes (TND has 3 decimals; see `TndMoneyStrategy`).

## Not done yet

The scaffold covers the structure, the URL layer and the plugin APIs. Still to build, per the migration plan:
cart and checkout pages, the Konnect checkout flow in the storefront (the server side is ready), quote and warranty
forms, account pages, facet filters, email templates in French, the PrestaShop -> Vendure import script, and
production deployment. Check `apps/server/src/plugins/konnect-payment/types.ts` against Konnect's API docs before
going live.
