# Public storefront

This is a separate, bilingual public website and Render web service. It does not serve the internal staff application or use its service-role key.

## Local development

From the repository root:

```sh
npm ci --include=dev
npm run dev:storefront
```

The storefront uses `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to read only the `public_catalog_*` views. Do not add `SUPABASE_SECRET_KEY` to this service. Apply these migrations to the existing Supabase project in order before catalogue reads will return active products:

- [`../supabase/migrations/20261017010000_public_storefront_catalog.sql`](../supabase/migrations/20261017010000_public_storefront_catalog.sql) creates restricted public views and revokes anonymous/authenticated access to the raw catalogue tables.
- [`../supabase/migrations/20261017030000_public_catalog_active_items.sql`](../supabase/migrations/20261017030000_public_catalog_active_items.sql) exposes active products, positive prices, and their associated collections/categories.
- [`../supabase/migrations/20261017040000_security_invoker_catalog_views.sql`](../supabase/migrations/20261017040000_security_invoker_catalog_views.sql) makes the views honor caller privileges/RLS and grants only the public catalogue columns needed by the views.

The storefront follows the management catalogue's `active` status. Inactive products stay hidden; active products expose their names, descriptions, images, and positive prices publicly. Verify that active products and media are approved for public viewing before applying the active-items migration.

## Render preview service

The root [`../render.yaml`](../render.yaml) defines the existing staff service and a separate free-plan storefront preview. Set these variables in the storefront service's Render environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (publishable/anonymous key only)

Add `RESEND_API_KEY`, `ENQUIRY_FROM_EMAIL`, and `ENQUIRY_TO_EMAIL` to enable email-only enquiries. Add `PUBLIC_CONTACT_EMAIL` and `PUBLIC_WHATSAPP_URL` only after confirming the public contact details. Image generation is disabled by default; only after a provider budget and quota are approved, add `GEMINI_API_KEY` and set `AI_IMAGE_ENABLED=true`.

Email enquiries and image generation return an explicit unavailable response until their provider credentials and addresses are configured. The gift brief is emailed to the configured destination. Customer contact details are not sent to Gemini; only gift preferences and selected public product names are sent when the customer requests an illustrative image. Generated images are not stored on the Render filesystem.

The app has small per-process rate limits. Render Free may sleep and restart, so it is suitable only as a preview; the in-memory rate limit is not a durable or distributed abuse-prevention control. Before production, confirm the current Render plan behavior, add durable abuse protection if needed, verify unauthenticated Supabase behavior against the live project, review the privacy/terms copy, and confirm the public contact details, catalogue entries and media rights.

The website includes draft privacy and terms copy that must be reviewed and approved by the company before public launch. Image generation needs a separately approved provider budget and request quota; do not add a live AI key until those limits are agreed.
