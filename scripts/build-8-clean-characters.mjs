import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CHAR_OUTPUT_DIR = path.join(PUBLIC_DIR, 'characters');
const UPLOADS_CHAR_DIR = path.join(PUBLIC_DIR, 'uploads/characters');
const AUTHENTIC_DIR = path.join(PUBLIC_DIR, 'uploads/authentic_cutouts');
const DB_PATH = path.join(ROOT_DIR, 'data/rise.db');

// Ensure directories exist
if (!fs.existsSync(CHAR_OUTPUT_DIR)) fs.mkdirSync(CHAR_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_CHAR_DIR)) fs.mkdirSync(UPLOADS_CHAR_DIR, { recursive: true });

// 1. HARD-WIPE BROKEN CHARACTER FILES
console.log('=== Step 1: Purging broken character images & hard-wiping SQLite ===');

const BROKEN_PREFIXES = [
  'char-amara', 'char-andrea', 'char-antonio', 'char-carlos', 'char-chen',
  'char-craig', 'char-david', 'char-deshaun', 'char-elena', 'char-elizabeth',
  'char-emily', 'char-fatima', 'char-gianna', 'char-jonathan', 'char-joseph',
  'char-kofi', 'char-lange', 'char-laura', 'char-maya', 'char-priya',
  'char-renita', 'char-robert', 'char-soren', 'char-tony'
];

let deletedCount = 0;
for (const p of BROKEN_PREFIXES) {
  const filePath = path.join(UPLOADS_CHAR_DIR, `${p}.png`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      deletedCount++;
    } catch (e) {
      console.warn(`Could not delete ${filePath}:`, e.message);
    }
  }
}
console.log(`Deleted ${deletedCount} broken character slice images from uploads/characters`);

// Clean old folders in public/characters
const existingFolders = fs.readdirSync(CHAR_OUTPUT_DIR, { withFileTypes: true });
for (const dirent of existingFolders) {
  if (dirent.isDirectory()) {
    const dirPath = path.join(CHAR_OUTPUT_DIR, dirent.name);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Hard-wipe SQLite table
try {
  const db = new Database(DB_PATH);
  db.prepare('DELETE FROM characters').run();
  console.log('Successfully wiped characters table in data/rise.db');
  db.close();
} catch (err) {
  console.warn('SQLite hard-wipe warning (database might not exist yet):', err.message);
}

// 2. CURATED ROSTER OF 8 FLAGSHIP CHARACTERS
const FLAGSHIP_CHARACTERS = [
  {
    id: 'char-jet',
    name: 'Jet',
    gender: 'male',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Product Success Manager & Solutions Architect',
    folder: 'jet',
    poses: {
      neutral: '152_full.png',
      happy: '151_full.png',
      talking: '165_full.png',
      worried: '175_full.png',
      frustrated: '201_full.png',
      confused: '166_full.png',
      presenting: '189_full.png',
    },
  },
  {
    id: 'char-terri',
    name: 'Terri',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'VP Enterprise Operations & People Strategy',
    folder: 'terri',
    poses: {
      neutral: '337_full.png',
      happy: '338_full.png',
      talking: '396_full.png',
      worried: '428_full.png',
      frustrated: '440_full.png',
      confused: '409_full.png',
      presenting: '392_full.png',
    },
  },
  {
    id: 'char-jeremy',
    name: 'Jeremy',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Enterprise Strategy Director & Compliance Lead',
    folder: 'jeremy',
    poses: {
      neutral: '564_full.png',
      happy: '565_full.png',
      talking: '576_full.png',
      worried: '504_full.png',
      frustrated: '516_full.png',
      confused: '485_full.png',
      presenting: '577_full.png',
    },
  },
  {
    id: 'char-elena',
    name: 'Dr. Elena Ramos',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'Latina',
    role: 'Chief Medical Officer & Clinical Specialist',
    folder: 'elena',
    poses: {
      neutral: '439_full.png',
      happy: '415_full.png',
      talking: '406_full.png',
      worried: '443_full.png',
      frustrated: '445_full.png',
      confused: '428_full.png',
      presenting: '392_full.png',
    },
    attire: 'medical',
  },
  {
    id: 'char-marcus',
    name: 'Marcus Vance',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Lead Industrial Safety Engineer & Field Inspector',
    folder: 'marcus',
    poses: {
      neutral: '184_full.png',
      happy: '178_full.png',
      talking: '188_full.png',
      worried: '195_full.png',
      frustrated: '204_full.png',
      confused: '208_full.png',
      presenting: '156_full.png',
    },
    attire: 'industry',
  },
  {
    id: 'char-maya',
    name: 'Maya Patel',
    gender: 'female',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Lead UX Designer & Creative Technologist',
    folder: 'maya',
    poses: {
      neutral: '103_full.png',
      happy: '104_full.png',
      talking: '168_full.png',
      worried: '209_full.png',
      frustrated: '201_full.png',
      confused: '166_full.png',
      presenting: '189_full.png',
    },
    attire: 'casual',
  },
  {
    id: 'char-arthur',
    name: 'Arthur Sterling',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Executive Managing Partner & Board Advisor',
    folder: 'arthur',
    poses: {
      neutral: '467_full.png',
      happy: '473_full.png',
      talking: '478_full.png',
      worried: '488_full.png',
      frustrated: '518_full.png',
      confused: '588_full.png',
      presenting: '479_full.png',
    },
    attire: 'senior_corporate',
  },
  {
    id: 'char-sarah',
    name: 'Sarah Jenkins',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '40s_50s',
    ethnicity: 'White',
    role: 'Director of People Operations & Talent Development',
    folder: 'sarah',
    poses: {
      neutral: '337_full.png',
      happy: '338_full.png',
      talking: '396_full.png',
      worried: '409_full.png',
      frustrated: '440_full.png',
      confused: '428_full.png',
      presenting: '392_full.png',
    },
    attire: 'business_casual',
  },
];

/**
 * Creates SVG gradient feather mask for smooth waist fading on half-body crops
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
 * Creates sector attire overlay (medical scrubs badge/stethoscope, safety hard hat/vest)
 */
function createAttireSvg(attire, width, height) {
  if (!attire) return null;

  if (attire === 'medical') {
    // Clinical stethoscope & medical badge overlay
    return Buffer.from(`
      <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="scrubGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#0369a1" stop-opacity="0.25" />
          </linearGradient>
        </defs>
        <!-- Stethoscope tube around neck -->
        <path d="M ${width * 0.42} ${height * 0.22} C ${width * 0.38} ${height * 0.30}, ${width * 0.40} ${height * 0.42}, ${width * 0.48} ${height * 0.44} C ${width * 0.56} ${height * 0.42}, ${width * 0.58} ${height * 0.30}, ${width * 0.54} ${height * 0.22}" fill="none" stroke="#334155" stroke-width="4.5" stroke-linecap="round" />
        <circle cx="${width * 0.48}" cy="${height * 0.44}" r="8" fill="#64748b" stroke="#334155" stroke-width="2.5" />
        <circle cx="${width * 0.48}" cy="${height * 0.44}" r="4" fill="#94a3b8" />
        <!-- Clinical ID badge -->
        <rect x="${width * 0.36}" y="${height * 0.34}" width="28" height="38" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        <rect x="${width * 0.38}" y="${height * 0.36}" width="24" height="6" fill="#0284c7" />
        <line x1="${width * 0.38}" y1="${height * 0.45}" x2="${width * 0.38 + 18}" y2="${height * 0.45}" stroke="#64748b" stroke-width="2" />
        <line x1="${width * 0.38}" y1="${height * 0.48}" x2="${width * 0.38 + 14}" y2="${height * 0.48}" stroke="#94a3b8" stroke-width="1.5" />
      </svg>
    `);
  }

  if (attire === 'industry') {
    // High-visibility safety vest accents & industrial safety badge
    return Buffer.from(`
      <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <!-- High-vis safety stripes -->
        <path d="M ${width * 0.32} ${height * 0.26} L ${width * 0.36} ${height * 0.60}" stroke="#facc15" stroke-width="10" stroke-opacity="0.85" />
        <path d="M ${width * 0.64} ${height * 0.26} L ${width * 0.60} ${height * 0.60}" stroke="#facc15" stroke-width="10" stroke-opacity="0.85" />
        <path d="M ${width * 0.33} ${height * 0.26} L ${width * 0.37} ${height * 0.60}" stroke="#ffffff" stroke-width="4" stroke-opacity="0.9" />
        <path d="M ${width * 0.63} ${height * 0.26} L ${width * 0.59} ${height * 0.60}" stroke="#ffffff" stroke-width="4" stroke-opacity="0.9" />
        <!-- Horizontal reflector bar -->
        <line x1="${width * 0.30}" y1="${height * 0.48}" x2="${width * 0.66}" y2="${height * 0.48}" stroke="#facc15" stroke-width="8" stroke-opacity="0.85" />
        <line x1="${width * 0.30}" y1="${height * 0.48}" x2="${width * 0.66}" y2="${height * 0.48}" stroke="#ffffff" stroke-width="3" stroke-opacity="0.9" />
        <!-- Safety inspector credential -->
        <rect x="${width * 0.38}" y="${height * 0.33}" width="26" height="34" rx="2" fill="#ffffff" stroke="#eab308" stroke-width="1.5" />
        <rect x="${width * 0.40}" y="${height * 0.35}" width="22" height="6" fill="#ea580c" />
      </svg>
    `);
  }

  if (attire === 'senior_corporate') {
    // Executive wireframe glasses and silk pocket square
    return Buffer.from(`
      <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <!-- Wireframe reading glasses on face bridge -->
        <ellipse cx="${width * 0.46}" cy="${height * 0.16}" rx="12" ry="9" fill="none" stroke="#71717a" stroke-width="1.8" />
        <ellipse cx="${width * 0.54}" cy="${height * 0.16}" rx="12" ry="9" fill="none" stroke="#71717a" stroke-width="1.8" />
        <line x1="${width * 0.48}" y1="${height * 0.16}" x2="${width * 0.52}" y2="${height * 0.16}" stroke="#71717a" stroke-width="1.8" />
        <line x1="${width * 0.44}" y1="${height * 0.16}" x2="${width * 0.38}" y2="${height * 0.155}" stroke="#71717a" stroke-width="1.5" />
        <line x1="${width * 0.56}" y1="${height * 0.16}" x2="${width * 0.62}" y2="${height * 0.155}" stroke="#71717a" stroke-width="1.5" />
        <!-- Crisp white pocket square -->
        <polygon points="${width * 0.38},${height * 0.38} ${width * 0.42},${height * 0.36} ${width * 0.44},${height * 0.385}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
      </svg>
    `);
  }

  if (attire === 'casual') {
    // Creative stylish tortoise-shell specs & subtle lanyard
    return Buffer.from(`
      <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${width * 0.46}" cy="${height * 0.16}" rx="13" ry="10" fill="none" stroke="#475569" stroke-width="2" />
        <ellipse cx="${width * 0.54}" cy="${height * 0.16}" rx="13" ry="10" fill="none" stroke="#475569" stroke-width="2" />
        <line x1="${width * 0.48}" y1="${height * 0.16}" x2="${width * 0.52}" y2="${height * 0.16}" stroke="#475569" stroke-width="2" />
        <!-- Tech badge lanyard -->
        <path d="M ${width * 0.44} ${height * 0.22} L ${width * 0.48} ${height * 0.42} L ${width * 0.52} ${height * 0.22}" fill="none" stroke="#6366f1" stroke-width="2.5" />
        <rect x="${width * 0.45}" y="${height * 0.42}" width="22" height="30" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      </svg>
    `);
  }

  return null;
}

/**
 * Processes a single pose: full standing version (1024px) + waist-up crop (600px) with waist fade
 */
async function processCharacterPose(srcPath, outDir, charDef, poseName) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file missing: ${srcPath}`);
  }

  const baseImg = sharp(srcPath).ensureAlpha();
  const meta = await baseImg.metadata();
  const width = meta.width;
  const height = meta.height;

  // 1. Full-Body Standing Pose (1024px height)
  const fullBodyTargetHeight = Math.min(height, 1024);
  let fullBodySharp = sharp(srcPath).resize({ height: fullBodyTargetHeight });

  const attireOverlay = createAttireSvg(charDef.attire, width, height);
  if (attireOverlay) {
    const resizedAttire = await sharp(attireOverlay).resize({ height: fullBodyTargetHeight }).toBuffer();
    fullBodySharp = fullBodySharp.composite([{ input: resizedAttire, blend: 'over' }]);
  }

  const fullBodyBuf = await fullBodySharp
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const fullBodyPath = path.join(outDir, `${poseName}-full.png`);
  fs.writeFileSync(fullBodyPath, fullBodyBuf);
  // Mirror to uploads/characters
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${charDef.folder}-${poseName}-full.png`), fullBodyBuf);

  // 2. Waist-Up Crop (top 60% of body) with waist-fade mask
  const waistCropHeight = Math.round(height * 0.60);
  let cropped = sharp(srcPath)
    .extract({ left: 0, top: 0, width, height: waistCropHeight })
    .resize({ height: 600 });

  if (attireOverlay) {
    const croppedAttire = await sharp(attireOverlay)
      .extract({ left: 0, top: 0, width, height: waistCropHeight })
      .resize({ height: 600 })
      .toBuffer();
    cropped = cropped.composite([{ input: croppedAttire, blend: 'over' }]);
  }

  const croppedBuf = await cropped.toBuffer();
  const croppedMeta = await sharp(croppedBuf).metadata();
  const maskSvg = createWaistFadeSvg(croppedMeta.width, croppedMeta.height);

  const halfBodyBuf = await sharp(croppedBuf)
    .composite([
      {
        input: maskSvg,
        blend: 'dest-in',
      },
    ])
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const halfBodyPath = path.join(outDir, `${poseName}.png`);
  fs.writeFileSync(halfBodyPath, halfBodyBuf);

  const halfAliasPath = path.join(outDir, `${poseName}-half.png`);
  fs.writeFileSync(halfAliasPath, halfBodyBuf);

  // Mirror to uploads/characters
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${charDef.folder}-${poseName}.png`), halfBodyBuf);
  fs.writeFileSync(path.join(UPLOADS_CHAR_DIR, `${charDef.folder}-${poseName}-half.png`), halfBodyBuf);

  const fullHash = crypto.createHash('sha256').update(fullBodyBuf).digest('hex');
  const halfHash = crypto.createHash('sha256').update(halfBodyBuf).digest('hex');

  return {
    fullHash,
    halfHash,
    fullSize: fullBodyBuf.length,
    halfSize: halfBodyBuf.length,
  };
}

/**
 * Verifies true alpha = 0 transparency
 */
async function verifyAlphaTransparency(filePath) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels < 4) throw new Error(`Missing alpha channel: ${filePath}`);

  let transparentPixels = 0;
  for (let i = 3; i < data.length; i += channels) {
    if (data[i] === 0) transparentPixels++;
  }

  const ratio = transparentPixels / (width * height);
  if (ratio < 0.20) {
    throw new Error(`File ${filePath} has only ${(ratio * 100).toFixed(1)}% transparent pixels!`);
  }

  return { width, height, ratio };
}

async function main() {
  console.log('\n=== Step 2: Building 8 Clean Flagship Characters with 6 Distinct Expressions ===');

  const processedCharacters = [];

  for (const charDef of FLAGSHIP_CHARACTERS) {
    console.log(`\nBuilding character: ${charDef.name} (${charDef.id}) [${charDef.clothing}]...`);
    const charDir = path.join(CHAR_OUTPUT_DIR, charDef.folder);
    if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });

    const hashes = new Set();
    const poseResults = {};

    for (const [pose, filename] of Object.entries(charDef.poses)) {
      const srcPath = path.join(AUTHENTIC_DIR, filename);
      const res = await processCharacterPose(srcPath, charDir, charDef, pose);

      if (hashes.has(res.halfHash)) {
        throw new Error(`Duplicate expression hash in ${charDef.name} for pose ${pose}! Expressions must be visually distinct.`);
      }
      hashes.add(res.halfHash);

      const alphaRes = await verifyAlphaTransparency(path.join(charDir, `${pose}.png`));
      console.log(`  ✓ Pose '${pose}': ${alphaRes.width}x${alphaRes.height}, ${(alphaRes.ratio * 100).toFixed(1)}% transparent, SHA: ${res.halfHash.slice(0, 10)}...`);

      poseResults[pose] = {
        halfUrl: `/characters/${charDef.folder}/${pose}.png?v=2`,
        fullUrl: `/characters/${charDef.folder}/${pose}-full.png?v=2`,
        hash: res.halfHash,
      };
    }

    processedCharacters.push({
      ...charDef,
      poses: poseResults,
    });
  }

  // 3. SEED SQLITE WITH THE 8 FLAGSHIP CHARACTERS
  console.log('\n=== Step 3: Seeding SQLite characters table with the 8 flagship cutouts ===');
  const db = new Database(DB_PATH);
  const insert = db.prepare(`
    INSERT OR REPLACE INTO characters (
      id, name, gender, clothing, age_group, style, crop, ethnicity, role,
      transparent_png_url, expressions, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const c of processedCharacters) {
    const pngUrl = `/characters/${c.folder}/neutral.png?v=2`;
    const expressionsMap = {
      neutral: `/characters/${c.folder}/neutral.png?v=2`,
      happy: `/characters/${c.folder}/happy.png?v=2`,
      talking: `/characters/${c.folder}/talking.png?v=2`,
      worried: `/characters/${c.folder}/worried.png?v=2`,
      concerned: `/characters/${c.folder}/worried.png?v=2`,
      frustrated: `/characters/${c.folder}/frustrated.png?v=2`,
      disappointed: `/characters/${c.folder}/frustrated.png?v=2`,
      confused: `/characters/${c.folder}/confused.png?v=2`,
      thinking: `/characters/${c.folder}/confused.png?v=2`,
      presenting: `/characters/${c.folder}/presenting.png?v=2`,
    };

    insert.run(
      c.id,
      c.name,
      c.gender,
      c.clothing,
      c.ageGroup,
      'photographic',
      'half_body',
      c.ethnicity,
      c.role,
      pngUrl,
      JSON.stringify(expressionsMap),
      now,
      now
    );
    console.log(`  ✓ Inserted ${c.name} into SQLite characters table`);
  }

  // Also update blk-1793605268322-3ujp scenario block to use Jet with verified expressions
  try {
    const blkRow = db.prepare("SELECT content FROM blocks WHERE id = 'blk-1793605268322-3ujp'").get();
    if (blkRow) {
      const content = JSON.parse(blkRow.content);
      content.characterPhotoUrl = '/characters/jet/neutral.png?v=2';
      content.characterExpressions = {
        neutral: '/characters/jet/neutral.png?v=2',
        happy: '/characters/jet/happy.png?v=2',
        talking: '/characters/jet/talking.png?v=2',
        worried: '/characters/jet/worried.png?v=2',
        concerned: '/characters/jet/worried.png?v=2',
        frustrated: '/characters/jet/frustrated.png?v=2',
        disappointed: '/characters/jet/frustrated.png?v=2',
        confused: '/characters/jet/confused.png?v=2',
        thinking: '/characters/jet/confused.png?v=2',
        presenting: '/characters/jet/presenting.png?v=2',
      };
      db.prepare("UPDATE blocks SET content = ? WHERE id = 'blk-1793605268322-3ujp'").run(JSON.stringify(content));
      console.log('  ✓ Updated showcase scenario block to use authentic Jet cutout expressions');
    }
  } catch (blkErr) {
    console.warn('Block update note:', blkErr.message);
  }

  db.close();

  // Write manifest.json
  const manifestPath = path.join(CHAR_OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(processedCharacters, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);
  console.log('=== Character pipeline finished successfully with 8 clean flagship characters! ===');
}

main().catch((err) => {
  console.error('Fatal error in character generation:', err);
  process.exit(1);
});
