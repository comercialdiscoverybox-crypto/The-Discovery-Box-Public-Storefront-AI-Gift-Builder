# The Discovery Box — Public Storefront & Gift Builder

Bilingual customer-facing storefront for The Discovery Box, with a guided gift builder and optional illustrative AI images. This repository contains the public website only; the internal management application is maintained separately.

## Local development

Requirements: Node.js 20 or later.

```sh
npm ci
npm run dev:storefront
```

The website runs at `http://localhost:3000`. The server loads `.env` automatically for local development. Catalogue reads require `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; without them, the site reports that the public catalogue is unavailable instead of showing sample data. Copy `.env.example` to `.env` and fill in the Supabase project URL and its public publishable/anon key. Never put the secret/service-role key in this file.

## Existing Supabase project

Apply the migrations in order to the existing database:

1. [`supabase/migrations/20261017010000_public_storefront_catalog.sql`](./supabase/migrations/20261017010000_public_storefront_catalog.sql) creates restricted public catalogue views and revokes anonymous access to the raw catalogue tables.
2. [`supabase/migrations/20261017030000_public_catalog_active_items.sql`](./supabase/migrations/20261017030000_public_catalog_active_items.sql) makes active catalogue items, their positive prices, and their associated collections/categories visible through those views.
3. [`supabase/migrations/20261017040000_security_invoker_catalog_views.sql`](./supabase/migrations/20261017040000_security_invoker_catalog_views.sql) removes SECURITY DEFINER view access by making the views use caller privileges and granting narrowly scoped column access with active-only RLS policies.

The storefront follows the management catalogue's `active` status: inactive products are not returned; active products and their catalogue images/descriptions are public; positive prices are shown. Confirm that active items are intended for public viewing before applying the second migration.

Configure only the Supabase URL and publishable key on this service. **Never configure the management app's secret/service-role key here.**

## Render deployment

The [`render.yaml`](./render.yaml) blueprint defines a separate free-plan Node.js storefront service:

- Build: `npm ci --include=dev && npm run build:storefront`
- Start: `npm run start:storefront`
- Required environment: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`

Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, and `BREVO_FROM_NAME` to enable email enquiries. Enquiries are delivered as a responsive HTML email with a print stylesheet for A5 portrait; customer replies go to the email address submitted with the enquiry. Keep the API key server-side and verify the sender address in Brevo. To show contact links on the deployed Contact page, set `PUBLIC_CONTACT_EMAIL` and/or `PUBLIC_WHATSAPP_URL` on the storefront service after confirming which details are approved for public display. Image generation is disabled by default; enable it only after approving the provider budget and request quota, with `GEMINI_API_KEY` and `AI_IMAGE_ENABLED=true`.

The free Render plan is for preview. Review the draft privacy and terms pages, confirm product/media approvals, and verify live database permissions before launch.

## Validation

```sh
npm run lint
npm test
npm run test:browser
npm run build:storefront
```

The browser suite starts a local storefront server and tests route-specific catalogue loading, responsive overflow, form validation, dialog keyboard focus, and serious or critical axe accessibility violations. Install Chromium once with `npx playwright install chromium`.

The original product and deployment brief is retained in [`Instructions`](./Instructions).

