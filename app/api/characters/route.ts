import { NextRequest, NextResponse } from 'next/server';
import { getCharacters, createCharacter } from '@/lib/db';
import { CharacterClothing, CharacterGender, CharacterAgeGroup, CharacterStyle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clothing = (searchParams.get('clothing') || 'all') as CharacterClothing;
    const gender = (searchParams.get('gender') || 'all') as CharacterGender;
    const ageGroup = (searchParams.get('ageGroup') || 'all') as CharacterAgeGroup;
    const style = (searchParams.get('style') || 'all') as CharacterStyle;
    const search = searchParams.get('search') || '';

    const characters = getCharacters({
      clothing,
      gender,
      ageGroup,
      style,
      search,
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      gender,
      clothing,
      ageGroup,
      style = 'photographic',
      crop = 'half_body',
      ethnicity = '',
      role = '',
      transparentPngUrl,
      expressions,
    } = body;

    if (!name || !transparentPngUrl) {
      return NextResponse.json({ error: 'Name and transparentPngUrl are required' }, { status: 400 });
    }

    const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullExpressions = expressions || {
      neutral: transparentPngUrl,
      talking: transparentPngUrl,
      happy: transparentPngUrl,
      concerned: transparentPngUrl,
      frustrated: transparentPngUrl,
      presenting: transparentPngUrl,
    };

    const character = createCharacter({
      id,
      name,
      gender: gender || 'female',
      clothing: clothing || 'business_casual',
      ageGroup: ageGroup || '20s_30s',
      style: style || 'photographic',
      crop: crop || 'half_body',
      ethnicity,
      role,
      transparentPngUrl,
      expressions: fullExpressions,
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error('Failed to create character:', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}
