// api/screenshot.js
const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  let browser;
  try {
    const query = req.query || {};
    const targetUrl = query.url;
    if (!targetUrl) return res.status(400).json({ error: "Missing ?url parameter" });

    if (!/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: "URL harus diawali http:// atau https://" });
    }

    const width = parseInt(query.width) || 1280;
    const height = parseInt(query.height) || 720;
    const fullPage = (query.fullPage || '').toLowerCase() === 'true';
    const delay = parseInt(query.delay) || 0;
    const format = (query.format || 'png').toLowerCase() === 'jpeg' ? 'jpeg' : 'png';
    const quality = query.quality ? Math.min(100, Math.max(1, parseInt(query.quality))) : undefined;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width, height }
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    if (delay > 0) await page.waitForTimeout(delay);

    const screenshotOptions = { fullPage, type: format };
    if (format === 'jpeg' && quality) screenshotOptions.quality = quality;

    const buffer = await page.screenshot(screenshotOptions);

    res.setHeader('Content-Type', format === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to capture screenshot", message: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
