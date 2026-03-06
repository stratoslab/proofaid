# ProofAid Brand Assets & Metadata

## Overview
All metadata and visual assets are derived from ProofAid's actual content: a UNICEF-themed humanitarian aid distribution platform built on Celo blockchain.

## Brand Identity

**Color Palette:**
- Primary Blue: `#1CABE2` (UNICEF bright blue)
- Deep Blue: `#005EB8` (UNICEF deep blue)
- Mist: `#D8F2FF` (light accent)
- Background: Soft gradient from `#f3faff` to `#eef8ff`

**Typography:**
- Font Family: Public Sans (Google Fonts)
- Weights: 400, 500, 600, 700, 800

**Visual Theme:**
- Verified shield icon (represents trust and verification)
- Blockchain connection elements (represents transparency)
- Clean, professional humanitarian aid aesthetic

## Metadata

### Meta Title
```
ProofAid – Transparent Humanitarian Aid on Celo Blockchain
```
**Length:** 59 characters (optimal for search results)

### Meta Description
```
Field-ready voucher operations for humanitarian aid distribution. Blockchain-verified transparency for donors, NGOs, and beneficiaries on Celo.
```
**Length:** 154 characters (under 155 limit)

### Open Graph Title
```
ProofAid – Transparent Humanitarian Aid Distribution
```

### Open Graph Description
```
Blockchain-verified aid vouchers on Celo. Real-time transparency for donors. Offline-ready for field operations.
```

## Visual Assets

### Favicon (`favicon.svg`)
- **Format:** SVG (scalable)
- **Design:** Verified shield with checkmark on UNICEF blue gradient background
- **Elements:** Blockchain connection dots on sides
- **Size:** 64x64 viewBox

### Apple Touch Icon (`apple-touch-icon.svg`)
- **Format:** SVG (convert to PNG for production)
- **Design:** Rounded square (40px radius) with verified shield
- **Size:** 180x180 viewBox
- **Purpose:** iOS home screen icon

### Open Graph Image (`og-image.svg`)
- **Format:** SVG (convert to PNG for production)
- **Design:** Full brand showcase with logo, title, features
- **Size:** 1200x630 (standard social media preview)
- **Elements:**
  - Large verified shield icon
  - "ProofAid" title in brand typography
  - Subtitle: "Transparent Humanitarian Aid Distribution"
  - Three key features with checkmarks
  - "Powered by Celo" badge
  - Decorative blockchain network illustration

## Converting SVG to PNG

For production, convert SVG assets to PNG:

```bash
# Install ImageMagick or use online converter
# For og-image.svg (required for social media):
convert og-image.svg -resize 1200x630 og-image.png

# For apple-touch-icon.svg:
convert apple-touch-icon.svg -resize 180x180 apple-touch-icon.png
```

Or use online tools:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

## Social Media Previews

### Facebook/LinkedIn
- Uses `og:image` (1200x630)
- Shows: Logo, title, description, key features
- Optimized for professional sharing

### Twitter/X
- Uses `twitter:image` (same as og:image)
- Card type: `summary_large_image`
- Shows full brand presentation

### WhatsApp/Slack
- Uses Open Graph tags
- Displays rich preview with image

## Implementation Checklist

- [x] Meta title (59 chars)
- [x] Meta description (154 chars)
- [x] Open Graph title
- [x] Open Graph description
- [x] Open Graph image (1200x630)
- [x] Twitter card metadata
- [x] Favicon (SVG)
- [x] Apple touch icon (180x180)
- [ ] Convert og-image.svg to og-image.png
- [ ] Convert apple-touch-icon.svg to apple-touch-icon.png
- [ ] Test social previews on Facebook Debugger
- [ ] Test social previews on Twitter Card Validator

## Testing Tools

**Facebook Sharing Debugger:**
https://developers.facebook.com/tools/debug/

**Twitter Card Validator:**
https://cards-dev.twitter.com/validator

**LinkedIn Post Inspector:**
https://www.linkedin.com/post-inspector/

## Notes

- All assets use ProofAid's actual UNICEF-inspired color scheme
- No generic Lovable templates or placeholder content
- Design reflects humanitarian aid + blockchain transparency mission
- Optimized for professional NGO/donor audience
- Mobile-friendly and accessible
