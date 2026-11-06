import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { createCharacter } from '@/lib/db';
import { removeSolidBackground } from '@/lib/server-bg-removal';
import { CharacterClothing, CharacterGender, CharacterAgeGroup, CharacterPose } from '@/lib/types';
import { ensurePersistentStorageDirs } from '@/lib/paths';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    ensurePersistentStorageDirs();
    const body = await request.json();
    const {
      name = 'Custom Character',
      gender = 'female',
      clothing = 'business_casual',
      ageGroup = '20s_30s',
      ethnicity = 'Diverse',
      role = 'Professional Specialist',
      style = 'photographic',
      crop = 'half_body',
    } = body;

    const id = `char-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const ageDesc = ageGroup === '20s_30s' ? 'young professional in their late 20s' : ageGroup === '40s_50s' ? 'experienced professional in their mid 40s' : 'senior executive in their early 60s';
    const clothingDesc = clothing === 'corporate' ? 'tailored sharp dark business suit and dress shirt' :
      clothing === 'medical' ? 'clean medical scrubs and stethoscope or lab coat' :
      clothing === 'industry' ? 'high-visibility safety vest and construction hard hat' :
      clothing === 'casual' ? 'stylish smart-casual polo or sweater' :
      'modern business-casual blazer and collared shirt';

    const styleDesc = style === 'illustrated' ? 'vector flat character illustration with clean crisp contours' : 'photorealistic commercial studio portrait photography with soft diffused lighting';
    const cropDesc = crop === 'full_body' ? 'full body standing pose' : crop === 'headshot' ? 'close-up head and shoulders portrait' : 'half-body torso portrait with arms relaxed';

    // Generate prompt with isolated pure white background for crisp alpha cutout extraction
    const prompt = `Studio portrait of ${name}, a ${ageDesc} ${gender} (${ethnicity}), working as ${role}. Wearing ${clothingDesc}. ${cropDesc}, facing forward with a warm welcoming friendly expression. ${styleDesc}. Isolated on pure solid white background #FFFFFF, studio key light, clean silhouette, sharp focus, 8k, professional photography, no background shadows.`;

    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=768&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let imageBuffer: Buffer;
    try {
      const imgRes = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!imgRes.ok) {
        throw new Error(`Pollinations HTTP ${imgRes.status}`);
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.warn('Pollinations generation timed out or failed, generating high-res SVG fallback:', fetchErr);
      // Fallback SVG cutout
      const uploadsDir = path.join(process.cwd(), 'public/uploads/characters');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fallbackUrl = `/uploads/characters/${id}.svg`;
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#312e81" />
          </linearGradient>
        </defs>
        <path d="M 120 480 L 120 330 Q 200 310 280 330 L 280 480 Z" fill="url(#bodyGrad)" />
        <ellipse cx="200" cy="200" rx="48" ry="60" fill="#e0a97a" />
        <text x="200" y="210" font-family="system-ui" font-size="16" font-weight="bold" fill="#1e1b4b" text-anchor="middle">${name}</text>
      </svg>`;
      fs.writeFileSync(path.join(uploadsDir, `${id}.svg`), fallbackSvg, 'utf-8');

      const validGender: 'male' | 'female' = gender === 'male' ? 'male' : 'female';
      const validClothing = (clothing === 'all' ? 'business_casual' : clothing) as 'business_casual' | 'casual' | 'corporate' | 'industry' | 'medical';
      const validAge = (ageGroup === 'all' ? '20s_30s' : ageGroup) as '20s_30s' | '40s_50s' | '60s_plus';

      const char = createCharacter({
        id,
        name,
        gender: validGender,
        clothing: validClothing,
        ageGroup: validAge,
        style,
        crop,
        ethnicity,
        role,
        transparentPngUrl: fallbackUrl,
        expressions: {
          neutral: fallbackUrl,
          talking: fallbackUrl,
          happy: fallbackUrl,
          concerned: fallbackUrl,
          frustrated: fallbackUrl,
          confused: fallbackUrl,
          presenting: fallbackUrl,
        },
      });

      return NextResponse.json({ character: char });
    }

    // Strip solid background with sharp
    const transparentBuffer = await removeSolidBackground(imageBuffer, 42);

    const uploadsDir = path.join(process.cwd(), 'public/uploads/characters');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${id}.png`;
    const targetPath = path.join(uploadsDir, filename);
    fs.writeFileSync(targetPath, transparentBuffer);

    const primaryUrl = `/uploads/characters/${filename}`;

    const expressions: Record<CharacterPose, string> = {
      neutral: primaryUrl,
      talking: primaryUrl,
      happy: primaryUrl,
      concerned: primaryUrl,
      frustrated: primaryUrl,
      confused: primaryUrl,
      presenting: primaryUrl,
    };

    const validGender: 'male' | 'female' = gender === 'male' ? 'male' : 'female';
    const validClothing = (clothing === 'all' ? 'business_casual' : clothing) as 'business_casual' | 'casual' | 'corporate' | 'industry' | 'medical';
    const validAge = (ageGroup === 'all' ? '20s_30s' : ageGroup) as '20s_30s' | '40s_50s' | '60s_plus';

    const character = createCharacter({
      id,
      name,
      gender: validGender,
      clothing: validClothing,
      ageGroup: validAge,
      style,
      crop,
      ethnicity,
      role,
      transparentPngUrl: primaryUrl,
      expressions,
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate character:', error);
    return NextResponse.json({ error: 'Failed to generate character' }, { status: 500 });
  }
}
