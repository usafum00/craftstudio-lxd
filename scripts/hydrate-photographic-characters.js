const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const REF_PATH = '/Users/mike/.gemini/antigravity/brain/acd24b53-3c2a-4f18-b826-38732d82b72a/rise-reference-3.20.40.png';
const TARGET_DIR = path.join(__dirname, '../public/uploads/characters');
const DB_PATH = path.join(__dirname, '../data/rise.db');

// 12 Authentic Articulate Rise Cutout Characters from reference screenshot
const RISE_CHARACTERS = [
  // Row 0
  {
    id: 'char-craig',
    name: 'Craig',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Safety & Field Operations Lead',
    left: 205, top: 88, width: 160, height: 156,
  },
  {
    id: 'char-lange',
    name: 'Lange',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'Executive Managing Director',
    left: 390, top: 88, width: 160, height: 156,
  },
  {
    id: 'char-renita',
    name: 'Renita',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Lead ER Physician & Trauma Specialist',
    left: 575, top: 88, width: 160, height: 156,
  },
  {
    id: 'char-gianna',
    name: 'Gianna',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Latina',
    role: 'Senior Partner & General Legal Counsel',
    left: 760, top: 88, width: 160, height: 156,
  },
  // Row 1
  {
    id: 'char-robert',
    name: 'Robert',
    gender: 'male',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Senior Full-Stack Engineer',
    left: 205, top: 320, width: 160, height: 156,
  },
  {
    id: 'char-laura',
    name: 'Laura',
    gender: 'female',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Lead Product & UX Designer',
    left: 390, top: 320, width: 160, height: 156,
  },
  {
    id: 'char-jonathan',
    name: 'Jonathan',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'White',
    role: 'Financial Strategy & Risk Director',
    left: 575, top: 320, width: 160, height: 156,
  },
  {
    id: 'char-andrea',
    name: 'Andrea',
    gender: 'female',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Infrastructure Safety Inspector',
    left: 760, top: 320, width: 160, height: 156,
  },
  // Row 2
  {
    id: 'char-tony',
    name: 'Tony',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '40s_50s',
    ethnicity: 'Latino',
    role: 'Plant Maintenance Director',
    left: 205, top: 552, width: 160, height: 156,
  },
  {
    id: 'char-joseph',
    name: 'Joseph',
    gender: 'male',
    clothing: 'casual',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'Agile Coach & Scrum Master',
    left: 390, top: 552, width: 160, height: 156,
  },
  {
    id: 'char-emily',
    name: 'Emily',
    gender: 'female',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Creative Brand Director',
    left: 575, top: 552, width: 160, height: 156,
  },
  {
    id: 'char-deshaun',
    name: 'DeShaun',
    gender: 'male',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Omnichannel Store Operations Lead',
    left: 760, top: 552, width: 160, height: 156,
  },
];

// 12 Curated Real Photographic Portraits for Medical, Industry & Corporate
const ADDITIONAL_CHARACTERS = [
  {
    id: 'char-maya',
    name: 'Dr. Maya Lin',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Chief Medical Officer & Surgeon',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
  },
  {
    id: 'char-carlos',
    name: 'Dr. Carlos Mendoza',
    gender: 'male',
    clothing: 'medical',
    ageGroup: '40s_50s',
    ethnicity: 'Latino',
    role: 'ICU & Anesthesiology Department Head',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80',
  },
  {
    id: 'char-priya',
    name: 'Priya Sharma',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Clinical Pharmacology Researcher',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80',
  },
  {
    id: 'char-elizabeth',
    name: 'Dr. Elizabeth Hayes',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Chair of Internal Medicine',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  },
  {
    id: 'char-kofi',
    name: 'Kofi Mensah',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Senior Field Electrical Engineer',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  },
  {
    id: 'char-soren',
    name: 'Soren Lindqvist',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Master Plant Engineer & Safety Auditor',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  },
  {
    id: 'char-david',
    name: 'David Sterling',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'White',
    role: 'Senior Managing Director',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80',
  },
  {
    id: 'char-amara',
    name: 'Amara Okafor',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Director of People & Culture',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  {
    id: 'char-fatima',
    name: 'Fatima Al-Mansoor',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'Middle Eastern',
    role: 'VP Enterprise Client Relations',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
  },
  {
    id: 'char-antonio',
    name: 'Antonio Morales',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'Latino',
    role: 'Corporate Compliance & Ethics Officer',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
  },
  {
    id: 'char-elena',
    name: 'Elena Rostova',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '40s_50s',
    ethnicity: 'Latina',
    role: 'Chief Customer Experience Officer',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80',
  },
  {
    id: 'char-chen',
    name: 'Dr. Chen Wei',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '60s_plus',
    ethnicity: 'Asian',
    role: 'Chief Technology Officer & Emeritus VP',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
];

// Helper: Flood fill background removal from outer perimeter
function removeBackgroundBorderFlood(rawBuffer, width, height, channels, threshold = 232) {
  const isBg = new Uint8Array(width * height);
  const queue = [];

  function check(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (isBg[idx]) return;
    const pIdx = idx * channels;
    const r = rawBuffer[pIdx];
    const g = rawBuffer[pIdx + 1];
    const b = rawBuffer[pIdx + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      isBg[idx] = 1;
      queue.push((y << 16) | x);
    }
  }

  // Seed 4 outer borders
  for (let x = 0; x < width; x++) {
    check(x, 0);
    check(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    check(0, y);
    check(width - 1, y);
  }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const val = queue[head++];
    const x = val & 0xffff;
    const y = val >> 16;
    check(x + 1, y);
    check(x - 1, y);
    check(x, y + 1);
    check(x, y - 1);
  }

  const out = Buffer.from(rawBuffer);
  for (let y = 0; y < height; y++) {
    // Soft waist-fade gradient on bottom 15%
    const bottomFadeRatio = y > height * 0.84 ? (height - y) / (height * 0.16) : 1.0;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pIdx = idx * channels;
      if (isBg[idx]) {
        out[pIdx + 3] = 0;
      } else {
        out[pIdx + 3] = Math.round(out[pIdx + 3] * bottomFadeRatio);
      }
    }
  }

  return out;
}

async function main() {
  console.log('🚀 Hydrating 24 Real Photographic Human Characters (No SVG cartoons)...');

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // 1. Delete all old .svg cartoon files from characters directory
  const existingFiles = fs.readdirSync(TARGET_DIR);
  let deletedSvgCount = 0;
  for (const f of existingFiles) {
    if (f.endsWith('.svg')) {
      fs.unlinkSync(path.join(TARGET_DIR, f));
      deletedSvgCount++;
    }
  }
  console.log(`✓ Deleted ${deletedSvgCount} primitive SVG cartoon files.`);

  const allCharacters = [];

  // 2. Extract 12 authentic Articulate Rise characters from reference screenshot
  console.log('Extracting 12 authentic Articulate Rise cutout characters...');
  for (const c of RISE_CHARACTERS) {
    const raw = await sharp(REF_PATH)
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const processedBuffer = removeBackgroundBorderFlood(
      raw.data,
      raw.info.width,
      raw.info.height,
      raw.info.channels,
      235
    );

    const filename = `${c.id}.png`;
    const destPath = path.join(TARGET_DIR, filename);

    await sharp(processedBuffer, {
      raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
    })
      .png({ compressionLevel: 8 })
      .toFile(destPath);

    const pngUrl = `/uploads/characters/${filename}`;

    allCharacters.push({
      id: c.id,
      name: c.name,
      gender: c.gender,
      clothing: c.clothing,
      ageGroup: c.ageGroup,
      ethnicity: c.ethnicity,
      role: c.role,
      style: 'photographic',
      crop: 'half_body',
      transparentPngUrl: pngUrl,
      expressions: {
        neutral: pngUrl,
        talking: pngUrl,
        happy: pngUrl,
        concerned: pngUrl,
        frustrated: pngUrl,
        presenting: pngUrl,
      },
    });

    console.log(`  ✓ ${c.name} (${c.clothing}) extracted.`);
  }

  // 3. Process 12 additional curated photographic characters
  console.log('Processing 12 additional curated photographic human portraits...');
  for (const c of ADDITIONAL_CHARACTERS) {
    try {
      const res = await fetch(c.url);
      const arrayBuffer = await res.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Resize and center-crop to waist-up (width: 320, height: 380)
      const cropped = await sharp(inputBuffer)
        .resize(320, 380, { fit: 'cover', position: 'top' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Apply waist-fade and corner background keying
      const { width, height, channels } = cropped.info;
      const rawData = cropped.data;
      const out = Buffer.from(rawData);

      // Corner background sample
      const cornerR = (rawData[0] + rawData[(width - 1) * channels]) / 2;
      const cornerG = (rawData[1] + rawData[(width - 1) * channels + 1]) / 2;
      const cornerB = (rawData[2] + rawData[(width - 1) * channels + 2]) / 2;

      for (let y = 0; y < height; y++) {
        const bottomFadeRatio = y > height * 0.82 ? (height - y) / (height * 0.18) : 1.0;
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels;
          const r = rawData[idx];
          const g = rawData[idx + 1];
          const b = rawData[idx + 2];

          // Distance from corner background
          const dist = Math.sqrt(
            Math.pow(r - cornerR, 2) + Math.pow(g - cornerG, 2) + Math.pow(b - cornerB, 2)
          );

          if (dist < 28 && (x < width * 0.25 || x > width * 0.75 || y < height * 0.25)) {
            out[idx + 3] = 0; // Transparent background around shoulders/head
          } else if (dist < 42 && (x < width * 0.25 || x > width * 0.75 || y < height * 0.25)) {
            const factor = (dist - 28) / 14;
            out[idx + 3] = Math.round(255 * factor);
          } else {
            out[idx + 3] = Math.round(out[idx + 3] * bottomFadeRatio);
          }
        }
      }

      const filename = `${c.id}.png`;
      const destPath = path.join(TARGET_DIR, filename);

      await sharp(out, {
        raw: { width, height, channels: 4 },
      })
        .png({ compressionLevel: 8 })
        .toFile(destPath);

      const pngUrl = `/uploads/characters/${filename}`;

      allCharacters.push({
        id: c.id,
        name: c.name,
        gender: c.gender,
        clothing: c.clothing,
        ageGroup: c.ageGroup,
        ethnicity: c.ethnicity,
        role: c.role,
        style: 'photographic',
        crop: 'half_body',
        transparentPngUrl: pngUrl,
        expressions: {
          neutral: pngUrl,
          talking: pngUrl,
          happy: pngUrl,
          concerned: pngUrl,
          frustrated: pngUrl,
          presenting: pngUrl,
        },
      });

      console.log(`  ✓ ${c.name} (${c.clothing}) processed.`);
    } catch (err) {
      console.warn(`  Failed processing ${c.name}:`, err);
    }
  }

  // 4. Update SQLite characters table
  console.log('Syncing all 24 photographic characters to SQLite database...');
  const db = new Database(DB_PATH);

  // Clear previous SVG cartoon characters
  db.prepare('DELETE FROM characters').run();

  const insert = db.prepare(`
    INSERT INTO characters (
      id, name, gender, clothing, age_group, style, crop, ethnicity, role,
      transparent_png_url, expressions, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const c of allCharacters) {
    insert.run(
      c.id,
      c.name,
      c.gender,
      c.clothing,
      c.ageGroup,
      c.style,
      c.crop,
      c.ethnicity || '',
      c.role || '',
      c.transparentPngUrl,
      JSON.stringify(c.expressions),
      now,
      now
    );
  }

  console.log(`✓ Successfully updated SQLite with ${allCharacters.length} real photographic characters!`);
}

main().catch((err) => {
  console.error('Fatal error hydrating characters:', err);
  process.exit(1);
});
