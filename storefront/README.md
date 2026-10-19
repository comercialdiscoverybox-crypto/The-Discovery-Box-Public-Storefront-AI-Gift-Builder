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
- [`../supabase/migrations/20261019010000_website_analytics_events.sql`](../supabase/migrations/20261019010000_website_analytics_events.sql) creates a private, insert-only table for first-party page-view and engagement events. Apply this migration to Supabase before deploying the instrumented storefront.

Website analytics use a random identifier stored in the current browser tab's session storage and record page paths without query strings or fragments, the referring origin, and event-specific details constrained to an allowlist. A session represents a browser tab, not a verified unique person, and does not connect activity across devices. Analytics do not store search text, chat messages, form contents, contact details, or visitor IP addresses in the analytics table. The events support analysis of visits and interactions outside the website; choose and approve a retention period before public launch. Public roles can submit but cannot read analytics rows.

The storefront follows the management catalogue's `active` status. Inactive products stay hidden; active products expose their names, descriptions, images, and positive prices publicly. Verify that active products and media are approved for public viewing before applying the active-items migration.

## Render preview service

The root [`../render.yaml`](../render.yaml) defines the existing staff service and a separate free-plan storefront preview. Set these variables in the storefront service's Render environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (publishable/anonymous key only)
- `OLLAMA_API_KEY` (Ollama Cloud key; server-side only)
- `PUBLIC_SITE_URL` (optional canonical public origin, such as `https://store.example.com`; otherwise the storefront uses the incoming request origin)

Add `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, and `BREVO_FROM_NAME` to enable gift enquiries and private customer feedback notifications. Enquiries, reviews, and problem reports are delivered to `BREVO_FROM_EMAIL` (use the Discovery Box commercial inbox); enquiry replies go to the customer's submitted email address, and problem-report notifications include the customer's email as reply-to. Gift enquiry emails include selected product thumbnails, catalogue IDs and current prices, and a link to download a self-contained SVG image of the enquiry. That link contains authenticated encrypted data, expires after 30 days, and is invalidated if the Brevo API key changes. The separate product enquiry form lets customers choose up to 10 products, set quantities, and add an optional note; its responsive HTML notification includes contact details and the selected public catalogue images, with replies directed to the customer. Feedback is stored in Supabase and emailed privately to the team; it is not displayed publicly. Apply both private feedback migrations before enabling submissions. Problem reports require a customer email and may include an order or enquiry reference. If database storage succeeds but the email provider is unavailable, the customer is told that the feedback was saved but the team could not be notified. Keep the API key server-side and verify the sender address in Brevo. Set `PUBLIC_CONTACT_EMAIL` and/or `PUBLIC_WHATSAPP_URL` on the deployed storefront service to show approved contact links on the Contact page. Email must be a valid address; WhatsApp must be a `https://wa.me/` or `https://api.whatsapp.com/` URL.

The gift builder lets customers choose email, phone, or WhatsApp as their preferred contact method; a phone number is required for phone or WhatsApp. Delivery address fields are optional. The optional map uses OpenStreetMap tiles and the public Nominatim reverse-geocoding service after the customer opts in, places a pin, and confirms the suggested address. The email consolidates entered address details and pin coordinates under one full-address field; internal map feature metadata is not included. Map requests disclose the visitor's IP/network metadata to OpenStreetMap services, and reverse-geocoding requests disclose the selected coordinates. Review the OpenStreetMap tile and Nominatim usage policies and service availability before production or higher-volume use; these public services do not provide a storefront-specific service-level guarantee.

Outbound requests to Supabase, Ollama, Brevo, and Google Gemini log a start and outcome to the server terminal, including elapsed time and HTTP status where available. Logs do not include API keys, customer messages, or enquiry field values.

The floating Discovery Assistant sends chat messages to Ollama Cloud using the server-side `OLLAMA_API_KEY` environment variable and the `gemma4:31b-cloud` model. Never add this key to browser code or a `VITE_*` variable. The assistant instructions and editable business knowledge base are in [`assistant-knowledge.md`](./assistant-knowledge.md); public catalogue details are fetched server-side for each chat request. Assistant replies can link to internal pages and, after the customer explicitly agrees, prefill the gift-builder brief from details shared in the conversation. Contact fields and privacy consent are never populated from chat; the customer must review the form, enter their own name/email, consent, and submit it. Customer messages are sent to Ollama to generate replies, so review the privacy notice before launch. Chat is rate-limited per process and is intended for the current preview deployment.

Email enquiries return an explicit unavailable response until their provider credentials and sender address are configured. The gift brief is emailed to the configured destination.

The app has small per-process rate limits. Render Free may sleep and restart, so it is suitable only as a preview; the in-memory rate limit is not a durable or distributed abuse-prevention control. Before production, confirm the current Render plan behavior, add durable abuse protection if needed, verify unauthenticated Supabase behavior against the live project, review the privacy/terms copy, and confirm the public contact details, catalogue entries and media rights.

The public FAQ, privacy, and terms pages are drafts based on the assistant knowledge base and customer FAQ; they are not company or legal approval. Before public launch, the company must review and approve them, confirm the data-retention period, privacy-request process and data-controller details, verify the order/refund/loyalty terms against current operations and applicable law, and confirm public contact information. Image generation needs a separately approved provider budget and request quota; do not add a live AI key until those limits are agreed.
