# Icon Generation Guide

## Required Images

You need to create these images for PWA and SEO:

### 1. PWA Icons (from icon.svg)
- `/public/icons/icon-192x192.png` - 192x192px
- `/public/icons/icon-512x512.png` - 512x512px
- `/public/icons/apple-touch-icon.png` - 180x180px

### 2. Social Sharing Image
- `/public/images/og-image.png` - 1200x630px

## How to Generate

### Option 1: Online Tools (Easiest)

1. **For PWA Icons:**
   - Go to https://realfavicongenerator.net/
   - Upload the `icon.svg` file from `/public/icons/`
   - Download the generated icons
   - Place them in `/public/icons/`

2. **For OG Image:**
   - Use Canva (https://canva.com) - Create 1200x630px design
   - Or use https://og-playground.vercel.app/

### Option 2: Using Sharp (Node.js)

```bash
npm install sharp --save-dev
```

Then run:
```javascript
const sharp = require('sharp');

// Generate 192x192
sharp('public/icons/icon.svg')
  .resize(192, 192)
  .png()
  .toFile('public/icons/icon-192x192.png');

// Generate 512x512
sharp('public/icons/icon.svg')
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-512x512.png');

// Generate Apple Touch Icon
sharp('public/icons/icon.svg')
  .resize(180, 180)
  .png()
  .toFile('public/icons/apple-touch-icon.png');
```

### Option 3: Using ImageMagick (CLI)

```bash
# Install ImageMagick first
brew install imagemagick  # macOS

# Generate icons
convert -background none -resize 192x192 public/icons/icon.svg public/icons/icon-192x192.png
convert -background none -resize 512x512 public/icons/icon.svg public/icons/icon-512x512.png
convert -background none -resize 180x180 public/icons/icon.svg public/icons/apple-touch-icon.png
```

## OG Image Design Tips

For the social sharing image (og-image.png), include:
- AdobeWork logo
- Tagline: "Free Online PDF & Image Tools"
- Brand colors (red/orange gradient)
- Size: 1200x630px

## Quick Placeholder (Temporary)

If you need placeholders quickly, the site will work without these images - they're just for better SEO and PWA support.
