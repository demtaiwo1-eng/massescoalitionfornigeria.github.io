const assert = require('node:assert/strict');
const { Builder, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const targetUrl = process.env.EXTERNAL_TEST_URL || 'https://demtaiwo1-eng.github.io/massescoalitionfornigeria.github.io/';

async function main() {
  const parsed = new URL(targetUrl);
  assert.ok(['http:', 'https:'].includes(parsed.protocol), 'EXTERNAL_TEST_URL must be HTTP(S)');

  const options = new chrome.Options()
    .addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000');
  if (process.env.CHROME_BINARY) options.setChromeBinaryPath(process.env.CHROME_BINARY);

  let driver;
  try {
    const builder = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options);
    if (process.env.CHROMEDRIVER_PATH) builder.setChromeService(new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH));
    driver = await builder.build();

    await driver.manage().setTimeouts({ pageLoad: 60000, script: 30000, implicit: 0 });
    await driver.get(targetUrl);

    const title = await driver.getTitle();
    const currentUrl = await driver.getCurrentUrl();
    const readyState = await driver.executeScript('return document.readyState');

    assert.ok(title && title.trim().length > 0, 'The external page must have a non-empty title');
    assert.equal(readyState, 'complete', 'The external page must finish loading');
    assert.ok(currentUrl.startsWith('http'), 'The browser must remain on an HTTP(S) URL');

    console.log(JSON.stringify({ status: 'passed', targetUrl, currentUrl, title, readyState }, null, 2));
  } finally {
    if (driver) await driver.quit();
  }
}

main().catch((error) => {
  console.error('Selenium external URL smoke test failed:', error);
  process.exitCode = 1;
});
