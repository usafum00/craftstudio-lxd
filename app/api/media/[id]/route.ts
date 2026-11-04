import { NextRequest, NextResponse } from 'next/server';
import { deleteMediaAsset, updateMediaAsset } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = updateMediaAsset(id, {
      title: body.title,
      tags: body.tags,
      category: body.category,
      isFavorite: body.isFavorite,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update media asset', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteMediaAsset(id);
    if (!success) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete media asset', details: String(error) },
      { status: 500 }
    );
  }
}
