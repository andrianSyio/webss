// File: api/screenshot.js (Dengan perbaikan @sparticuz/chromium)

// Import library yang diperlukan:
const { chromium } = require('playwright-core');
// Import library baru:
const chromium = require('@sparticuz/chromium'); 

// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    res.setHeader('Content-Type', 'image/png');
    // ... (Validasi input dan variabel lain) ...
    
    let browser;
    let screenshot;

    try {
        // PERUBAHAN: Dapatkan path executable langsung dari @sparticuz/chromium
        const executablePath = await chromium.executablePath();

        // Luncurkan browser Chromium
        browser = await chromium.launch({
            executablePath,
            // Gunakan argumen kompatibilitas dari library baru
            args: [...chromium.args, '--no-sandbox'], 
            headless: chromium.headless,
        });

        // ... (Sisa kode page.goto dan page.screenshot sama) ...

        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
        screenshot = await page.screenshot({ type: 'png', fullPage: true });

        res.status(200).send(screenshot);

    } catch (error) {
        console.error('Error saat mengambil screenshot:', error);
        res.status(500).send(`Gagal mengambil screenshot: Detail Error: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
