import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Masukkan parameter ?url=https://...");

  try {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const image = await page.screenshot({ type: "png", fullPage: true });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(image);
  } catch (err) {
    console.error("Screenshot Error:", err);
    res.status(500).send("Gagal mengambil screenshot: " + err.message);
  }
}
