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

test('home hero artwork can be changed with accessible dots and reshuffles on return home', async ({ page }) => {
  await page.goto('/');

  const carousel = page.getByRole('group', { name: 'Featured artwork' });
  const firstSlide = carousel.getByRole('button', { name: 'Show hero image 1' });
  const secondSlide = carousel.getByRole('button', { name: 'Show hero image 2' });
  const thirdSlide = carousel.getByRole('button', { name: 'Show hero image 3' });
  await expect(firstSlide).toBeVisible();
  await expect(secondSlide).toBeVisible();
  await expect(thirdSlide).toBeVisible();
  await expect(carousel.locator('button[aria-pressed="true"]')).toHaveCount(1);

  await secondSlide.click();
  await expect(secondSlide).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hero-artwork-active')).toHaveAttribute('src', '/friends-painting-figurine.webp');
  await expect.poll(() => page.locator('.hero-artwork-active').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.hero-artwork-message-active')).toContainText('Create together.');

  await thirdSlide.click();
  await expect(thirdSlide).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hero-artwork-active')).toHaveAttribute('src', '/playful-animal-robot-workshop.webp');
  await expect.poll(() => page.locator('.hero-artwork-active').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.hero-artwork-message-active')).toContainText('Big ideas.');

  await firstSlide.click();
  await expect(page.locator('.hero-artwork-active')).toHaveAttribute('src', '/discovery-box-adventure.png');
  await page.getByRole('link', { name: 'Shop' }).first().click();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('.hero-artwork-active')).toHaveAttribute('src', '/friends-painting-figurine.webp');

  await page.setViewportSize({ width: 320, height: 812 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(thirdSlide).toBeVisible();
});

test('corporate hero image remains visible alongside the home carousel styles', async ({ page }) => {
  await page.goto('/corporate');

  const artwork = page.locator('.corporate-hero .hero-artwork');
  await expect(artwork).toBeVisible();
  await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(artwork).toHaveCSS('opacity', '1');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveCSS('opacity', '1');
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

test('assistant retries the failed message without duplicating it', async ({ page }) => {
  const requestMessages: unknown[] = [];
  let requestCount = 0;
  await page.route('**/api/assistant/chat', async (route) => {
    requestCount += 1;
    requestMessages.push(JSON.parse(route.request().postData() ?? '{}').messages);
    if (requestCount === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'The assistant is temporarily unavailable.' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer: 'Here are a few gift ideas.' }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Chat with Fox, your gift guide' }).click();
  const input = page.getByRole('textbox', { name: 'Ask about gifts or products…' });
  await input.fill('Suggest a gift for a friend');
  await page.getByRole('button', { name: 'Send message' }).click();

  const retryButton = page.getByRole('button', { name: 'Retry' });
  await expect(retryButton).toBeVisible();
  await retryButton.click();
  await expect(page.getByText('Here are a few gift ideas.')).toBeVisible();
  expect(requestCount).toBe(2);
  expect(requestMessages[1]).toEqual(requestMessages[0]);
  await expect(page.getByText('Suggest a gift for a friend', { exact: true })).toHaveCount(1);
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

test('preferred contact choices show icons and keep labels on one line on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/gift-builder');
  await page.locator('.builder-panel select').nth(0).selectOption({ index: 1 });
  await page.locator('.builder-panel select').nth(1).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  const options = page.locator('.preferred-contact-option');
  await expect(options).toHaveCount(3);
  for (const option of await options.all()) {
    await expect(option.locator('svg')).toBeVisible();
    const text = option.locator('span');
    await expect(text).toHaveCSS('white-space', 'nowrap');
    const dimensions = await option.evaluate((element) => ({
      textWidth: element.querySelector('span')?.getBoundingClientRect().width ?? 0,
      textScrollWidth: element.querySelector('span')?.scrollWidth ?? 0,
      textClientWidth: element.querySelector('span')?.clientWidth ?? 0,
    }));
    expect(dimensions.textScrollWidth, `contact option text wraps or clips: ${JSON.stringify(dimensions)}`)
      .toBeLessThanOrEqual(dimensions.textClientWidth);
    expect(dimensions.textWidth).toBeGreaterThan(0);
  }

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(320);
});

test('preferred contact buttons size to their contents instead of filling the form width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gift-builder');
  await page.locator('.builder-panel select').nth(0).selectOption({ index: 1 });
  await page.locator('.builder-panel select').nth(1).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  const dimensions = await page.locator('.preferred-contact').evaluate((fieldset) => {
    const options = Array.from(fieldset.querySelectorAll<HTMLElement>('.preferred-contact-option'));
    const group = fieldset.querySelector<HTMLElement>('.preferred-contact-options');
    return {
      fieldsetWidth: fieldset.getBoundingClientRect().width,
      groupWidth: group?.getBoundingClientRect().width ?? 0,
      optionWidths: options.map((option) => option.getBoundingClientRect().width),
    };
  });
  expect(dimensions.optionWidths).toHaveLength(3);
  for (const width of dimensions.optionWidths) expect(width).toBeLessThan(180);
  expect(dimensions.groupWidth).toBeLessThan(dimensions.fieldsetWidth / 2);
});

test('gift builder progress can be saved, resumed, or discarded while navigating', async ({ page }) => {
  await page.goto('/gift-builder');
  const occasion = page.getByRole('combobox', { name: 'What are we celebrating?' });
  const recipient = page.getByRole('combobox', { name: 'Who is it for?' });
  await occasion.selectOption({ label: 'Birthday' });
  await recipient.selectOption({ label: 'Friend' });

  await page.getByRole('link', { name: 'Shop' }).click();
  const prompt = page.getByRole('alertdialog');
  await expect(prompt).toBeVisible();
  await page.getByRole('button', { name: 'Stay on this form' }).click();
  await expect(prompt).toBeHidden();
  await expect(occasion).toHaveValue('Birthday');

  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).toHaveURL(/\/shop$/);
  const resumeButton = page.getByRole('button', { name: 'Continue your gift inquiry' });
  await expect(resumeButton).toBeVisible();
  await resumeButton.click();
  await expect(page).toHaveURL(/\/gift-builder$/);
  await expect(page.getByRole('combobox', { name: 'What are we celebrating?' })).toHaveValue('Birthday');
  await expect(page.getByRole('combobox', { name: 'Who is it for?' })).toHaveValue('Friend');

  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Leave without saving' }).click();
  await expect(page.getByRole('button', { name: 'Continue your gift inquiry' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Gift builder' }).click();
  await expect(page.getByRole('combobox', { name: 'What are we celebrating?' })).toHaveValue('');
});

test('saved inquiry progress is cleared by a page refresh', async ({ page }) => {
  await page.goto('/gift-builder');
  await page.getByRole('combobox', { name: 'What are we celebrating?' }).selectOption({ label: 'Birthday' });
  await page.getByRole('combobox', { name: 'Who is it for?' }).selectOption({ label: 'Friend' });
  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByRole('button', { name: 'Continue your gift inquiry' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue your gift inquiry' })).toHaveCount(0);
});

test('closing the saved inquiry control discards the saved progress', async ({ page }) => {
  await page.goto('/gift-builder');
  await page.getByRole('combobox', { name: 'What are we celebrating?' }).selectOption({ label: 'Birthday' });
  await page.getByRole('combobox', { name: 'Who is it for?' }).selectOption({ label: 'Friend' });
  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByRole('button', { name: 'Discard saved inquiry' }).click();
  await expect(page.getByRole('button', { name: 'Continue your gift inquiry' })).toHaveCount(0);
});

test('saved inquiry control icon adapts to light and dark themes', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem('discovery-theme'));
  await page.goto('/gift-builder');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('combobox', { name: 'What are we celebrating?' }).selectOption({ label: 'Birthday' });
  await page.getByRole('combobox', { name: 'Who is it for?' }).selectOption({ label: 'Friend' });
  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  const resumeButton = page.getByRole('button', { name: 'Continue your gift inquiry' });
  const icon = resumeButton.locator('svg');
  await expect(icon).toBeVisible();
  await expect(icon.locator('.saved-inquiry-icon-accent')).toHaveAttribute('d', 'M9 18.5h3');
  const lightColors = await resumeButton.evaluate((button) => {
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, color: style.color };
  });

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkColors = await resumeButton.evaluate((button) => {
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, color: style.color };
  });
  expect(darkColors.background).not.toBe(lightColors.background);
  expect(darkColors.color).not.toBe(lightColors.color);
  await expect(resumeButton.locator('svg .saved-inquiry-icon-accent')).toHaveCSS('stroke', 'rgb(107, 216, 206)');
});

test('browser back asks before leaving a filled gift builder', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('link', { name: 'Gift builder' }).click();
  await page.getByRole('combobox', { name: 'What are we celebrating?' }).selectOption({ label: 'Birthday' });
  await page.getByRole('combobox', { name: 'Who is it for?' }).selectOption({ label: 'Friend' });

  await page.goBack();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole('button', { name: 'Continue your gift inquiry' })).toBeVisible();
});

test('product enquiry form progress can be saved and resumed', async ({ page }) => {
  await page.goto('/product-enquiry?product=GIFT-001');
  await page.getByRole('textbox', { name: 'Your name' }).fill('Taylor Customer');
  await page.getByRole('textbox', { name: 'Email' }).fill('taylor@example.com');
  await page.getByRole('textbox', { name: 'Question or customization note (optional)' }).fill('Please include a birthday note.');

  await page.getByRole('link', { name: 'Shop' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByRole('button', { name: 'Continue your product inquiry' }).click();
  await expect(page).toHaveURL(/\/product-enquiry$/);
  await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveValue('Taylor Customer');
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('taylor@example.com');
  await expect(page.getByRole('textbox', { name: 'Question or customization note (optional)' }))
    .toHaveValue('Please include a birthday note.');
  await expect(page.getByText('Creative Puzzle')).toBeVisible();
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
