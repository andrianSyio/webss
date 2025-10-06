import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Masukkan parameter ?url=");

  try {
    // Launch Chromium (works in Vercel)
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:
        process.env.AWS_EXECUTION_ENV || process.env.VERCEL
          ? await chromium.executablePath()
          : puppeteer.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const screenshot = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(screenshot);
  } catch (error) {
    console.error("Screenshot Error:", error);
    res.status(500).send("Gagal mengambil screenshot: " + error.message);
  }
}
