import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById, deleteCharacter } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const character = getCharacterById(id);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    return NextResponse.json({ character });
  } catch (error) {
    console.error('Failed to get character:', error);
    return NextResponse.json({ error: 'Failed to get character' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteCharacter(id);
    if (!success) {
      return NextResponse.json({ error: 'Character not found or could not be deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete character:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}
