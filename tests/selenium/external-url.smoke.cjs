const assert = require('node:assert/strict');
const { Builder, Browser, By } = require('selenium-webdriver');
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

    const expectedBase = new URL(targetUrl).pathname.replace(/\\/$/, '');
    const internalLinks = await driver.executeScript(`
      return Array.from(document.querySelectorAll('a[href]'))
        .map(anchor => anchor.href)
        .filter(href => new URL(href).origin === location.origin);
    `);
    const brokenLinks = internalLinks.filter(href => {
      const pathname = new URL(href).pathname;
      return pathname !== expectedBase && !pathname.startsWith(expectedBase + '/');
    });
    assert.deepEqual(brokenLinks, [], 'Internal links must stay under the GitHub Pages project path');

    await driver.get(new URL(expectedBase + '/contact/', new URL(targetUrl).origin).href);
    const contactForm = await driver.findElement(By.css('form.contact-form'));
    assert.equal(await contactForm.isDisplayed(), true, 'The contact form must render');
    await driver.get(new URL(expectedBase + '/newsroom/sign-in/', new URL(targetUrl).origin).href);
    assert.match(await driver.findElement(By.css('h1')).getText(), /Newsroom access/i, 'The newsroom sign-in page must render');

    console.log(JSON.stringify({ status: 'passed', targetUrl, currentUrl, title, readyState, checkedInternalLinks: internalLinks.length }, null, 2));
  } finally {
    if (driver) await driver.quit();
  }
}

main().catch((error) => {
  console.error('Selenium external URL smoke test failed:', error);
  process.exitCode = 1;
});
