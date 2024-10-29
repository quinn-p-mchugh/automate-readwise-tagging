import { test, chromium } from '@playwright/test';

test('Auto Tag Readwise Articles', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Open the target URL
  await page.goto('https://read.readwise.io/filter/tag__not%3A%22tagged-by-ghostreader-ai%22%20AND%20tag__not%3A%222tagged-by-ghostreader-ai%22%20AND%20saved_using__not%3Apocket%20AND%20saved_using__not%3Ainstapaper');

  // Ensure the page has fully loaded and list items have started to render
  await page.waitForLoadState('networkidle');

  let previousItemCount = 0;

  while (true) {
    // Step 2: Select all list items currently visible in the document
    const listItems = page.locator('ol > li[class*="document-row"]');
    const itemCount = await listItems.count();

    // If no new items have loaded, exit the loop
    if (itemCount === previousItemCount) {
      console.log('All items processed.');
      break;
    }

    // Update previousItemCount to the current item count
    previousItemCount = itemCount;

    // Process each item
    for (let i = 0; i < itemCount; i++) {
      const item = listItems.nth(i);

      // Ensure the item is in view
      await item.scrollIntoViewIfNeeded();

      // Hover over the item
      await item.hover();

      // Press "Shift + G"
      await page.keyboard.down('Shift');
      await page.keyboard.press('G');
      await page.keyboard.up('Shift');

      // Wait for the command container to appear
      const commandContainer = page.locator('.command-container');
      await commandContainer.waitFor({ state: 'visible', timeout: 5000 });

      // Click on the "🏷️ Tag the document" option
      const tagAction = page.locator('.palette-action-row').locator('span:text("🏷️ Tag the document")');
      await tagAction.click();

      // Wait for any animations or UI updates
      await page.waitForTimeout(1000);
    }

    // Step 3: Scroll down to load more items
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Wait for the lazy loading of new items
    await page.waitForLoadState('networkidle');
  }

  // Close the browser
  await browser.close();
});