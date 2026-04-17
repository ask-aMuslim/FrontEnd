import { test, expect } from '@playwright/test';

test('verify ask assistant streaming', async ({ page }) => {
  // Listen for console logs
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto('http://localhost:4200/question-and-answer/ask-assistant');

  // Find the input field
  const textarea = page.locator('textarea[name="ask"]');
  await textarea.fill('Hello playwright test');

  // Submit the form
  const submitButton = page.locator('.ask-assistant-page__submit-button');
  await submitButton.click();

  // Wait 10 seconds for streaming to output logs
  await page.waitForTimeout(10000);

  // Print all collected logs accurately for analysis
  console.log("----- BROWSER CONSOLE LOGS -----");
  for (const log of logs) {
    console.log(log);
  }
  console.log("--------------------------------");

  // Read the messages HTML directly
  const messagesHtml = await page.locator('.ask-assistant-page__messages-list').innerHTML();
  console.log("----- MESSAGES HTML -----");
  console.log(messagesHtml);
});
