# Favicon Files for ConvertKing MVP

This directory contains favicon files for the ConvertKing MVP application.

## Current Files

- ✅ `favicon.svg` - SVG favicon (works in modern browsers)
- ✅ `site.webmanifest` - Web app manifest file
- ⚠️ `favicon-96x96.png` - **Needs to be generated**
- ⚠️ `favicon.ico` - **Needs to be generated**
- ⚠️ `apple-touch-icon.png` - **Needs to be generated**

## How to Generate Missing Favicon Files

### Option 1: Using RealFaviconGenerator (Recommended)

1. Visit: https://realfavicongenerator.net/
2. Upload the `favicon.svg` file
3. Configure settings:
   - iOS: 180x180 for Apple Touch Icon
   - Android: 96x96 for standard favicon
   - Windows: Generate ICO file
4. Download the generated files
5. Place them in the `client/public/` directory

### Option 2: Using Favicon.io

1. Visit: https://favicon.io/
2. Upload the `favicon.svg` file
3. Generate favicons
4. Download and extract to `client/public/`

### Option 3: Manual Creation

Use an image editor (Photoshop, GIMP, Figma) to:

1. Open `favicon.svg`
2. Export as PNG:
   - `favicon-96x96.png` (96x96 pixels)
   - `apple-touch-icon.png` (180x180 pixels)
3. Convert to ICO:
   - `favicon.ico` (16x16, 32x32, 48x48 sizes)

### Option 4: Using Command Line (if you have ImageMagick)

```bash
# Generate PNG files
convert favicon.svg -resize 96x96 favicon-96x96.png
convert favicon.svg -resize 180x180 apple-touch-icon.png

# Generate ICO file
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 48x48 favicon-48x48.png
convert favicon-16x16.png favicon-32x32.png favicon-48x48.png favicon.ico
```

## Temporary Solution

For now, the SVG favicon will work in modern browsers. The PNG and ICO files are optional but recommended for:
- Better browser compatibility
- iOS home screen icons
- Windows taskbar icons
- Older browser support

## Crown Icon Design

The favicon features a gold/orange-yellow crown on a black background, matching the ConvertKing MVP branding:
- **Color**: #FFA500 (Orange-Yellow/Gold)
- **Background**: #000000 (Black)
- **Style**: Minimalist, flat design with three prominent peaks
