import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url, width, height, fullPage, format } = req.query;
  if (!url) return res.status(400).json({ error: "Masukkan parameter ?url=https://..." });

  try {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: parseInt(width) || 1280,
        height: parseInt(height) || 720,
      },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const image = await page.screenshot({
      type: format === "jpeg" ? "jpeg" : "png",
      fullPage: fullPage === "true",
    });

    await browser.close();

    res.setHeader("Content-Type", `image/${format === "jpeg" ? "jpeg" : "png"}`);
    res.send(image);
  } catch (error) {
    console.error("Screenshot Error:", error);
    res.status(500).json({ error: error.message });
  }
}
