const fs = require('fs');
const path = require('path');

const CHARACTERS = [
  {
    id: 'char-lange',
    name: 'Lange',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'Executive Managing Director',
    skin: '#5c3826',
    hair: '#1f1610',
    hairStyle: 'short-fade',
    clothesColor: '#1e293b', // charcoal suit
    shirtColor: '#ffffff',
    tieColor: '#b91c1c', // red power tie
    accessory: 'tie',
  },
  {
    id: 'char-renita',
    name: 'Renita',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Lead ER Physician & Trauma Specialist',
    skin: '#8d5b4c',
    hair: '#1a1412',
    hairStyle: 'bun',
    clothesColor: '#0d9488', // teal scrubs
    shirtColor: '#0d9488',
    accessory: 'stethoscope',
  },
  {
    id: 'char-jonathan',
    name: 'Jonathan',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Site Safety Supervisor & Inspector',
    skin: '#f5cba7',
    hair: '#873600',
    hairStyle: 'hardhat',
    clothesColor: '#ea580c', // safety orange vest with reflective silver
    shirtColor: '#334155',
    accessory: 'vest-and-hardhat',
  },
  {
    id: 'char-sukiyo',
    name: 'Sukiyo',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Senior Financial Risk Analyst',
    skin: '#fce4c8',
    hair: '#111827',
    hairStyle: 'sleek-long',
    clothesColor: '#3b82f6', // royal blue cardigan
    shirtColor: '#ffffff',
    accessory: 'lanyard',
  },
  {
    id: 'char-gianna',
    name: 'Gianna',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Latina',
    role: 'Senior Partner & General Legal Counsel',
    skin: '#d49b72',
    hair: '#271b16',
    hairStyle: 'wavy-shoulder',
    clothesColor: '#0f172a', // midnight navy blazer
    shirtColor: '#f8fafc',
    accessory: 'pearl-necklace',
  },
  {
    id: 'char-laura',
    name: 'Laura',
    gender: 'female',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'White',
    role: 'Lead UX Designer & Researcher',
    skin: '#fbd7c3',
    hair: '#b45309', // auburn
    hairStyle: 'wavy-bob',
    clothesColor: '#6366f1', // indigo knit sweater
    shirtColor: '#ffffff',
    accessory: 'glasses',
  },
  {
    id: 'char-deshaun',
    name: 'DeShaun',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'Supply Chain & Logistics Plant Director',
    skin: '#4a2c1d',
    hair: '#18181b',
    hairStyle: 'hardhat',
    clothesColor: '#eab308', // high-vis neon yellow vest
    shirtColor: '#1e293b',
    accessory: 'vest-and-hardhat',
  },
  {
    id: 'char-liz',
    name: 'Liz',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '40s_50s',
    ethnicity: 'White',
    role: 'Nurse Practitioner & Clinical Educator',
    skin: '#fad4c0',
    hair: '#d97706',
    hairStyle: 'ponytail',
    clothesColor: '#ffffff', // white lab coat
    shirtColor: '#0284c7', // sky blue under
    accessory: 'stethoscope',
  },
  {
    id: 'char-jet',
    name: 'Jet',
    gender: 'male',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'Asian',
    role: 'Principal Cloud & AI Architect',
    skin: '#fae1c3',
    hair: '#111827',
    hairStyle: 'modern-quiff',
    clothesColor: '#334155', // dark slate tech hoodie
    shirtColor: '#64748b',
    accessory: 'headphones-neck',
  },
  {
    id: 'char-antonio',
    name: 'Antonio',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '20s_30s',
    ethnicity: 'Latino',
    role: 'Corporate Compliance & Ethics Director',
    skin: '#c68a5c',
    hair: '#1c1917',
    hairStyle: 'pompadour',
    clothesColor: '#1e1b4b', // tailored deep indigo suit
    shirtColor: '#ffffff',
    tieColor: '#4f46e5',
    accessory: 'tie',
  },
  {
    id: 'char-amara',
    name: 'Amara',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Director of People & Culture',
    skin: '#663b28',
    hair: '#09090b',
    hairStyle: 'braids',
    clothesColor: '#059669', // emerald blazer
    shirtColor: '#fef3c7',
    accessory: 'gold-earrings',
  },
  {
    id: 'char-mateo',
    name: 'Mateo',
    gender: 'male',
    clothing: 'casual',
    ageGroup: '20s_30s',
    ethnicity: 'Latino',
    role: 'Senior Product Manager & Scrum Lead',
    skin: '#d69769',
    hair: '#292524',
    hairStyle: 'wavy-short',
    clothesColor: '#0284c7', // ocean blue polo
    shirtColor: '#0284c7',
    accessory: 'smartwatch',
  },
  {
    id: 'char-priya',
    name: 'Priya',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '20s_30s',
    ethnicity: 'South Asian',
    role: 'Clinical Research & Pharmacology Lead',
    skin: '#7c4d3b',
    hair: '#0c0a09',
    hairStyle: 'long-dark',
    clothesColor: '#ffffff', // lab coat
    shirtColor: '#4338ca',
    accessory: 'stethoscope',
  },
  {
    id: 'char-kofi',
    name: 'Kofi',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Senior Field Electrical Engineer',
    skin: '#3d2417',
    hair: '#18181b',
    hairStyle: 'hardhat',
    clothesColor: '#ea580c', // safety orange
    shirtColor: '#0f172a',
    accessory: 'vest-and-hardhat',
  },
  {
    id: 'char-chen',
    name: 'Chen',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '60s_plus',
    ethnicity: 'Asian',
    role: 'Chief Technology Officer & Emeritus VP',
    skin: '#ebd2b6',
    hair: '#94a3b8', // distinguished silver gray
    hairStyle: 'parted-gray',
    clothesColor: '#0f172a',
    shirtColor: '#ffffff',
    tieColor: '#0284c7',
    accessory: 'tie',
  },
  {
    id: 'char-fatima',
    name: 'Fatima',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Middle Eastern',
    role: 'Strategic Enterprise Accounts Director',
    skin: '#d19c79',
    hair: '#4338ca',
    hairStyle: 'hijab-silk',
    clothesColor: '#4338ca', // elegant navy silk hijab & tailored blazer
    shirtColor: '#f8fafc',
    accessory: 'hijab',
  },
  {
    id: 'char-soren',
    name: 'Soren',
    gender: 'male',
    clothing: 'industry',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Master Plant Engineer & Safety Auditor',
    skin: '#f7cfb8',
    hair: '#cbd5e1', // silver white under hard hat
    hairStyle: 'hardhat-gray',
    clothesColor: '#ca8a04', // heavy duty safety vest
    shirtColor: '#475569',
    accessory: 'vest-and-hardhat',
  },
  {
    id: 'char-elena',
    name: 'Elena',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '40s_50s',
    ethnicity: 'Latina',
    role: 'Chief Customer Experience Officer',
    skin: '#c98f68',
    hair: '#3f2214',
    hairStyle: 'curls',
    clothesColor: '#9333ea', // plum blazer
    shirtColor: '#ffffff',
    accessory: 'necklace',
  },
  {
    id: 'char-devon',
    name: 'Devon',
    gender: 'male',
    clothing: 'business_casual',
    ageGroup: '20s_30s',
    ethnicity: 'Black',
    role: 'Omnichannel Store Operations Lead',
    skin: '#4c2e1f',
    hair: '#18181b',
    hairStyle: 'fade',
    clothesColor: '#047857', // forest green collared shirt
    shirtColor: '#047857',
    accessory: 'badge',
  },
  {
    id: 'char-amina',
    name: 'Amina',
    gender: 'female',
    clothing: 'medical',
    ageGroup: '60s_plus',
    ethnicity: 'Middle Eastern',
    role: 'Chief Medical Officer & Surgery Chair',
    skin: '#bc8763',
    hair: '#0f172a',
    hairStyle: 'hijab-medical',
    clothesColor: '#ffffff', // white coat with deep teal scrubs
    shirtColor: '#0f766e',
    accessory: 'stethoscope',
  },
  {
    id: 'char-carlos',
    name: 'Carlos',
    gender: 'male',
    clothing: 'medical',
    ageGroup: '40s_50s',
    ethnicity: 'Latino',
    role: 'Anesthesiologist & ICU Department Head',
    skin: '#b5784c',
    hair: '#292524',
    hairStyle: 'short-trimmed',
    clothesColor: '#0369a1', // royal blue scrubs
    shirtColor: '#0369a1',
    accessory: 'stethoscope',
  },
  {
    id: 'char-tariq',
    name: 'Tariq',
    gender: 'male',
    clothing: 'corporate',
    ageGroup: '40s_50s',
    ethnicity: 'Middle Eastern',
    role: 'VP of Global Supply Chain & Logistics',
    skin: '#b37d57',
    hair: '#1c1917',
    hairStyle: 'groomed-beard',
    clothesColor: '#1e293b', // charcoal tailored suit
    shirtColor: '#ffffff',
    tieColor: '#0d9488',
    accessory: 'tie',
  },
  {
    id: 'char-eleanor',
    name: 'Eleanor',
    gender: 'female',
    clothing: 'corporate',
    ageGroup: '60s_plus',
    ethnicity: 'White',
    role: 'Board Chairperson & Senior Governance Advisor',
    skin: '#fae3d5',
    hair: '#e2e8f0', // elegant silver bob
    hairStyle: 'silver-bob',
    clothesColor: '#312e81', // deep sapphire tailored jacket
    shirtColor: '#ffffff',
    accessory: 'brooch',
  },
  {
    id: 'char-harriet',
    name: 'Harriet',
    gender: 'female',
    clothing: 'business_casual',
    ageGroup: '40s_50s',
    ethnicity: 'Black',
    role: 'Principal Learning & Talent Architect',
    skin: '#523321',
    hair: '#18181b',
    hairStyle: 'updo',
    clothesColor: '#be185d', // magenta blazer
    shirtColor: '#ffffff',
    accessory: 'earrings',
  },
];

function generateCutoutSVG(char, pose = 'neutral') {
  // Poses: neutral, talking, happy, concerned, frustrated, presenting
  const isFemale = char.gender === 'female';
  const isHardhat = char.accessory === 'vest-and-hardhat' || char.hairStyle.includes('hardhat');
  const isHijab = char.accessory === 'hijab' || char.hairStyle.includes('hijab');
  const isStethoscope = char.accessory === 'stethoscope';

  // Head and body positioning
  let headTilt = 0;
  let mouthPath = 'M 190 205 Q 200 215 210 205'; // neutral smile
  let eyebrowL = 'M 175 160 Q 185 158 193 162';
  let eyebrowR = 'M 207 162 Q 215 158 225 160';
  let armGesture = '';
  let expressionBadgeText = '';

  if (pose === 'talking') {
    mouthPath = 'M 190 203 Q 200 218 210 203 Q 200 210 190 203 Z'; // open speaking mouth
    armGesture = `
      <!-- Left Hand Gesture (Talking/Explaining) -->
      <path d="M 120 380 Q 90 320 120 280 Q 135 290 130 330 Z" fill="${char.skin}" />
      <circle cx="115" cy="280" r="14" fill="${char.skin}" />
    `;
    expressionBadgeText = 'Speaking';
  } else if (pose === 'happy') {
    eyebrowL = 'M 175 157 Q 185 152 193 158';
    eyebrowR = 'M 207 158 Q 215 152 225 157';
    mouthPath = 'M 188 202 Q 200 224 212 202 Z'; // broad happy smile
    armGesture = `
      <!-- Open friendly stance -->
      <path d="M 280 390 Q 320 330 300 290" stroke="${char.clothesColor}" stroke-width="26" stroke-linecap="round" fill="none" />
      <circle cx="305" cy="280" r="16" fill="${char.skin}" />
    `;
    expressionBadgeText = 'Approved';
  } else if (pose === 'concerned') {
    eyebrowL = 'M 175 157 Q 185 164 193 162';
    eyebrowR = 'M 207 162 Q 215 164 225 157';
    mouthPath = 'M 190 210 Q 200 206 210 210'; // small concerned mouth
    armGesture = `
      <!-- Hand on chin / contemplative -->
      <path d="M 150 380 Q 160 300 185 240 Q 200 240 190 280 Z" fill="${char.skin}" />
    `;
    expressionBadgeText = 'Thinking';
  } else if (pose === 'frustrated') {
    eyebrowL = 'M 175 166 Q 185 162 193 158';
    eyebrowR = 'M 207 158 Q 215 162 225 166';
    mouthPath = 'M 190 212 Q 200 205 210 212';
    expressionBadgeText = 'Concerned';
  } else if (pose === 'presenting') {
    mouthPath = 'M 188 204 Q 200 218 212 204';
    armGesture = `
      <!-- Right Arm Extended Presenting to Dialogue Card -->
      <path d="M 270 340 Q 330 310 375 270" stroke="${char.clothesColor}" stroke-width="32" stroke-linecap="round" fill="none" />
      <path d="M 370 275 L 390 260 L 385 285 Z" fill="${char.skin}" />
    `;
    expressionBadgeText = 'Presenting';
  }

  return `<svg viewBox="0 0 400 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Soft Waist-Fade Gradient Mask matching Articulate Rise Cutouts -->
    <linearGradient id="waistFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="78%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="96%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <mask id="fadeMask">
      <rect x="0" y="0" width="400" height="520" fill="url(#waistFade)" />
    </mask>
    <!-- Dynamic drop shadow for authentic character grounding -->
    <filter id="cutoutShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Grounding Silhouette Soft Contact Shadow on Floor -->
  <ellipse cx="200" cy="510" rx="140" ry="12" fill="#000000" fill-opacity="0.28" filter="blur(6px)" />

  <g mask="url(#fadeMask)" filter="url(#cutoutShadow)">
    <!-- SHOULDERS & TORSO CLOTHING -->
    <path d="M 90 520 L 105 340 Q 120 280 160 270 L 240 270 Q 280 280 295 340 L 310 520 Z" fill="${char.clothesColor}" />

    <!-- CHEST / INNER SHIRT -->
    <path d="M 160 270 L 200 370 L 240 270 Z" fill="${char.shirtColor}" />

    ${char.tieColor ? `<!-- Formal Necktie -->
    <path d="M 194 300 L 206 300 L 210 430 L 200 450 L 190 430 Z" fill="${char.tieColor}" />
    <path d="M 192 290 L 208 290 L 204 304 L 196 304 Z" fill="${char.tieColor}" />
    ` : ''}

    ${isStethoscope ? `<!-- Medical Stethoscope -->
    <path d="M 160 275 Q 165 370 200 395 Q 235 370 240 275" stroke="#cbd5e1" stroke-width="6" fill="none" stroke-linecap="round" />
    <circle cx="200" cy="405" r="14" fill="#64748b" stroke="#f8fafc" stroke-width="3" />
    <circle cx="200" cy="405" r="7" fill="#0f172a" />
    ` : ''}

    ${char.accessory === 'vest-and-hardhat' ? `<!-- Industry Safety Vest Reflective Stripes -->
    <path d="M 130 330 L 140 520" stroke="#f8fafc" stroke-width="12" stroke-linecap="square" />
    <path d="M 270 330 L 260 520" stroke="#f8fafc" stroke-width="12" stroke-linecap="square" />
    <path d="M 120 420 L 280 420" stroke="#f8fafc" stroke-width="12" />
    ` : ''}

    <!-- SUIT JACKET LAPELS -->
    <path d="M 155 270 L 175 380 L 160 390 L 135 320 Z" fill="${char.clothesColor}" opacity="0.9" />
    <path d="M 245 270 L 225 380 L 240 390 L 265 320 Z" fill="${char.clothesColor}" opacity="0.9" />

    ${armGesture}

    <!-- NECK -->
    <path d="M 175 230 L 175 280 Q 200 295 225 280 L 225 230 Z" fill="${char.skin}" />
    <path d="M 175 245 Q 200 260 225 245 L 225 255 Q 200 270 175 255 Z" fill="#000000" fill-opacity="0.12" />

    <!-- HEAD & JAW -->
    <ellipse cx="200" cy="180" rx="42" ry="52" fill="${char.skin}" />

    <!-- EARS -->
    <circle cx="156" cy="182" r="10" fill="${char.skin}" />
    <circle cx="244" cy="182" r="10" fill="${char.skin}" />

    <!-- EYES -->
    <ellipse cx="184" cy="175" rx="5" ry="4" fill="#ffffff" />
    <circle cx="184" cy="175" r="2.5" fill="#18181b" />
    <ellipse cx="216" cy="175" rx="5" ry="4" fill="#ffffff" />
    <circle cx="216" cy="175" r="2.5" fill="#18181b" />

    <!-- EYEBROWS (Pose responsive) -->
    <path d="${eyebrowL}" stroke="#18181b" stroke-width="3" stroke-linecap="round" />
    <path d="${eyebrowR}" stroke="#18181b" stroke-width="3" stroke-linecap="round" />

    <!-- NOSE -->
    <path d="M 200 175 L 198 192 L 204 192" stroke="${char.skin}" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />

    <!-- MOUTH (Pose responsive) -->
    <path d="${mouthPath}" stroke="#7f1d1d" stroke-width="2.5" stroke-linecap="round" fill="${pose === 'talking' || pose === 'happy' ? '#991b1b' : 'none'}" />

    ${isHardhat ? `<!-- Yellow/Orange Safety Construction Hard Hat -->
    <path d="M 145 155 Q 200 95 255 155 L 265 165 Q 200 150 135 165 Z" fill="#eab308" />
    <path d="M 130 162 Q 200 148 270 162" stroke="#ca8a04" stroke-width="6" stroke-linecap="round" />
    <path d="M 175 110 L 225 110 L 220 125 L 180 125 Z" fill="#ca8a04" opacity="0.5" />
    ` : isHijab ? `<!-- Elegant Silk Hijab -->
    <path d="M 150 190 Q 150 110 200 110 Q 250 110 250 190 Q 255 240 230 270 Q 200 290 170 270 Z" fill="${char.clothesColor}" opacity="0.95" />
    <path d="M 162 160 Q 200 140 238 160 Q 242 220 200 238 Q 158 220 162 160 Z" fill="${char.skin}" />
    <!-- Hijab draping fold -->
    <path d="M 170 270 Q 200 310 230 270" fill="${char.clothesColor}" />
    ` : `<!-- Natural Styled Hair -->
    <path d="M 152 170 Q 150 120 200 120 Q 250 120 248 170 Q 235 135 200 135 Q 165 135 152 170 Z" fill="${char.hair}" />
    ${isFemale ? `<path d="M 152 165 Q 146 220 160 250 Q 152 200 156 160 Z" fill="${char.hair}" />
    <path d="M 248 165 Q 254 220 240 250 Q 248 200 244 160 Z" fill="${char.hair}" />` : ''}
    `}
  </g>
</svg>`;
}

const targetDir = path.join(__dirname, '../public/uploads/characters');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Generating 24 transparent character cutouts across 6 poses...');
let fileCount = 0;

CHARACTERS.forEach((char) => {
  const poses = ['neutral', 'talking', 'happy', 'concerned', 'frustrated', 'presenting'];
  poses.forEach((pose) => {
    const svg = generateCutoutSVG(char, pose);
    const fileName = pose === 'neutral' ? `${char.id}.svg` : `${char.id}-${pose}.svg`;
    fs.writeFileSync(path.join(targetDir, fileName), svg, 'utf-8');
    fileCount++;
  });
});

console.log(`✓ Successfully generated ${fileCount} transparent cutout SVG files in public/uploads/characters!`);
