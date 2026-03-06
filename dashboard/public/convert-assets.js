#!/usr/bin/env node

/**
 * Convert SVG assets to PNG for social media compatibility
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node convert-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = __dirname;

const conversions = [
  {
    input: path.join(publicDir, 'og-image.svg'),
    output: path.join(publicDir, 'og-image.png'),
    width: 1200,
    height: 630,
    description: 'Open Graph social preview image'
  },
  {
    input: path.join(publicDir, 'apple-touch-icon.svg'),
    output: path.join(publicDir, 'apple-touch-icon.png'),
    width: 180,
    height: 180,
    description: 'Apple touch icon'
  }
];

async function convertAssets() {
  console.log('🎨 Converting ProofAid brand assets...\n');

  for (const conversion of conversions) {
    try {
      if (!fs.existsSync(conversion.input)) {
        console.log(`⚠️  Skipping ${path.basename(conversion.input)} - file not found`);
        continue;
      }

      await sharp(conversion.input)
        .resize(conversion.width, conversion.height)
        .png()
        .toFile(conversion.output);

      console.log(`✅ ${conversion.description}`);
      console.log(`   ${path.basename(conversion.input)} → ${path.basename(conversion.output)} (${conversion.width}x${conversion.height})`);
    } catch (error) {
      console.error(`❌ Failed to convert ${path.basename(conversion.input)}:`, error.message);
    }
  }

  console.log('\n✨ Conversion complete!');
  console.log('\nNext steps:');
  console.log('1. Test social previews at:');
  console.log('   - https://developers.facebook.com/tools/debug/');
  console.log('   - https://cards-dev.twitter.com/validator');
  console.log('2. Deploy updated assets to production');
}

convertAssets().catch(console.error);
