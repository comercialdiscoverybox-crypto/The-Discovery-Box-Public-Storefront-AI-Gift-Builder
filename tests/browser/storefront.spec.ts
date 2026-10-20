import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const items = [
  {
    id: 'GIFT-001',
    family: 'PLAY',
    collection: 'PLAYFUL FINDS',
    category: 'Toys & Creative Figures',
    name_en: 'Creative Puzzle',
    name_pt: 'Puzzle Criativo',
    description_en: 'A colourful puzzle for curious minds.',
    description_pt: 'Um puzzle colorido para mentes curiosas.',
    price_mzn: 1200,
    images: [],
    image_crops: [],
    primary_image_index: 0,
  },
  {
    id: 'GIFT-002',
    family: 'HOME',
    collection: 'HOME FINDS',
    category: 'Creative & Functional Objects',
    name_en: 'Keepsake Vase',
    name_pt: 'Vaso de Recordações',
    description_en: 'A small vase made for thoughtful gifts.',
    description_pt: 'Um pequeno vaso para presentes especiais.',
    price_mzn: 1800,
    images: [],
    image_crops: [],
    primary_image_index: 0,
  },
];

const collections = [
  {
    id: 'playful-finds',
    family: 'PLAY',
    name_en: 'PLAYFUL FINDS',
    name_pt: 'DESCOBERTAS DIVERTIDAS',
    tagline_en: 'Ideas for play.',
    tagline_pt: 'Ideias para brincar.',
    image_url: '',
    image_crop: null,
  },
  {
    id: 'home-finds',
    family: 'HOME',
    name_en: 'HOME FINDS',
    name_pt: 'DESCOBERTAS PARA CASA',
    tagline_en: 'Thoughtful objects.',
    tagline_pt: 'Objetos especiais.',
    image_url: '',
    image_crop: null,
  },
];

async function installApiFixtures(page: Page) {
  await page.route('**/api/catalog**', async (route) => {
    const view = new URL(route.request().url()).searchParams.get('view');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: view === 'collections' ? [] : items,
        collections,
        total: items.length,
        page: 1,
        pageSize: 6,
        familyCounts: { PLAY: 1, HOME: 1, BUSINESS: 0 },
      }),
    });
  });
  await page.route('**/api/public-config', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ email: '', whatsapp: '' }),
  }));
  await page.route('**/api/analytics/events', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/gift-recommendations', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Here are some ideas.', recommendations: [] }),
  }));
}

test.beforeEach(async ({ page }) => {
  await installApiFixtures(page);
});

test('informational routes do not request the catalogue and shop requests a filtered page', async ({ page }) => {
  const catalogRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/catalog')) catalogRequests.push(request.url());
  });

  await page.goto('/faq');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(catalogRequests).toHaveLength(0);

  await page.goto('/shop?family=PLAY&q=puzzle&page=2&sort=price-low');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => catalogRequests.length).toBeGreaterThanOrEqual(1);

  const requestUrl = catalogRequests.find((url) => {
    const request = new URL(url);
    return request.searchParams.get('view') === 'shop';
  }) ?? catalogRequests[catalogRequests.length - 1];
  const request = new URL(requestUrl);
  expect(request.searchParams.get('view')).toBe('shop');
  expect(request.searchParams.get('family')).toBe('PLAY');
  expect(request.searchParams.get('q')).toBe('puzzle');
  expect(request.searchParams.get('page')).toBe('2');
  expect(request.searchParams.get('sort')).toBe('price-low');
});

test('shop lets customers retry after a catalogue request fails', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  let requestCount = 0;
  let allowCatalog = false;
  await page.route('**/api/catalog**', async (route) => {
    requestCount += 1;
    if (!allowCatalog) {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporarily unavailable' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        collections,
        total: items.length,
        page: 1,
        pageSize: 6,
        familyCounts: { PLAY: 1, HOME: 1, BUSINESS: 0 },
      }),
    });
  });

  await page.goto('/shop');
  const retryButton = page.getByRole('button', { name: 'Try again' });
  await expect(retryButton).toBeVisible();
  const errorPageWidths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(errorPageWidths.document).toBeLessThanOrEqual(errorPageWidths.viewport);
  allowCatalog = true;
  await retryButton.click();
  await expect(page.getByText('Creative Puzzle')).toBeVisible();
  expect(requestCount).toBeGreaterThanOrEqual(2);
});

test('key storefront routes do not overflow at narrow or common viewport widths', async ({ page }) => {
  const routes = ['/', '/shop', '/gift-builder', '/product-enquiry', '/contact', '/faq'];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const widths = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(widths.document, `${route} document overflow at ${width}px: ${JSON.stringify(widths)}`)
        .toBeLessThanOrEqual(widths.viewport);
      expect(widths.body, `${route} body overflow at ${width}px: ${JSON.stringify(widths)}`)
        .toBeLessThanOrEqual(widths.viewport);
    }
  }
});

test('gift builder validates required choices before advancing', async ({ page }) => {
  await page.goto('/gift-builder');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('product details dialog traps keyboard focus and restores its trigger', async ({ page }) => {
  await page.goto('/gift-builder');
  await page.locator('.builder-panel select').nth(0).selectOption({ index: 1 });
  await page.locator('.builder-panel select').nth(1).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Browse all products' }).click();
  const trigger = page.getByRole('button', { name: 'More details' }).first();
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.product-modal-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('gift builder form has no serious or critical axe violations', async ({ page }) => {
  await page.goto('/gift-builder');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const seriousViolations = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical');
  expect(seriousViolations).toEqual([]);
});
