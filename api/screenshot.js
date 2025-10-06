// File: api/screenshot.js

const { chromium } = require('playwright-core');
const sparticuzChromium = require('@sparticuz/chromium'); 

// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    res.setHeader('Content-Type', 'image/png');

    if (!targetUrl) {
        res.status(400).send('Parameter "url" wajib disertakan. Contoh: /api/screenshot?url=https://example.com');
        return;
    }

    let browser;
    let screenshot;

    try {
        const executablePath = await sparticuzChromium.executablePath();

        // 2. Luncurkan browser Chromium
        browser = await chromium.launch({
            executablePath: executablePath,
            args: [
                ...sparticuzChromium.args, 
                '--no-sandbox' // Argumen ini harus ada
            ],
            // PERBAIKAN: SET HEADLESS KE BOOLEAN TRUE SECARA EKSPLISIT
            headless: true, 
        });

        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 720 });

        // Navigasi ke URL (dengan timeout 20 detik)
        await page.goto(targetUrl, {
             waitUntil: 'networkidle', 
             timeout: 20000 
        });

        screenshot = await page.screenshot({ 
            type: 'png',
            fullPage: true
        });

        res.status(200).send(screenshot);

    } catch (error) {
        console.error('Error saat mengambil screenshot:', error);
        res.status(500).send(`Gagal mengambil screenshot: Pastikan URL valid. Detail Error: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
