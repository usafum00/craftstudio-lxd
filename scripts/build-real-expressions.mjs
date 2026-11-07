import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CHAR_OUTPUT_DIR = path.join(PUBLIC_DIR, 'characters');
const UPLOADS_CHAR_DIR = path.join(PUBLIC_DIR, 'uploads/characters');
const AUTHENTIC_DIR = path.join(PUBLIC_DIR, 'uploads/authentic_cutouts');

// Ensure output directories exist
if (!fs.existsSync(CHAR_OUTPUT_DIR)) {
  fs.mkdirSync(CHAR_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_CHAR_DIR)) {
  fs.mkdirSync(UPLOADS_CHAR_DIR, { recursive: true });
}

// Authentic Articulate Rise Cutout Definitions
const AUTHENTIC_SETS = {
  jet: {
    id: 'char-jet',
    name: 'Jet',
    gender: 'male',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Product Success Manager & Solutions Architect',
    poses: {
      neutral: '152_full.png',
      happy: '151_full.png',
      talking: '165_full.png',
      worried: '175_full.png',
      frustrated: '201_full.png',
      confused: '166_full.png',
      presenting: '189_full.png'
    }
  },
  terri: {
    id: 'char-terri',
    name: 'Terri',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'VP Enterprise Operations & People Strategy',
    poses: {
      neutral: '337_full.png',
      happy: '338_full.png',
      talking: '396_full.png',
      worried: '428_full.png',
      frustrated: '440_full.png',
      confused: '409_full.png',
      presenting: '392_full.png'
    }
  },
  jeremy: {
    id: 'char-jeremy',
    name: 'Jeremy',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Enterprise Strategy Director & Compliance Lead',
    poses: {
      neutral: '564_full.png',
      happy: '565_full.png',
      talking: '576_full.png',
      worried: '504_full.png',
      frustrated: '516_full.png',
      confused: '485_full.png',
      presenting: '577_full.png'
    }
  }
};

/**
 * Creates an SVG gradient feather mask for smooth waist fading on half-body crops
 */
function createWaistFadeSvg(width, height) {
  const solidStop = 0.78;
  return Buffer.from(`
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff" stop-opacity="1" />
          <stop offset="${solidStop * 100}%" stop-color="#fff" stop-opacity="1" />
          <stop offset="92%" stop-color="#fff" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#fade)" />
    </svg>
  `);
}

/**
 * Generates waist-up crop from full-body 2048px cutout with waist fade
 */
async function processPose(srcPath, outDir, key, poseName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file missing: ${srcPath}`);
  }

  const fullImg = sharp(srcPath).ensureAlpha();
  const meta = await fullImg.metadata();
  const width = meta.width;
  const height = meta.height;

  // 1. Save Full-Body standing pose (scaled to max height 1024 for clean web delivery)
  const fullBodyTargetHeight = Math.min(height, 1024);
  const fullBodyBuf = await sharp(srcPath)
    .resize({ height: fullBodyTargetHeight })
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const fullBodyPath = path.join(outDir, `${poseName}-full.png`);
  fs.writeFileSync(fullBodyPath, fullBodyBuf);

  // Mirror to uploads/characters
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${key}-${poseName}-full.png`), fullBodyBuf);

  // 2. Crop to waist-up: top 62% of the body
  const waistCropHeight = Math.round(height * 0.62);
  const cropped = await sharp(srcPath)
    .extract({ left: 0, top: 0, width, height: waistCropHeight })
    .resize({ height: 600 })
    .toBuffer();

  const croppedMeta = await sharp(cropped).metadata();
  const maskSvg = createWaistFadeSvg(croppedMeta.width, croppedMeta.height);

  // Composite waist-fade mask
  const halfBodyBuf = await sharp(cropped)
    .composite([
      {
        input: maskSvg,
        blend: 'dest-in'
      }
    ])
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const halfBodyPath = path.join(outDir, `${poseName}.png`);
  fs.writeFileSync(halfBodyPath, halfBodyBuf);

  // Also write {poseName}-half.png alias
  const halfAliasPath = path.join(outDir, `${poseName}-half.png`);
  fs.writeFileSync(halfAliasPath, halfBodyBuf);

  // Mirror to uploads/characters
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${key}-${poseName}-half.png`), halfBodyBuf);
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${key}-${poseName}.png`), halfBodyBuf);

  return {
    fullHash: crypto.createHash('sha256').update(fullBodyBuf).digest('hex'),
    halfHash: crypto.createHash('sha256').update(halfBodyBuf).digest('hex'),
    fullSize: fullBodyBuf.length,
    halfSize: halfBodyBuf.length
  };
}

/**
 * Verifies that a generated image has alpha = 0 transparent background pixels
 */
async function verifyAlphaTransparency(filePath) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels < 4) {
    throw new Error(`Image ${filePath} lacks alpha channel!`);
  }

  // Count true transparent pixels (alpha === 0)
  let transparentPixelCount = 0;
  for (let i = 3; i < data.length; i += channels) {
    if (data[i] === 0) {
      transparentPixelCount++;
    }
  }

  const transparencyRatio = transparentPixelCount / (width * height);
  if (transparencyRatio < 0.15) {
    throw new Error(`Image ${filePath} does not appear to have transparent background (only ${(transparencyRatio * 100).toFixed(1)}% transparent)`);
  }

  return {
    width,
    height,
    transparentPixels: transparentPixelCount,
    ratio: transparencyRatio
  };
}

async function main() {
  console.log('=== Building Real Character Expressions & Cutout Library ===');

  const processedCharacters = [];

  for (const [key, charDef] of Object.entries(AUTHENTIC_SETS)) {
    console.log(`\nProcessing character: ${charDef.name} (${charDef.id})...`);
    const charDir = path.join(CHAR_OUTPUT_DIR, key);
    if (!fs.existsSync(charDir)) {
      fs.mkdirSync(charDir, { recursive: true });
    }

    const hashes = new Set();
    const poseResults = {};

    for (const [pose, filename] of Object.entries(charDef.poses)) {
      const srcPath = path.join(AUTHENTIC_DIR, filename);
      const res = await processPose(srcPath, charDir, key, pose);
      
      if (hashes.has(res.halfHash)) {
        throw new Error(`Duplicate hash detected for ${charDef.name} pose ${pose}! Expressions must be visually distinct.`);
      }
      hashes.add(res.halfHash);

      // Verify transparency
      const alphaRes = await verifyAlphaTransparency(path.join(charDir, `${pose}.png`));
      
      console.log(`  ✓ Pose '${pose}': ${alphaRes.width}x${alphaRes.height}, ${(alphaRes.ratio * 100).toFixed(1)}% transparent, SHA: ${res.halfHash.slice(0, 10)}...`);
      poseResults[pose] = {
        halfUrl: `/characters/${key}/${pose}.png`,
        fullUrl: `/characters/${key}/${pose}-full.png`,
        hash: res.halfHash
      };
    }

    processedCharacters.push({
      id: charDef.id,
      name: charDef.name,
      folder: key,
      gender: charDef.gender,
      clothing: charDef.clothing,
      ageGroup: charDef.ageGroup,
      ethnicity: charDef.ethnicity,
      role: charDef.role,
      poses: poseResults
    });
  }

  console.log('\n=== All authentic expressions successfully verified! ===');
  console.log(`Generated 6+ distinct expressions each for ${processedCharacters.length} characters.`);
  
  // Output JSON report for integration
  const manifestPath = path.join(CHAR_OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(processedCharacters, null, 2));
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch(err => {
  console.error('Fatal error during expression generation:', err);
  process.exit(1);
});
