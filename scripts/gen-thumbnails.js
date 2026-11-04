const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'thumbnails');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const svgs = {
  'social-engineering.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="se-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#se-bg)" />
    <!-- Office Desk & Tech silhouettes -->
    <rect x="50" y="140" width="300" height="8" rx="4" fill="#475569" opacity="0.6"/>
    <rect x="130" y="90" width="140" height="90" rx="6" fill="#1e293b" stroke="#475569" stroke-width="2"/>
    <rect x="140" y="100" width="120" height="70" rx="3" fill="#0f172a"/>
    <!-- Network Grid & Nodes -->
    <circle cx="80" cy="70" r="4" fill="#38bdf8" opacity="0.7"/>
    <circle cx="320" cy="65" r="4" fill="#38bdf8" opacity="0.7"/>
    <circle cx="200" cy="45" r="5" fill="#38bdf8"/>
    <line x1="80" y1="70" x2="200" y2="45" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>
    <line x1="320" y1="65" x2="200" y2="45" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>
    <line x1="200" y1="45" x2="200" y2="90" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
    <!-- Shield Icon on Screen -->
    <path d="M 200 115 L 218 123 C 218 140 200 152 200 152 C 200 152 182 140 182 123 Z" fill="url(#shield-grad)" />
    <path d="M 195 133 L 199 137 L 207 128" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Person silhouettes -->
    <circle cx="95" cy="115" r="14" fill="#475569" opacity="0.8"/>
    <path d="M 75 148 C 75 133 85 130 95 130 C 105 130 115 133 115 148 Z" fill="#475569" opacity="0.8"/>
    <circle cx="305" cy="115" r="14" fill="#475569" opacity="0.8"/>
    <path d="M 285 148 C 285 133 295 130 305 130 C 315 130 325 133 325 148 Z" fill="#475569" opacity="0.8"/>
  </svg>`,

  'conflict-resolution.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="cr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#475569" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#cr-bg)" />
    <!-- Modern architectural background window -->
    <rect x="40" y="25" width="320" height="175" rx="8" fill="#334155" opacity="0.4"/>
    <line x1="200" y1="25" x2="200" y2="200" stroke="#64748b" stroke-width="2" opacity="0.4"/>
    <!-- Two people engaged in productive dialogue -->
    <circle cx="150" cy="100" r="22" fill="#94a3b8" />
    <path d="M 115 175 C 115 135 130 130 150 130 C 170 130 185 135 185 175 Z" fill="#64748b" />
    <circle cx="250" cy="100" r="22" fill="#cbd5e1" />
    <path d="M 215 175 C 215 135 230 130 250 130 C 270 130 285 135 285 175 Z" fill="#94a3b8" />
    <!-- Bridge / handshake icon above -->
    <circle cx="200" cy="70" r="18" fill="#ff5722" opacity="0.9"/>
    <path d="M 192 70 L 198 75 L 208 65" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`,

  'ask-boss.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="ab-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#ab-bg)" />
    <!-- Whiteboard with sticky notes & chart -->
    <rect x="70" y="30" width="260" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
    <line x1="90" y1="140" x2="310" y2="140" stroke="#94a3b8" stroke-width="2"/>
    <polyline points="95,130 140,100 190,115 240,75 290,60" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
    <rect x="95" y="45" width="28" height="28" rx="2" fill="#fef08a" />
    <rect x="130" y="45" width="28" height="28" rx="2" fill="#fed7aa" />
    <rect x="165" y="45" width="28" height="28" rx="2" fill="#bbf7d0" />
    <!-- Figures talking -->
    <circle cx="130" cy="150" r="18" fill="#475569"/>
    <circle cx="270" cy="145" r="20" fill="#334155"/>
  </svg>`,

  'performance-management.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="pm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#pm-bg)" />
    <!-- Modern conference table -->
    <ellipse cx="200" cy="165" rx="150" ry="35" fill="#4338ca" opacity="0.6"/>
    <ellipse cx="200" cy="160" rx="145" ry="32" fill="#3730a3"/>
    <!-- Goal target / Performance metric -->
    <circle cx="200" cy="75" r="32" fill="#4f46e5" stroke="#818cf8" stroke-width="2"/>
    <circle cx="200" cy="75" r="22" fill="#3730a3" stroke="#a5b4fc" stroke-width="2"/>
    <circle cx="200" cy="75" r="10" fill="#ff5722"/>
    <!-- Growth trajectory -->
    <path d="M 80 130 Q 140 100 200 75 T 320 40" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="4,4"/>
  </svg>`,

  'spot-phish.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <rect width="400" height="225" fill="#dbeafe" />
    <!-- Gentle stylized waves -->
    <path d="M 0 120 C 100 90 200 140 300 110 C 350 95 400 120 400 120 L 400 225 L 0 225 Z" fill="#1e3a8a" />
    <path d="M 0 150 C 90 130 180 170 270 145 C 330 130 400 150 400 150 L 400 225 L 0 225 Z" fill="#172554" />
    <!-- Fishing Line & Hook -->
    <line x1="200" y1="0" x2="200" y2="95" stroke="#94a3b8" stroke-width="2"/>
    <path d="M 200 95 C 200 115 180 115 180 105 C 180 100 185 96 188 96" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Letter Envelope bait -->
    <g transform="translate(165, 60)">
      <rect width="50" height="34" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <polygon points="0,0 25,18 50,0" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
      <circle cx="25" cy="18" r="4" fill="#ef4444"/>
    </g>
    <!-- Dark swimming fish silhouettes -->
    <path d="M 70 85 C 85 75 110 85 115 85 L 125 78 L 122 85 L 125 92 L 115 85 C 110 85 85 95 70 85 Z" fill="#0f172a" />
    <circle cx="75" cy="84" r="1.5" fill="#ffffff"/>
    <path d="M 310 160 C 325 150 350 160 355 160 L 365 153 L 362 160 L 365 167 L 355 160 C 350 160 325 170 310 160 Z" fill="#0f172a" />
    <circle cx="315" cy="159" r="1.5" fill="#ffffff"/>
  </svg>`,

  'better-naps.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <!-- Calming green room -->
    <rect width="400" height="225" fill="#065f46" />
    <!-- Wall lighting accents -->
    <line x1="70" y1="0" x2="70" y2="50" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="70" cy="55" r="12" fill="#a7f3d0" opacity="0.9"/>
    <line x1="120" y1="0" x2="120" y2="75" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="120" cy="80" r="16" fill="#6ee7b7" opacity="0.9"/>
    <!-- Minimal modern sofa -->
    <rect x="180" y="110" width="190" height="70" rx="8" fill="#047857"/>
    <rect x="170" y="125" width="205" height="40" rx="6" fill="#059669"/>
    <rect x="165" y="115" width="25" height="50" rx="5" fill="#064e3b"/>
    <rect x="360" y="115" width="25" height="50" rx="5" fill="#064e3b"/>
    <!-- Sleeping Cat silhouette on sofa -->
    <ellipse cx="270" cy="130" rx="18" ry="12" fill="#fef08a"/>
    <circle cx="282" cy="126" r="8" fill="#fef08a"/>
    <polygon points="282,118 286,124 288,120" fill="#fde047"/>
    <path d="M 252 134 C 248 138 245 142 248 145" stroke="#fef08a" stroke-width="3" stroke-linecap="round" fill="none"/>
  </svg>`,

  'articulate-ai.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="ai-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f9ff" />
        <stop offset="50%" stop-color="#e0f2fe" />
        <stop offset="100%" stop-color="#bae6fd" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#ai-bg)" />
    <!-- Floating UI blueprint cards -->
    <g transform="translate(60, 40) rotate(-4)">
      <rect width="130" height="85" rx="8" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"/>
      <rect x="12" y="12" width="40" height="10" rx="4" fill="#38bdf8"/>
      <rect x="12" y="30" width="100" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="12" y="44" width="75" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="12" y="58" width="50" height="14" rx="4" fill="#0284c7"/>
    </g>
    <g transform="translate(210, 50) rotate(5)">
      <rect width="140" height="95" rx="8" fill="#ffffff" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.08))"/>
      <circle cx="25" cy="25" r="10" fill="#f43f5e"/>
      <rect x="42" y="20" width="60" height="8" rx="4" fill="#1e293b"/>
      <rect x="15" y="45" width="110" height="6" rx="3" fill="#cbd5e1"/>
      <rect x="15" y="58" width="90" height="6" rx="3" fill="#cbd5e1"/>
      <rect x="15" y="72" width="70" height="6" rx="3" fill="#cbd5e1"/>
    </g>
    <!-- Sparkles -->
    <polygon points="190,30 193,38 201,41 193,44 190,52 187,44 179,41 187,38" fill="#38bdf8"/>
    <polygon points="170,120 172,126 178,128 172,130 170,136 168,130 162,128 168,126" fill="#f59e0b"/>
  </svg>`
};

for (const [filename, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(dir, filename), content.trim(), 'utf8');
}
console.log('Successfully generated all 7 thumbnails!');
