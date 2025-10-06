// api/screenshot.js
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  let browser;

  try {
    const { url, width, height, fullPage, delay, format, quality } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing ?url parameter' });

    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL harus diawali http:// atau https://' });
    }

    const viewport = {
      width: parseInt(width) || 1280,
      height: parseInt(height) || 720,
    };
    const isFullPage = String(fullPage || '').toLowerCase() === 'true';
    const waitDelay = parseInt(delay) || 0;
    const imgFormat = (format || 'png').toLowerCase() === 'jpeg' ? 'jpeg' : 'png';
    const imgQuality = quality ? Math.min(100, Math.max(1, parseInt(quality))) : undefined;

    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: viewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (waitDelay > 0) await page.waitForTimeout(waitDelay);

    const buffer = await page.screenshot({
      type: imgFormat,
      quality: imgFormat === 'jpeg' ? imgQuality : undefined,
      fullPage: isFullPage,
    });

    res.setHeader('Content-Type', imgFormat === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('Screenshot Error:', err);
    res.status(500).json({ error: 'Failed to capture screenshot', message: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
