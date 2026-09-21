import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const brainDir = 'C:/Users/avine/.gemini/antigravity-ide/brain/26b325d2-1e31-43cc-8ca5-b5a5f57adbac';
  const imgBuffer = fs.readFileSync(path.join(brainDir, 'reference_scallop_shape.png'));
  const base64Img = `data:image/png;base64,${imgBuffer.toString('base64')}`;
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><style>body { margin: 0; background: white; }</style></head>
      <body>
        <img id="ref" src="${base64Img}" />
      </body>
    </html>
  `);
  
  await page.waitForFunction(() => {
    const img = document.getElementById('ref');
    return img && img.complete && img.naturalWidth > 0;
  });
  
  const analysis = await page.evaluate(() => {
    const img = document.getElementById('ref');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    let sumX = 0, sumY = 0, count = 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (r > 210 && g > 80 && g < 160 && b > 90 && b < 170) {
          count++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    const centerX = sumX / count;
    const centerY = sumY / count;
    const radiusEstimate = (maxX - minX + maxY - minY) / 4;
    
    const radialProfile = [];
    for (let deg = 0; deg < 360; deg++) {
      const rad = (deg * Math.PI) / 180;
      let boundaryR = 0;
      for (let r = Math.floor(radiusEstimate * 0.7); r < radiusEstimate * 1.3; r++) {
        const px = Math.round(centerX + r * Math.cos(rad));
        const py = Math.round(centerY + r * Math.sin(rad));
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const idx = (py * canvas.width + px) * 4;
          const red = data[idx], green = data[idx+1], blue = data[idx+2];
          const isCoral = (red > 210 && green > 80 && green < 160 && blue > 90 && blue < 170);
          if (isCoral) {
            boundaryR = r;
          }
        }
      }
      radialProfile.push({ deg, r: boundaryR });
    }
    
    // Find peaks and valleys
    const peaks = [];
    const valleys = [];
    const N = radialProfile.length;
    for (let i = 0; i < N; i++) {
      const curr = radialProfile[i].r;
      let isPeak = true;
      let isValley = true;
      for (let w = -6; w <= 6; w++) {
        if (w === 0) continue;
        const neighbor = radialProfile[(i + w + N) % N].r;
        if (neighbor > curr) isPeak = false;
        if (neighbor < curr) isValley = false;
      }
      if (isPeak && !peaks.some(p => Math.abs(p.deg - i) < 15)) {
        peaks.push({ deg: i, r: curr });
      }
      if (isValley && !valleys.some(v => Math.abs(v.deg - i) < 15)) {
        valleys.push({ deg: i, r: curr });
      }
    }
    
    return {
      width: canvas.width,
      height: canvas.height,
      minX, maxX, minY, maxY,
      centerX, centerY,
      diameterX: maxX - minX,
      diameterY: maxY - minY,
      peakCount: peaks.length,
      peaks,
      valleyCount: valleys.length,
      valleys,
    };
  });
  
  console.log('Analysis results:');
  console.log('Image dimensions:', analysis.width, 'x', analysis.height);
  console.log('Cookie bounds: X', analysis.minX, '..', analysis.maxX, 'Y', analysis.minY, '..', analysis.maxY);
  console.log('Center:', analysis.centerX.toFixed(1), ',', analysis.centerY.toFixed(1));
  console.log('Diameters: X =', analysis.diameterX, ', Y =', analysis.diameterY);
  console.log('Peak count:', analysis.peakCount);
  console.log('Peaks (deg, r):', analysis.peaks);
  console.log('Valley count:', analysis.valleyCount);
  console.log('Valleys (deg, r):', analysis.valleys);
  
  if (analysis.peaks.length > 0 && analysis.valleys.length > 0) {
    const avgPeakR = analysis.peaks.reduce((acc, p) => acc + p.r, 0) / analysis.peaks.length;
    const avgValleyR = analysis.valleys.reduce((acc, v) => acc + v.r, 0) / analysis.valleys.length;
    const kMeasured = (avgPeakR - avgValleyR) / (avgPeakR + avgValleyR);
    console.log('Average Peak Radius:', avgPeakR.toFixed(2));
    console.log('Average Valley Radius:', avgValleyR.toFixed(2));
    console.log('Measured k (depth fraction):', kMeasured.toFixed(4));
  }
  
  await browser.close();
}

main().catch(console.error);
