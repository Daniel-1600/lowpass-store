# Lowpass

A small online electronics store built with Nuxt 3, Tailwind CSS, a Python API (FastAPI) and SQLite. Lowpass and its products are fictional, and checkout is a mock.

**Live site:** https://lowpass-store.vercel.app

## Run it

Requires Node 22.13 or newer and [uv](https://docs.astral.sh/uv/), which installs Python and the backend's dependencies.

```bash
make install
make dev                   # http://localhost:3000
```

`make dev` starts the Python backend on port 8000 and Nuxt on port 3000. To run a production build and check its SEO:

```bash
make build
make test-seo
```

Set `NUXT_PUBLIC_SITE_URL` when building for a custom domain. It is used for canonical URLs, Open Graph tags, structured data and the sitemap. On Vercel it falls back to the project's production URL. If you change the URL between local builds, run `rm -rf .nuxt node_modules/.cache` first, because stale build state can leave the old domain in prerendered pages.

| Command | What it does |
| --- | --- |
| `make install` | Install frontend and backend dependencies |
| `make dev` | Start the backend and the Nuxt dev server |
| `make build` | Create a production build and prerender public pages |
| `make preview` | Run the production build locally |
| `make lint` | Lint with ESLint and Ruff |
| `make format` | Format with Prettier and Ruff |
| `make format-check` | Fail if any code isn't formatted |
| `make typecheck` | Type-check the frontend |
| `make test-seo` | Check every sitemap URL on the production build |
| `make check` | Run everything CI runs |
| `make images` | Regenerate product artwork (the output is committed) |
| `make deploy` | Deploy a preview to Vercel |
| `make deploy-prod` | Deploy to production on Vercel |

## Deploying

`vercel.json` is the deployment manifest. It defines the Nuxt frontend and Python backend as two services in one Vercel project, so they always deploy and roll back together. Run `make deploy` for a preview or `make deploy-prod` for production. Pushing to a connected Git repository also deploys. Vercel Services is in beta.

## Checks

`.github/workflows/ci.yml` runs on every push and on pull requests from forks. It runs lint, format and type checks, then builds the site and runs the SEO check. `make check` runs the same steps locally.

## How it's built

| Area | Where | Notes |
| --- | --- | --- |
| Pages | `pages/` | `/`, `/products`, `/category/[slug]`, `/products/[slug]`, `/cart`, `/checkout` |
| API | `backend/main.py` | Products, categories, cart quote, mock checkout, sitemap and robots.txt |
| API proxy | `server/` | Forwards API requests from Nuxt to the backend |
| Database | `backend/db.py`, `backend/seed.py` | The schema, seed data and every SQL query |
| SEO | `composables/usePageSeo.ts`, `backend/main.py` | Page metadata, JSON-LD, sitemap and robots.txt |
| Cart | `composables/useCart.ts`, `backend/quote.py` | Client cart state and server-side pricing |

## Key decisions

**A separate Python backend.** The API is a FastAPI app in `backend/`. Nuxt forwards `/api/*` to it, so the frontend has one origin and the backend stays private on Vercel. Prerendering fetches the catalogue from the API, so `make build` starts the backend for the length of the build (`scripts/with-backend.mjs`). The trade-off is a second language and runtime, plus types that are no longer inferred across the API: `types/store.ts` has to be kept in step with the backend by hand.

**Prerendered pages, with a live API for the cart.** The catalogue only changes on deploy, so public pages are generated as static HTML at build time. That gives crawlers complete HTML and gives shoppers a fast first response. Cart and checkout call the API at request time. If prices or stock start changing outside of deploys, the prerender rules in `nuxt.config.ts` can become ISR rules with no page changes.

**SQLite in memory, seeded on startup.** Each server instance builds its database from `backend/seed.py` when it starts. There's no account to create or service to run, so the project works straight after `make install`, and the catalogue is still served by real SQL queries with parameters. The catch is that nothing written at runtime would survive, which is fine for a read-only catalogue and a mock checkout but not for real orders. All SQL lives in `db.py`, so moving to Postgres or Supabase means changing that one file.

**The server owns the money.** The browser stores only product slugs and quantities. Each cart view asks the server to price the items, which caps quantities to stock and drops anything sold out or missing, then tells the shopper their cart changed. Checkout prices the order again, so a tampered request can't change what's charged. Prices are stored as integer cents to avoid rounding errors.

**One function for page metadata.** Each page calls `usePageSeo`, which sets the title, description, canonical URL, Open Graph and Twitter tags, and JSON-LD together, so a new page can't forget one of them. `make test-seo` then reads the raw HTML as a crawler would and fails on duplicate titles or descriptions, wrong canonicals, missing tags, or incomplete Product schema. It also checks that unknown URLs return a real 404.

**SEO choices.**
- URLs are readable paths, and each category has its own indexable page rather than a `?category=` filter.
- Product pages include `Product`, `Offer` and `BreadcrumbList` schema. There's no `aggregateRating`, because the store has no real reviews and made-up ratings break Google's guidelines.
- Cart and checkout are `noindex` but not blocked in `robots.txt`, because a crawler can only obey a `noindex` tag on a page it's allowed to fetch.

**Images.** `@nuxt/image` serves AVIF and WebP at sizes matched to each layout, through Vercel's image optimiser in production and `ipx` elsewhere. Width and height are always set to prevent layout shift. The main image on a page is preloaded with high priority, and images further down load lazily. Fonts are self-hosted by `@nuxt/fonts`, with fallback metrics to reduce layout shift.

**Original artwork.** The product images are generated from SVG by `scripts/generate-images.mjs`, along with a 1200×630 Open Graph card for each product. This avoids licensing questions and keeps the catalogue visually consistent, though it does mean they're illustrations rather than photographs.

**No state library.** The cart is one small composable using `useState` and `localStorage`, so Pinia would add a dependency without solving a problem here.

## What I'd improve with more time

- **Persistent database:** move to Postgres or Supabase, with an admin screen and ISR so catalogue edits go live without a deploy.
- **Real checkout:** use Stripe Checkout, save orders, reserve stock and send confirmation emails.
- **Automated tests:** add Playwright tests for the buying flow and unit tests for `build_quote`, then run them in CI alongside the SEO check.
- **Performance budgets:** run Lighthouse CI on every deploy so regressions in Core Web Vitals are caught early.
- **Richer product pages:** add real photography, multiple gallery images, genuine reviews with `aggregateRating`, and shipping and returns schema.
- **Shopping features:** add search, shareable sort and filter URLs, and pagination as the catalogue grows.
