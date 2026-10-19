# Security Review

**Date:** 2026-10-19  
**Scope:** Source-level security review of the public storefront, API, data access policies, and integrations.

## Finding

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | [supabase/migrations/20261017040000_security_invoker_catalog_views.sql](./supabase/migrations/20261017040000_security_invoker_catalog_views.sql) | 10-30, 57-95 | The migration grants `anon` and `authenticated` roles direct reads of catalogue tables and creates row-level policies, but does not enable RLS on those tables. If RLS is disabled on a catalogue table in the deployed database, those policies do not apply and anonymous clients may query the table directly, potentially exposing records beyond the intended public catalogue views. | 8/10 |

This finding is conditional on the live database's RLS state. The repository does not establish whether RLS is already enabled in the deployed Supabase project.

### Recommended remediation

Enable RLS explicitly on `public.catalog_items`, `public.catalog_collections`, and `public.categories` in the migration, while preserving policies that allow only the intended public catalogue records. Verify that anonymous callers cannot read the underlying tables beyond those policies and that the public views continue to return only intended catalogue data. Check the live project's RLS state before deployment; this review did not connect to or change Supabase.

## Other reviewed controls

- Public API handlers validate and bound submitted fields and request size. Rate limits are present but are process-local; deployments with multiple instances should use a shared rate-limit store if a durable cross-instance limit is required.
- Product enquiry IDs are resolved against public catalogue data before email generation. Submitted values are escaped in HTML email, and product links use the configured site origin.
- Customer review, problem-report, and analytics migrations enable RLS and restrict public access to insert-only operations. Whether those migrations and grants match the live project was not verifiable here.
- Assistant output is rendered as text rather than raw HTML, and generated internal links are restricted. Recommendation product IDs are checked against catalogue data.
- The server sets defensive response headers and does not enable public CORS.
- A submitted email address is not proof of identity or address ownership. Staff should treat enquiry contents and contact addresses as unverified until confirmed.

## Limitations

This was a repository source review, not a live-system penetration test. It did not verify the production database's RLS state, applied migrations, hosting/proxy topology, HTTPS behavior, production environment variables, or provider settings. No other reportable source-level finding was identified in the reviewed areas.
