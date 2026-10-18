# Public storefront

This is a separate, bilingual public website and Render web service. It does not serve the internal staff application or use its service-role key.

## Local development

From the repository root:

```sh
npm ci --include=dev
npm run dev:storefront
```

The storefront uses `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to read only the `public_catalog_*` views. Do not add `SUPABASE_SECRET_KEY` to this service. Apply the catalogue migrations to the existing Supabase project in order before catalogue reads will return active products:

- [`../supabase/migrations/20261017010000_public_storefront_catalog.sql`](../supabase/migrations/20261017010000_public_storefront_catalog.sql) creates restricted public views and revokes anonymous/authenticated access to the raw catalogue tables.
- [`../supabase/migrations/20261017030000_public_catalog_active_items.sql`](../supabase/migrations/20261017030000_public_catalog_active_items.sql) exposes active products, positive prices, and their associated collections/categories.
- [`../supabase/migrations/20261017040000_security_invoker_catalog_views.sql`](../supabase/migrations/20261017040000_security_invoker_catalog_views.sql) makes the views honor caller privileges/RLS and grants only the public catalogue columns needed by the views.
- [`../supabase/migrations/20261018010000_private_customer_reviews.sql`](../supabase/migrations/20261018010000_private_customer_reviews.sql) creates a private review-submissions table. Anonymous visitors can insert validated reviews but cannot read submitted reviews.
- [`../supabase/migrations/20261018020000_customer_problem_reports.sql`](../supabase/migrations/20261018020000_customer_problem_reports.sql) extends private submissions with problem reports, a required follow-up email, and an optional order reference.

The storefront follows the management catalogue's `active` status. Inactive products stay hidden; active products expose their names, descriptions, images, and positive prices publicly. Verify that active products and media are approved for public viewing before applying the active-items migration.

## Render preview service

The root [`../render.yaml`](../render.yaml) defines the existing staff service and a separate free-plan storefront preview. Set these variables in the storefront service's Render environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (publishable/anonymous key only)
- `OLLAMA_API_KEY` (Ollama Cloud key; server-side only)
- `PUBLIC_SITE_URL` (optional canonical public origin, such as `https://store.example.com`; otherwise the storefront uses the incoming request origin)

Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, and `BREVO_FROM_NAME` to enable gift enquiries and private customer feedback notifications. Enquiries, reviews, and problem reports are delivered to `BREVO_FROM_EMAIL` (use the Discovery Box commercial inbox); enquiry replies go to the customer's submitted email address, and problem-report notifications include the customer's email as reply-to. Feedback is stored in Supabase and emailed privately to the team; it is not displayed publicly. Apply both private feedback migrations before enabling submissions. Problem reports require a customer email and may include an order or enquiry reference. If database storage succeeds but the email provider is unavailable, the customer is told that the feedback was saved but the team could not be notified. Keep the API key server-side and verify the sender address in Brevo. Set `PUBLIC_CONTACT_EMAIL` and/or `PUBLIC_WHATSAPP_URL` on the deployed storefront service to show approved contact links on the Contact page. Email must be a valid address; WhatsApp must be a `https://wa.me/` or `https://api.whatsapp.com/` URL. Image generation is disabled by default; only after a provider budget and quota are approved, add `GEMINI_API_KEY` and set `AI_IMAGE_ENABLED=true`.

Outbound requests to Supabase, Ollama, Brevo, and Google Gemini log a start and outcome to the server terminal, including elapsed time and HTTP status where available. Logs do not include API keys, customer messages, or enquiry field values.

The floating Discovery Assistant sends chat messages to Ollama Cloud using the server-side `OLLAMA_API_KEY` environment variable and the `gemma4:31b-cloud` model. Never add this key to browser code or a `VITE_*` variable. The assistant instructions and editable business knowledge base are in [`assistant-knowledge.md`](./assistant-knowledge.md); public catalogue details are fetched server-side for each chat request. Assistant replies can link to internal pages and, after the customer explicitly agrees, prefill the gift-builder brief from details shared in the conversation. Contact fields and privacy consent are never populated from chat; the customer must review the form, enter their own name/email, consent, and submit it. Customer messages are sent to Ollama to generate replies, so review the privacy notice before launch. Chat is rate-limited per process and is intended for the current preview deployment.

Email enquiries and image generation return an explicit unavailable response until their provider credentials and addresses are configured. The gift brief is emailed to the configured destination. Customer contact details are not sent to Gemini; only gift preferences and selected public product names are sent when the customer requests an illustrative image. Generated images are not stored on the Render filesystem.

The app has small per-process rate limits. Render Free may sleep and restart, so it is suitable only as a preview; the in-memory rate limit is not a durable or distributed abuse-prevention control. Before production, confirm the current Render plan behavior, add durable abuse protection if needed, verify unauthenticated Supabase behavior against the live project, review the privacy/terms copy, and confirm the public contact details, catalogue entries and media rights.

The public FAQ, privacy, and terms pages are drafts based on the assistant knowledge base and customer FAQ; they are not company or legal approval. Before public launch, the company must review and approve them, confirm the data-retention period, privacy-request process and data-controller details, verify the order/refund/loyalty terms against current operations and applicable law, and confirm public contact information. Image generation needs a separately approved provider budget and request quota; do not add a live AI key until those limits are agreed.
