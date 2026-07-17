# Fashion Showcase — CMS Admin

A Next.js (App Router) admin module that runs **parallel to the Node showcase server**
and the Flutter apps. It writes into the **same SQLite catalog** the server owns, so
products added here show up live in the showroom.

## What it does

- **Dashboard** — revenue/orders/products/salespeople/customers KPIs plus MUI X Charts
  (orders & revenue trend, orders-by-status, revenue-by-category, top products).
- **Products** — list the catalog, and an **Add / Enrich** form that:
  1. uploads the product image to **Cloudflare R2** (`/api/upload`),
  2. **analyzes it with Claude vision** (`/api/enrich`) to auto-fill every field
     (name, description, price, category, plus the recommendation attributes:
     style archetype, occasion, season, fit, pattern, material, colour, age group),
  3. saves the product + media + enrichment + variants to SQLite (`/api/products`).
- **Salespeople** — a searchable/sortable **DataGrid** of every associate with order,
  customer, item and revenue totals; click a row for a **detail page** with weekly &
  monthly insight charts and recent orders.

The recommendation attributes on each product line up with the onboarding profile the
controller app captures (gender · personality→styleArchetype · ageRange→ageGroup), so a
recommendation API can match products to a customer.

## Architecture

```
cms/
  src/lib/        config · db (shared better-sqlite3) · r2 (S3 upload) · ai (Claude vision)
                  attributes (controlled vocab) · products · analytics · salespeople
  src/app/api/    upload · enrich · products · analytics · salespeople[/:id]   (route handlers)
  src/app/        dashboard · products[/new] · salespeople[/:id]               (pages)
  src/components/ NavShell · DashboardCharts · SalespeopleGrid · SalespersonDetailView
```

All API routes and DB access run on the Node.js runtime (`export const runtime = 'nodejs'`),
since `better-sqlite3` is a native module (declared in `serverExternalPackages`).

## Setup

```bash
cd cms
cp .env.example .env.local     # fill in R2 + ANTHROPIC_API_KEY
npm install
npm run dev                    # http://localhost:4000
```

`.env.local` keys:

| Var | Purpose |
|-----|---------|
| `DB_PATH` | Path to the shared SQLite file (default `../server/data/showcase.sqlite`) |
| `R2_BUCKET_NAME` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_ENDPOINT` `R2_PUBLIC_URL` | Cloudflare R2 media storage |
| `ANTHROPIC_API_KEY` | AI enrichment (Claude vision) |
| `AI_MODEL` | optional, defaults to `claude-opus-4-8` |

Run the showcase server at least once first (`cd ../server && npm start`) so the DB and its
tables exist; the CMS also creates/migrates the product columns it needs on first open.

## Notes

- Media is stored in R2 and referenced by its public URL. Those absolute URLs render directly
  in the Flutter display/controller apps (their `NetworkPhoto` passes `http(s)` URLs through).
- If R2 or the AI key aren't configured, the upload/enrich endpoints return `503` and the rest
  of the CMS still works (you can fill the form manually).
