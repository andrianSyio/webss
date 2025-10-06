// api/screenshot.js
const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const query = req.query || {};
  const targetUrl = query.url || query.u;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url parameter. Example: /api/screenshot?url=https://example.com' });
  }
  if (!/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).json({ error: 'URL must start with http:// or https://' });
  }

  const width = parseInt(query.width, 10) || 1280;
  const height = parseInt(query.height, 10) || 720;
  const fullPage = String(query.fullPage || 'false').toLowerCase() === 'true';
  const delay = parseInt(query.delay, 10) || 0;
  const format = (query.format || 'png').toLowerCase() === 'jpeg' ? 'jpeg' : 'png';
  const quality = query.quality ? Math.min(100, Math.max(1, parseInt(query.quality, 10))) : undefined;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote'
      ],
      defaultViewport: { width, height }
    });

    const page = await browser.newPage();
    // set a common user agent to avoid some bot blocks
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36');

    // navigate
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    if (delay > 0) await page.waitForTimeout(delay);

    const screenshotOptions = {
      type: format,
      fullPage: fullPage
    };
    if (format === 'jpeg' && quality) screenshotOptions.quality = quality;

    const buffer = await page.screenshot(screenshotOptions);

    // headers
    res.setHeader('Content-Type', format === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    res.status(200).send(buffer);
  } catch (err) {
    console.error('Screenshot Error:', err);
    // Provide limited info to client but log stack on server (console)
    res.status(500).json({ error: 'Failed to capture screenshot', message: err.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
  }
};
