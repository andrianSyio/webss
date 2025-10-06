// File: api/screenshot.js

// Import library yang diperlukan:
const { chromium } = require('playwright-core');
// Import library Chromium yang dioptimalkan untuk Serverless
const sparticuzChromium = require('@sparticuz/chromium'); 

// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    res.setHeader('Content-Type', 'image/png');

    // --- Validasi Input ---
    if (!targetUrl) {
        res.status(400).send('Parameter "url" wajib disertakan. Contoh: /api/screenshot?url=https://example.com');
        return;
    }

    let browser;
    let screenshot;

    try {
        // 1. Dapatkan jalur executable dari @sparticuz/chromium
        const executablePath = await sparticuzChromium.executablePath();

        // 2. Luncurkan browser Chromium
        browser = await chromium.launch({
            executablePath: executablePath,
            // Gunakan argumen yang disarankan oleh @sparticuz/chromium
            args: [...sparticuzChromium.args, '--no-sandbox'], 
            headless: sparticuzChromium.headless,
        });

        const page = await browser.newPage();
        
        // Mengatur resolusi layar simulasi
        await page.setViewportSize({ width: 1280, height: 720 });

        // Navigasi ke URL (Tingkatkan timeout)
        await page.goto(targetUrl, {
             waitUntil: 'networkidle', 
             timeout: 20000 // Timeout ditingkatkan menjadi 20 detik
        });

        // Ambil screenshot halaman penuh
        screenshot = await page.screenshot({ 
            type: 'png',
            fullPage: true
        });

        // Kirim screenshot sebagai respons sukses (200 OK)
        res.status(200).send(screenshot);

    } catch (error) {
        // Tangani error, misalnya jika navigasi gagal (timeout)
        console.error('Error saat mengambil screenshot:', error);
        res.status(500).send(`Gagal mengambil screenshot: Pastikan URL valid. Detail Error: ${error.message}`);
    } finally {
        // Pastikan browser ditutup
        if (browser) {
            await browser.close();
        }
    }
};
