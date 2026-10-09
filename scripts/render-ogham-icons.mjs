import { chromium } from '@playwright/test';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const svgPath = path.resolve('public/favicon.svg');
const svg = readFileSync(svgPath, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(size, out) {
  await page.setViewportSize({ width: size, height: size });
  const sized = svg.replace('<svg', `<svg width="${size}" height="${size}"`);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#0b1220">${sized}</body></html>`,
  );
  const buf = await page.screenshot({ type: 'png', omitBackground: false });
  writeFileSync(out, buf);
  console.log('wrote', out, buf.length);
}

await render(192, 'public/icons/icon-192.png');
await render(512, 'public/icons/icon-512.png');
await browser.close();
