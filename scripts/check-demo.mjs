import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const url = process.argv[2];
const screenshotPath = process.argv[3];
if (!url) throw new Error('Pass a deployed or local demo URL.');

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1160 },
    ignoreHTTPSErrors: process.env.DEMO_TEST_ALLOW_PROXY_CERT === '1',
  });
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  const response = await page.goto(url);
  assert.equal(response?.status(), 200);
  await page.getByRole('heading', { name: 'Dispatch staffing' }).waitFor();
  const summary = page.locator('.metrics');
  const verify = async (locator, pattern) => assert.match(await locator.innerText(), pattern);
  await verify(summary, /Critical coverage\s+2\s*\/\s*2/);
  await verify(summary, /Roster-order coverage\s+1\s*\/\s*2/);
  await page.getByRole('button', { name: /Dispatch lead.*Avery Chen/ }).click();
  await verify(page.locator('.evidence'), /Avery Chen\s+Proposed for this role/);
  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.getByLabel('Avery Chen').selectOption('out');
  await verify(summary, /Critical coverage\s+1\s*\/\s*2/);
  await page.getByRole('button', { name: /Dispatch lead.*Escalate/ }).waitFor();
  await verify(page.locator('.evidence'), /No confirmed worker has the required qualification/);
  await verify(page.locator('.evidence'), /Avery Chen\s+Unavailable/);
  await page.getByRole('button', { name: 'Mark plan reviewed' }).click();
  await page.getByRole('heading', { name: 'Proposal reviewed' }).waitFor();

  // Use the range control with a keyboard and check a fully infeasible scenario.
  await page.locator('#budget').focus();
  await page.keyboard.press('Home');
  await verify(summary, /Critical coverage\s+0\s*\/\s*2/);
  await verify(summary, /Roles to escalate\s+4/);
  await page.getByRole('heading', { name: 'Coordinator decision' }).waitFor();
  await page.getByRole('button', { name: 'Reset' }).click();
  await verify(summary, /Critical coverage\s+2\s*\/\s*2/);

  await page.setViewportSize({ width: 375, height: 800 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(runtimeErrors, []);
  console.log('Anonymous demo passed: default, evidence, call-out, review, zero budget, reset, and mobile width.');
} finally {
  await browser.close();
}
