const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const imagesDir = path.join(__dirname, '../public/images');

// Ensure directories exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#grad)"/>
  <path d="M358 102H230c-22 0-40 18-40 40v228c0 22 18 40 40 40h152c22 0 40-18 40-40V180l-64-78z" fill="white"/>
  <path d="M358 102v78h64" fill="none" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <path d="M262 270h96M262 330h64" stroke="#ef4444" stroke-width="20" stroke-linecap="round"/>
  <circle cx="160" cy="400" r="40" fill="#22c55e"/>
</svg>`;

const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fef2f2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fff7ed;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  
  <!-- Logo Icon -->
  <g transform="translate(100, 215)">
    <rect width="200" height="200" rx="40" fill="url(#iconGrad)"/>
    <path d="M140 40H90c-8 0-15 7-15 15v90c0 8 7 15 15 15h60c8 0 15-7 15-15V70l-25-30z" fill="white"/>
    <path d="M140 40v30h25" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>
    <path d="M102 105h38M102 130h25" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
    <circle cx="62" cy="155" r="16" fill="#22c55e"/>
  </g>
  
  <!-- Text -->
  <text x="340" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="#111827">AdobeWork</text>
  <text x="340" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="#6b7280">Free Online PDF &amp; Image Tools</text>
  <text x="340" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#9ca3af">Convert • Compress • Merge • Edit • 50+ Tools</text>
  
  <!-- URL -->
  <text x="340" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#ef4444">adobework.in</text>
</svg>`;

async function generateIcons() {
  try {
    // Generate PWA icons
    console.log('Generating icon-192x192.png...');
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));

    console.log('Generating icon-512x512.png...');
    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));

    console.log('Generating apple-touch-icon.png...');
    await sharp(Buffer.from(svgIcon))
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

    // Generate OG image
    console.log('Generating og-image.png...');
    await sharp(Buffer.from(ogImageSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(imagesDir, 'og-image.png'));

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
