import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';
for (const key of [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'ENQUIRY_FROM_EMAIL',
  'ENQUIRY_TO_EMAIL',
]) {
  delete process.env[key];
}

const { app } = await import('../storefront/server.ts');
const server = createServer(app);
let baseUrl = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('storefront health endpoint is public and omits Express identification', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('catalogue API fails explicitly when public Supabase settings are absent', async () => {
  const response = await fetch(`${baseUrl}/api/catalog`);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test('enquiry API rejects unconsented or malformed input before provider calls', async () => {
  const response = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Visitor',
      email: 'visitor@example.com',
      language: 'en',
      occasion: 'Birthday',
      recipient: 'Friend',
      budget: 'not-a-number',
      consent: false,
    }),
  });
  assert.equal(response.status, 400);
});

test('valid enquiry reports missing email configuration without claiming success', async () => {
  const response = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Visitor',
      email: 'visitor@example.com',
      language: 'en',
      occasion: 'Birthday',
      recipient: 'Friend',
      budget: '1500',
      preferences: 'Bright colours',
      products: [],
      consent: true,
    }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test('image generation reports provider configuration failures explicitly', async () => {
  const response = await fetch(`${baseUrl}/api/gift-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'en',
      occasion: 'Birthday',
      recipient: 'Friend',
      budget: '1500',
      preferences: 'Bright colours',
      products: [],
    }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test('catalogue migration limits public reads and hides unapproved prices', () => {
  const migration = readFileSync(path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20261017010000_public_storefront_catalog.sql',
  ), 'utf8');
  assert.match(migration, /WHERE active = TRUE\s+AND publicly_visible = TRUE/);
  assert.match(migration, /CASE WHEN publicly_visible AND active AND price_public AND price_mzn > 0 THEN price_mzn ELSE NULL END/);
  assert.match(migration, /REVOKE ALL ON TABLE[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT SELECT ON TABLE[\s\S]*public_catalog_items[\s\S]*TO anon, authenticated/);
});
