// Saves the public pages as PDF (phone and computer widths) in design/canva/, to import into Canva:
// Canva opens a PDF with editable text and images. The site must be running on http://localhost:8010.
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'web', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, '..', 'design', 'canva');
const BASE = process.env.SITE_URL || 'http://localhost:8010';
const pages = [['accueil', '/'], ['nos-espaces', '/connexion'], ['notre-equipe', '/equipe']];
const sizes = [['telephone', 390, 844], ['ordinateur', 1440, 900]];

(async () => {
  const browser = await chromium.launch();
  for (const [name, url] of pages) {
    for (const [device, width, height] of sizes) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; });
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      const full = await page.evaluate(() => document.documentElement.scrollHeight);
      const file = path.join(OUT, `${name}-${device}.pdf`);
      await page.pdf({ path: file, width: `${width}px`, height: `${full}px`, printBackground: true, pageRanges: '1' });
      console.log('✓', path.relative(process.cwd(), file));
      await page.close();
    }
  }
  await browser.close();
})();
