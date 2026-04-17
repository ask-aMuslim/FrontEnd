import { test, expect } from '@playwright/test';
const fs = require('fs');

test('verify ask assistant streaming', async ({ page }) => {
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto('http://localhost:4200/question-and-answer/ask-assistant');

  // Submit the form
  await page.locator('textarea[name="ask"]').fill('Who is the prophet?');
  await page.locator('.ask-assistant-page__submit-button').click();

  // Wait for 15 seconds to let the entire stream finish.
  await page.waitForTimeout(15000);

  fs.writeFileSync('playwright_debug.log', logs.join('\n'));
});
