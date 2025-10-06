// File: api/screenshot.js

const { chromium } = require('playwright-core');

// PERBAIKAN FINAL untuk mengatasi TypeError: getExecutablePath is not a function
const playwrightLambda = require('playwright-aws-lambda');
const getExecutablePath = playwrightLambda.getExecutablePath || (playwrightLambda.default && playwrightLambda.default.getExecutablePath);


// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
    const targetUrl = req.query.url;
    res.setHeader('Content-Type', 'image/png');

    // --- Validasi Input ---
    if (!targetUrl) {
        res.status(400).send('Parameter "url" wajib disertakan. Contoh: /api/screenshot?url=https://example.com');
        return;
    }
    
    // Validasi kritis: Pastikan fungsi Chromium tersedia sebelum mencoba meluncurkannya
    if (!getExecutablePath) {
        console.error("KRITIS: Fungsi getExecutablePath tidak dapat ditemukan. Cek instalasi playwright-aws-lambda.");
        res.status(500).send("Kesalahan konfigurasi: Fungsi vital untuk menjalankan Chromium tidak ditemukan.");
        return;
    }

    let browser;
    let screenshot;

    try {
        // 1. Panggil fungsi getExecutablePath
        const executablePath = await getExecutablePath();

        // 2. Luncurkan browser Chromium
        browser = await chromium.launch({
            executablePath,
            // Argumen ini sangat penting untuk kompatibilitas lingkungan Serverless
            args: [
                ...chromium.args, 
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--single-process', 
                '--no-zygote'
            ],
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 720 });

        // Navigasi ke URL (dengan timeout 15 detik)
        await page.goto(targetUrl, {
             waitUntil: 'networkidle', 
             timeout: 15000 
        });

        // Ambil screenshot halaman penuh
        screenshot = await page.screenshot({ 
            type: 'png',
            fullPage: true
        });

        // Kirim screenshot sebagai respons sukses (200 OK)
        res.status(200).send(screenshot);

    } catch (error) {
        // Tangani error dan kirimkan respons 500
        console.error('Error saat mengambil screenshot:', error);
        res.status(500).send(`Gagal mengambil screenshot: Pastikan URL valid. Detail Error: ${error.message}`);
    } finally {
        // Pastikan browser ditutup
        if (browser) {
            await browser.close();
        }
    }
};
