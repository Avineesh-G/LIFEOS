import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a smooth closed SVG path for a 12-lobed scallop
 * Polar formula: r(theta) = R * (1 + k * cos(12 * theta))
 * Sampled across 240+ points and smoothed with cubic Bezier splines
 */
export function generateScallopPath(n = 12, k = 0.07, samples = 240) {
  // Normalize inside a 100 x 100 viewBox with center at (50, 50)
  // Max radius is R * (1 + k). We want max radius = 50.
  const R = 50 / (1 + k);
  const cx = 50;
  const cy = 50;
  
  const points = [];
  for (let i = 0; i < samples; i++) {
    // Phase shift so lobe peak is at 15 deg (or top is symmetric)
    // For n=12, lobes are every 30 deg. If phase is 0, peaks are at 0, 30, 60...
    const theta = (i / samples) * 2 * Math.PI;
    const r = R * (1 + k * Math.cos(n * theta));
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    points.push({ x, y });
  }

  // Generate cubic Bezier segments using Catmull-Rom to Cubic Bezier conversion
  // for a smooth, high-fidelity curve
  let d = `M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`;
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p0 = points[(i - 1 + len) % len];
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    const p3 = points[(i + 2) % len];

    // Catmull-Rom to Cubic Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(3)} ${cp1y.toFixed(3)}, ${cp2x.toFixed(3)} ${cp2y.toFixed(3)}, ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
  }

  d += ' Z';
  return d;
}

async function runComparison() {
  const brainDir = 'C:/Users/avine/.gemini/antigravity-ide/brain/26b325d2-1e31-43cc-8ca5-b5a5f57adbac';
  const imgBuffer = fs.readFileSync(path.join(brainDir, 'reference_scallop_shape.png'));
  const base64Ref = `data:image/png;base64,${imgBuffer.toString('base64')}`;
  
  const path_k07 = generateScallopPath(12, 0.07, 240);
  const path_k08 = generateScallopPath(12, 0.08, 240);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 900, height: 750 });
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #F0F4F8;
            padding: 24px;
            margin: 0;
            color: #1A1A1F;
          }
          h2 { margin: 0 0 16px 0; font-size: 20px; }
          .row { display: flex; gap: 24px; align-items: center; margin-bottom: 24px; background: white; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          .label { width: 140px; font-weight: 600; font-size: 14px; }
          .card { display: flex; flex-direction: column; align-items: center; gap: 8px; }
          .card span { font-size: 12px; color: #666; }
          .overlay-container { position: relative; width: 200px; height: 200px; }
          .overlay-img { position: absolute; top: 0; left: 0; width: 200px; height: 200px; object-fit: contain; opacity: 0.65; }
          .overlay-svg { position: absolute; top: 0; left: 0; width: 200px; height: 200px; }
        </style>
      </head>
      <body>
        <h2>Scallop Shape Proof-of-Match Comparison (12 Lobes, k = 0.07)</h2>
        
        <div class="row">
          <div class="label">48px (Active Indicator)</div>
          <div class="card">
            <svg width="48" height="48" viewBox="0 0 100 100">
              <path d="${path_k07}" fill="#E11D48" />
            </svg>
            <span>Generated (Gym #E11D48)</span>
          </div>
          <div class="card">
            <svg width="48" height="48" viewBox="0 0 100 100">
              <path d="${path_k07}" fill="#2563EB" />
            </svg>
            <span>Generated (Home #2563EB)</span>
          </div>
          <div class="card">
            <img src="${base64Ref}" style="width: 48px; height: 48px; object-fit: contain;" />
            <span>Reference (48px)</span>
          </div>
        </div>

        <div class="row">
          <div class="label">60px (More Button)</div>
          <div class="card">
            <svg width="60" height="60" viewBox="0 0 100 100">
              <path d="${path_k07}" fill="#1B1C22" />
            </svg>
            <span>Light More (#1B1C22)</span>
          </div>
          <div class="card">
            <svg width="60" height="60" viewBox="0 0 100 100">
              <path d="${path_k07}" fill="#E6E4EE" stroke="#1B1C22" stroke-width="1.5" />
            </svg>
            <span>Dark More (#E6E4EE)</span>
          </div>
          <div class="card">
            <img src="${base64Ref}" style="width: 60px; height: 60px; object-fit: contain;" />
            <span>Reference (60px)</span>
          </div>
        </div>

        <div class="row">
          <div class="label">200px Overlay & Contour Match</div>
          <div class="card">
            <svg width="200" height="200" viewBox="0 0 100 100">
              <path d="${path_k07}" fill="#FF6584" />
            </svg>
            <span>Generated 200px (Coral)</span>
          </div>
          <div class="card">
            <img src="${base64Ref}" style="width: 200px; height: 200px; object-fit: contain;" />
            <span>Reference 200px</span>
          </div>
          <div class="card">
            <div class="overlay-container">
              <img src="${base64Ref}" class="overlay-img" />
              <svg width="200" height="200" viewBox="0 0 100 100" class="overlay-svg">
                <path d="${path_k07}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-dasharray="4 2" />
              </svg>
            </div>
            <span>Overlay (Blue Dashed on Reference)</span>
          </div>
        </div>
      </body>
    </html>
  `);
  
  const outputPath = path.join(brainDir, 'scallop_comparison.png');
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`Saved proof-of-match comparison image to: ${outputPath}`);
  
  // Also log the path string
  console.log('\n--- Final Static Path String (k = 0.07, 12 lobes) ---');
  console.log(path_k07);
  
  fs.writeFileSync(path.join(brainDir, 'scallop_path.txt'), path_k07);
  
  await browser.close();
}

runComparison().catch(console.error);
