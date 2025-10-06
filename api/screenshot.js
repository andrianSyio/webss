// api/screenshot.js
const chromium = require('chrome-aws-lambda');
let puppeteerCore = require('puppeteer-core');

module.exports = async (req, res) => {
  try {
    const query = req.query || {};
    const targetUrl = query.url || query.u;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing required query parameter: url. Example: ?url=https://example.com" });
    }

    // basic validation
    if (!/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: "URL harus diawali http:// atau https://", example: "https://google.com" });
    }

    const width = parseInt(query.width) || 1280;
    const height = parseInt(query.height) || 720;
    const fullPage = String(query.fullPage || "false").toLowerCase() === 'true';
    const delay = parseInt(query.delay) || 0;
    const format = (query.format === 'jpeg' || query.format === 'jpg') ? 'jpeg' : 'png';
    const quality = query.quality ? Math.max(1, Math.min(100, parseInt(query.quality))) : undefined;

    let browser = null;
    let page = null;

    // Determine executable path & launch options:
    // On Vercel (and AWS Lambda env), chrome-aws-lambda provides executablePath.
    // Locally (dev) executablePath may be empty — fallback to local puppeteer.
    const executablePath = await chromium.executablePath.catch(() => null);

    if (executablePath) {
      // Running in serverless environment (Vercel)
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: executablePath,
        headless: chromium.headless,
        defaultViewport: { width, height },
      });
    } else {
      // Local/dev fallback: try to use regular puppeteer (devDependencies)
      try {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
          defaultViewport: { width, height }
        });
      } catch (e) {
        // If puppeteer not installed locally, fail with informative message
        return res.status(500).json({
          error: "Chromium executable not available. On local dev, install 'puppeteer' as devDependency (npm i -D puppeteer) or set CHROME_PATH.",
          details: e.message
        });
      }
    }

    page = await browser.newPage();
    // optional: set user agent to avoid some bot blocks
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Safari/537.36');

    // navigate
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    if (delay > 0) {
      await page.waitForTimeout(delay);
    }

    const screenshotOptions = {
      fullPage: fullPage,
      type: format
    };
    if (format === 'jpeg' && quality) screenshotOptions.quality = quality;

    const buffer = await page.screenshot(screenshotOptions);

    // set response headers
    res.setHeader('Content-Type', format === 'jpeg' ? 'image/jpeg' : 'image/png');
    // cache on CDN for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Screenshot error:", err);
    // if error.message is long, keep short for client
    res.status(500).json({ error: "Failed to capture screenshot", message: err.message || String(err) });
  } finally {
    // best-effort close
    try { if (global.browser) await global.browser.close(); } catch (_) {}
  }
};
