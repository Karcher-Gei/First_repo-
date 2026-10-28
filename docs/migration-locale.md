# Running the migration on your PC (Windows)

The real import runs on your machine: the PrestaShop dump is there (`karcher_ps` in your local MySQL), and your PC
can download the product images from karcher-gei.tn, which the cloud session cannot reach. Nothing here touches
the live shop: the import only reads the local copy of the database and downloads images like a browser does.

Commands are for PowerShell, from the repository folder. Expect about an hour the first time, mostly the
1 974 images.

## 1. Prerequisites (once)

- **Node.js 24.22.1 or later** (nodejs.org, "LTS" installer), then `corepack enable` in an administrator
  PowerShell. `node -v` must show it; an older Node earlier in the PATH (`where.exe node`) must be removed.
- **Docker Desktop**, for PostgreSQL (the new site's database). Without Docker: install PostgreSQL 17, create the
  user `karcher` (password `karcher`) and the databases `vendure` and `payload` owned by it.
- **Git**, and the repository on the `boot-and-migrations` branch:

```powershell
git clone https://github.com/Karcher-Gei/First_repo-.git karcher
cd karcher
git checkout boot-and-migrations
pnpm install
```

Already cloned: `git pull origin boot-and-migrations` then `pnpm install`.

## 2. Start the new site, empty (once)

```powershell
Copy-Item apps/server/.env.example apps/server/.env
Copy-Item apps/storefront/.env.example apps/storefront/.env
docker compose up -d postgres
pnpm --filter @karcher/server migrate
pnpm --filter @karcher/storefront migrate
pnpm dev
```

Leave `pnpm dev` running in that window. In a **second** PowerShell window:

```powershell
pnpm --filter @karcher/server setup:channel
```

Check: http://localhost:3000/dashboard opens (login `superadmin` / `change-me`, from `apps/server/.env`) and
http://localhost:3001 shows the empty shop.

### "authentification par mot de passe échouée pour l'utilisateur « karcher »"

A message in French comes from a PostgreSQL installed on Windows, not from Docker's: it answers on port 5432
and has no `karcher` user. Either stop it (Services → postgresql → Stop) and run `docker compose up -d postgres`,
or use it: create the user and the two databases with the `postgres` password chosen at its installation.

```powershell
$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Select-Object -Last 1).FullName
& $psql -U postgres -c "CREATE ROLE karcher LOGIN PASSWORD 'karcher';"
& $psql -U postgres -c "CREATE DATABASE vendure OWNER karcher;"
& $psql -U postgres -c "CREATE DATABASE payload OWNER karcher;"
```

"already exists" on the first line: `& $psql -U postgres -c "ALTER ROLE karcher PASSWORD 'karcher';"` instead.

## 3. Point the import at your dump

```powershell
Copy-Item tools/migration/.env.example tools/migration/.env
notepad tools/migration/.env
```

Change only these lines (your MySQL user and password):

```ini
PS_DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/karcher_ps
PS_IMAGE_DIR=
PS_IMAGE_BASE_URL=https://karcher-gei.tn/img/p
VENDURE_ADMIN_PASSWORD=change-me
```

A password with `@`, `:` or `/` must be written encoded (`@` → `%40`). Leave both `PS_QUOTE_ONLY_...` lines
empty: the whole "Professional" range, accessories (41) included, is sold on quote.

Before going further, open https://karcher-gei.tn/img/p/2/0/5/8/2058.jpg in your browser: it must show the
image. If it does not, ask the host for a zip of the `img` folder, unzip it, and set
`PS_IMAGE_DIR=C:/path/to/img/p` instead (and empty `PS_IMAGE_BASE_URL`).

## 4. Trial run: 20 products

```powershell
pnpm --filter @karcher/migration import:shop --only=catalog --limit=20
```

Then check:

- the end of the output: "images uploaded" around 60, few warnings;
- http://localhost:3001: the menu (HOME & GARDEN, Professional...), a category, a product with its photos;
- a Professional product shows "Prix sur devis", no price.

Every step can run again: nothing is created twice.

## 5. Full import

```powershell
pnpm --filter @karcher/migration import:shop
pnpm --filter @karcher/storefront import:cms
```

The first command prints `images: 100 / 1974`... while it works. It writes in `tools/migration/out/`:

| File                  | What to do with it                                                                     |
| --------------------- | -------------------------------------------------------------------------------------- |
| `import-report.txt`   | Read the warnings: missing images, homepage modules to rebuild, sales that start later |
| `password-reset.csv`  | The 71 customers with old passwords: they will use "Mot de passe oublié"               |
| `cms-pages.json` etc. | Read by `import:cms`; nothing to do                                                    |

**`out/` contains customer data: never commit it, e-mail it or upload it.** It is ignored by Git.

## 6. Check every old URL

```powershell
pnpm --filter @karcher/migration inventory
pnpm --filter @karcher/migration check:urls
```

The last line must say "All … URLs served as expected". Any line above it is an old Google URL that would
break: send it to me with the import report.

## 7. What to send back

- `tools/migration/out/import-report.txt` (no personal data in it);
- the output of `check:urls`;
- screenshots of anything that looks wrong on http://localhost:3001.

Do not send `password-reset.csv` or the dump.

## Starting again from zero

```powershell
docker compose down -v      # deletes the new site's databases (not your MySQL dump)
Remove-Item -Recurse apps/server/static/assets, apps/storefront/media -ErrorAction SilentlyContinue
```

Then go back to step 2.
