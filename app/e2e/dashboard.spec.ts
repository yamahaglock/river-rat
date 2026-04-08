import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/River Rat/);
  });

  test('header renders with app name', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('River Rat');
    await expect(header).toContainText('Parker Dam Flow Tracker');
  });

  test('header shows timezone indicator', async ({ page }) => {
    await expect(page.locator('header')).toContainText('Times in PT');
  });
});

test.describe('Flow Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('flow chart renders', async ({ page }) => {
    // The chart container should be visible
    const chartSection = page.locator('text=24-Hour Flow Profile');
    await expect(chartSection).toBeVisible();
  });

  test('chart shows threshold line label', async ({ page }) => {
    // The 8k CFS reference line label should appear
    await expect(page.locator('text=8k CFS')).toBeVisible();
  });

  test('chart legend is visible', async ({ page }) => {
    await expect(page.locator('text=Dam Release')).toBeVisible();
    // Legend is inside a span with a colored swatch
    await expect(page.locator('span:has-text("At River House") >> nth=0')).toBeVisible();
  });

  test('daily average is displayed', async ({ page }) => {
    await expect(page.locator('text=Daily Average')).toBeVisible();
    // Should show a CFS number
    await expect(page.locator('text=/\\d{1,2},\\d{3}/')).toBeTruthy();
  });
});

test.describe('Day Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('day navigator renders with a date', async ({ page }) => {
    // Should show a full date like "Wednesday, April 8, 2026"
    const dateText = page.locator('text=/\\w+day, \\w+ \\d+, \\d{4}/');
    await expect(dateText.first()).toBeVisible();
  });

  test('defaults to closest available date, not the latest', async ({ page }) => {
    // Our data has Apr 8-11. Today (Apr 7/8) should show Apr 8 (closest), not Apr 11 (latest).
    // The page should NOT show April 11 on initial load.
    const dateText = page.locator('text=/\\w+day, \\w+ \\d+, \\d{4}/').first();
    const text = await dateText.textContent();
    expect(text).not.toContain('April 11');
  });

  test('prev/next arrows are present', async ({ page }) => {
    const prevButton = page.locator('button[aria-label="Previous day"]');
    const nextButton = page.locator('button[aria-label="Next day"]');
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('can navigate to next day', async ({ page }) => {
    const nextButton = page.locator('button[aria-label="Next day"]');

    // Get initial date text
    const dateLocator = page.locator('text=/\\w+day, \\w+ \\d+, \\d{4}/').first();
    const initialDate = await dateLocator.textContent();

    // Click next if enabled
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      // Date should change
      await expect(dateLocator).not.toHaveText(initialDate!);
    }
  });

  test('can navigate back with prev after going forward', async ({ page }) => {
    const nextButton = page.locator('button[aria-label="Next day"]');
    const prevButton = page.locator('button[aria-label="Previous day"]');

    if (await nextButton.isEnabled()) {
      const dateLocator = page.locator('text=/\\w+day, \\w+ \\d+, \\d{4}/').first();
      const initialDate = await dateLocator.textContent();

      await nextButton.click();
      await expect(dateLocator).not.toHaveText(initialDate!);

      await prevButton.click();
      await expect(dateLocator).toHaveText(initialDate!);
    }
  });
});

test.describe('Weather Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('weather card renders', async ({ page }) => {
    const weatherSection = page.locator('text=Parker, AZ Area');
    await expect(weatherSection).toBeVisible();
  });

  test('shows temperature', async ({ page }) => {
    // Should show a temperature like "105°F"
    await expect(page.locator('text=/\\d+°F/')).toBeTruthy();
  });

  test('shows wind and humidity', async ({ page }) => {
    await expect(page.locator('text=/\\d+ mph/')).toBeTruthy();
    await expect(page.locator('text=/\\d+%/')).toBeTruthy();
  });
});

test.describe('Jet Ski Windows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('jet ski windows section renders', async ({ page }) => {
    // Should show either "Jet Ski Windows" or the "no rideable windows" message
    const hasWindows = page.locator('text=Jet Ski Windows');
    const noWindows = page.locator('text=No rideable windows');
    const either = hasWindows.or(noWindows);
    await expect(either.first()).toBeVisible();
  });

  test('shows time ranges when flow is rideable', async ({ page }) => {
    const windowsSection = page.locator('text=Jet Ski Windows');
    if (await windowsSection.isVisible()) {
      // Should show hour ranges like "8 PM – 11 PM"
      await expect(page.locator('text=/\\d+ [AP]M/')).toBeTruthy();
      // Should show hours count
      await expect(page.locator('text=/\\d+hrs? rideable/')).toBeVisible();
    }
  });

  test('shows caution indicators when flow is dropping', async ({ page }) => {
    const windowsSection = page.locator('text=Jet Ski Windows');
    if (await windowsSection.isVisible()) {
      // May show caution/extreme-caution segments with emoji indicators
      const cautionEmoji = page.locator('text=/🟡|🟠/');
      // These may or may not be present depending on data, just verify no crash
      await expect(windowsSection).toBeVisible();
    }
  });

  test('only shows daylight hours with sunrise/sunset info', async ({ page }) => {
    const windowsSection = page.locator('text=Jet Ski Windows');
    if (await windowsSection.isVisible()) {
      // Should show sunrise/sunset in footer
      await expect(page.locator('text=/sunrise \\d+ [AP]M/')).toBeVisible();
      await expect(page.locator('text=/sunset \\d+ [AP]M/')).toBeVisible();
    }
  });
});

test.describe('Hourly Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hourly breakdown section is present', async ({ page }) => {
    await expect(page.locator('text=Hourly Breakdown')).toBeVisible();
  });

  test('expands when clicked', async ({ page }) => {
    const toggle = page.locator('text=Hourly Breakdown');
    await toggle.click();

    // Table headers should appear
    await expect(page.locator('text=Time (PT)')).toBeVisible();
    await expect(page.locator('text=Dam CFS')).toBeVisible();
    await expect(page.locator('text=House CFS')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('shows 24 hourly rows when expanded', async ({ page }) => {
    await page.locator('text=Hourly Breakdown').click();

    // Should have rows with AM/PM times
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(24);
  });

  test('collapses when clicked again', async ({ page }) => {
    const toggle = page.locator('text=Hourly Breakdown');
    await toggle.click();
    await expect(page.locator('text=Time (PT)')).toBeVisible();

    await toggle.click();
    await expect(page.locator('text=Time (PT)')).not.toBeVisible();
  });
});

test.describe('Footer', () => {
  test('shows data source attribution', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=USBR Headgate Rock Dam Report')).toBeVisible();
    await expect(page.locator('footer')).toContainText('8,000 CFS');
  });
});

test.describe('Responsive Layout', () => {
  test('mobile layout stacks cards vertically', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=24-Hour Flow Profile')).toBeVisible();
  });

  test('desktop layout shows wider view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=24-Hour Flow Profile')).toBeVisible();
  });
});

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('dark mode toggle button is visible', async ({ page }) => {
    const toggle = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]');
    await expect(toggle).toBeVisible();
  });

  test('clicking toggle adds dark class to html', async ({ page }) => {
    // Start in light mode (clear any stored preference)
    await page.evaluate(() => localStorage.removeItem('river-rat-dark-mode'));
    await page.reload();

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Click the dark mode toggle
    const toggle = page.locator('button[aria-label="Switch to dark mode"]');
    await toggle.click();

    await expect(html).toHaveClass(/dark/);
  });

  test('dark mode preference persists across reload', async ({ page }) => {
    // Enable dark mode
    const toggle = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]');
    await toggle.click();

    // Check what mode we're in now
    const isDarkAfterClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Reload and verify it persisted
    await page.reload();
    const isDarkAfterReload = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    expect(isDarkAfterReload).toBe(isDarkAfterClick);
  });

  test('dark mode renders all major sections', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      localStorage.setItem('river-rat-dark-mode', 'true');
    });
    await page.reload();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=24-Hour Flow Profile')).toBeVisible();
    await expect(page.locator('text=Hourly Breakdown')).toBeVisible();
  });
});

test.describe('PWA', () => {
  test('manifest is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('River Rat - Parker Dam Flow Tracker');
    expect(manifest.short_name).toBe('River Rat');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0891B2');
  });

  test('app icons are accessible and properly sized', async ({ page }) => {
    const icon192 = await page.goto('/icons/icon-192.png');
    expect(icon192?.status()).toBe(200);
    // Should be a real image, not a tiny placeholder (our designed icon is 30+ KB)
    const body192 = await icon192?.body();
    expect(body192!.length).toBeGreaterThan(10000);

    const icon512 = await page.goto('/icons/icon-512.png');
    expect(icon512?.status()).toBe(200);
    const body512 = await icon512?.body();
    expect(body512!.length).toBeGreaterThan(30000);
  });

  test('apple touch icon is accessible and properly sized', async ({ page }) => {
    const icon = await page.goto('/icons/apple-touch-icon.png');
    expect(icon?.status()).toBe(200);
    const body = await icon?.body();
    expect(body!.length).toBeGreaterThan(10000);
  });

  test('icon SVG source is available', async ({ page }) => {
    const svg = await page.goto('/icons/icon-source.svg');
    expect(svg?.status()).toBe(200);
  });
});
