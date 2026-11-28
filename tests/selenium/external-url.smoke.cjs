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

    const base = new URL(targetUrl);
    const basePath = base.pathname.replace(/\/$/, '');
    const page = path => new URL(basePath + path, base.origin).href;
    const report = {};

    await driver.get(targetUrl);
    report.homeTitle = await driver.getTitle();
    report.homeHeading = await driver.findElement(By.css('h1')).getText();
    assert.ok(report.homeTitle.trim(), 'Homepage must have a title');
    assert.match(report.homeHeading, /News that puts\s+people first/i, 'Homepage hero must render');
    report.homepageNewsCardCount = await driver.findElements(By.css('.home-source-card')).then(x=>x.length);
    assert.ok(report.homepageNewsCardCount >= 6, 'Homepage must show at least six source-desk news cards');
    assert.equal(await driver.findElement(By.css('.home-source-disclaimer')).isDisplayed(), true, 'Homepage must explain external-source verification status');
    report.homepageOriginalStoryLinks = await driver.findElements(By.css('.home-source-card a[href^="https://"]')).then(x=>x.length);
    assert.ok(report.homepageOriginalStoryLinks >= 6, 'Homepage cards must link to their original publishers');
    assert.equal(await driver.executeScript('return document.readyState'), 'complete');
    const homepageImages = await driver.executeAsyncScript(function(done) {
      const images = Array.from(document.querySelectorAll('.home-source-card img'));
      let index = 0;
      const visitNext = () => {
        if (index >= images.length) {
          Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 10000);
          }))).then(() => done({
            count: images.length,
            loaded: images.filter(img => img.complete && img.naturalWidth > 0).length,
            broken: images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src)
          }));
          return;
        }
        images[index++].scrollIntoView({ block: 'center' });
        setTimeout(visitNext, 120);
      };
      visitNext();
    });
    report.homepageImages = homepageImages;
    assert.ok(homepageImages.count >= 6, 'Homepage news cards must include original source images');
    assert.ok(homepageImages.loaded >= 5, 'At least five homepage source images must load in Chromium');
    assert.equal(homepageImages.broken.length, 0, 'Homepage source images must not be broken');


    const internalLinks = await driver.executeScript("return Array.from(document.querySelectorAll('a[href]')).map(a=>a.href).filter(h=>new URL(h).origin===location.origin)");
    const brokenLinks = internalLinks.filter(h => {
      const path = new URL(h).pathname;
      return path !== basePath && !path.startsWith(basePath + '/');
    });
    assert.deepEqual(brokenLinks, [], 'Internal links must stay under the GitHub Pages project path');
    report.checkedInternalLinks = internalLinks.length;

    await driver.get(page('/source-desk/'));
    report.sourceDeskHeading = await driver.findElement(By.css('h1')).getText();
    report.sourceDeskBriefCount = await driver.findElements(By.css('article')).then(x=>x.length);
    assert.match(report.sourceDeskHeading, /35 recent stories/i);
    assert.ok(report.sourceDeskBriefCount >= 35, 'Source Desk must render the curated 35 briefs');
    const sourceDeskImages = await driver.executeAsyncScript(function(done) {
      const images = Array.from(document.querySelectorAll('.source-brief-card img'));
      let index = 0;
      const visitNext = () => {
        if (index >= images.length) {
          Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 10000);
          }))).then(() => done({
            count: images.length,
            loaded: images.filter(img => img.complete && img.naturalWidth > 0).length,
            broken: images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src)
          }));
          return;
        }
        images[index++].scrollIntoView({ block: 'center' });
        setTimeout(visitNext, 80);
      };
      visitNext();
    });
    report.sourceDeskImages = sourceDeskImages;
    assert.ok(sourceDeskImages.count >= 30, 'Source Desk must display original images for most source briefs');
    assert.ok(sourceDeskImages.loaded >= 28, 'At least 28 Source Desk images must load in Chromium');
    assert.equal(sourceDeskImages.broken.length, 0, 'Source Desk source images must not be broken');


    await driver.get(page('/contact/'));
    report.contactFormVisible = await driver.findElement(By.css('form.contact-form')).isDisplayed();
    assert.equal(report.contactFormVisible, true, 'Contact form must render');

    await driver.get(page('/newsroom/sign-in/'));
    assert.match(await driver.findElement(By.css('h1')).getText(), /Newsroom access/i);
    await driver.findElement(By.xpath("//button[contains(., 'Register for a newsroom role')]")).click();
    report.registrationHeading = await driver.findElement(By.css('h1')).getText();
    assert.match(report.registrationHeading, /Create newsroom account/i);
    const roleOptions = await driver.findElements(By.css('select option')).then(async options => Promise.all(options.map(x=>x.getText())));
    report.registrationRoles = roleOptions;
    assert.deepEqual(roleOptions, ['Reporter','Contributor','News Editor','Managing Editor']);
    const password = await driver.findElement(By.css('input[type="password"]'));
    report.minimumPasswordLength = Number(await password.getAttribute('minlength'));
    assert.ok(report.minimumPasswordLength >= 14, 'Registration password must require at least 14 characters');
    report.administratorRoleNotPublic = !roleOptions.some(x=>/administrator|publisher/i.test(x));

    console.log(JSON.stringify({ status: 'passed', targetUrl, ...report }, null, 2));
  } finally {
    if (driver) await driver.quit();
  }
}

main().catch(error => {
  console.error('Selenium external URL smoke test failed:', error);
  process.exitCode = 1;
});
