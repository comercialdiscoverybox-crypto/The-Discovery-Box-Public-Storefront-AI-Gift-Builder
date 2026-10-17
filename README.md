# The Discovery Box — Public Storefront & Gift Builder

Bilingual customer-facing storefront for The Discovery Box, with a guided gift builder and optional illustrative AI images. This repository contains the public website only; the internal management application is maintained separately.

## Local development

Requirements: Node.js 20 or later.

```sh
npm ci
npm run dev:storefront
```

The website runs at `http://localhost:3000`. Catalogue reads require `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; without them, the site reports that the public catalogue is unavailable instead of showing sample data. Copy `.env.example` to `.env` for local configuration.

## Existing Supabase project

Apply [`supabase/migrations/20261017010000_public_storefront_catalog.sql`](./supabase/migrations/20261017010000_public_storefront_catalog.sql) to the existing database before enabling catalogue reads. It adds explicit product visibility and price approval fields and exposes only filtered public views. New flags default to false, so an Admin must approve each product and any price in the management application before they appear publicly.

Configure only the Supabase URL and publishable key on this service. **Never configure the management app's secret/service-role key here.**

## Render deployment

The [`render.yaml`](./render.yaml) blueprint defines a separate free-plan Node.js storefront service:

- Build: `npm ci && npm run build:storefront`
- Start: `npm run start:storefront`
- Required environment: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`

Add `RESEND_API_KEY`, `ENQUIRY_FROM_EMAIL`, and `ENQUIRY_TO_EMAIL` to enable email enquiries. Add public contact variables only after confirming the business contact details. Image generation is disabled by default; enable it only after approving the provider budget and request quota, with `GEMINI_API_KEY` and `AI_IMAGE_ENABLED=true`.

The free Render plan is for preview. Review the draft privacy and terms pages, confirm product/media approvals, and verify live database permissions before launch.

## Validation

```sh
npm run lint
npm test
npm run build:storefront
```

The original product and deployment brief is retained in [`Instructions`](./Instructions).
