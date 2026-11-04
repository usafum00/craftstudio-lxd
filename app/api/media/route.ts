import { NextRequest, NextResponse } from 'next/server';
import { getMediaAssets, createMediaAsset, getAllMediaTags } from '@/lib/db';
import { startDropzoneWatcher } from '@/lib/flow-service';

export async function GET(request: NextRequest) {
  try {
    startDropzoneWatcher();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const favorites = searchParams.get('favorites') === 'true';
    const category = searchParams.get('category') || undefined;

    const assets = getMediaAssets({
      fileType: type,
      search,
      tag,
      favoritesOnly: favorites,
      category,
    });

    const tags = getAllMediaTags();

    return NextResponse.json({ assets, tags });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media assets', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.url || !body.filename) {
      return NextResponse.json({ error: 'url and filename are required' }, { status: 400 });
    }

    const asset = createMediaAsset({
      url: body.url,
      filename: body.filename,
      title: body.title || body.filename,
      tags: Array.isArray(body.tags) ? body.tags : [],
      category: body.category || '',
      isFavorite: !!body.isFavorite,
      fileType: body.fileType || 'image',
      source: body.source || 'upload',
      fileSize: body.fileSize || 0,
      width: body.width || 0,
      height: body.height || 0,
      prompt: body.prompt || '',
      aspectRatio: body.aspectRatio || '',
      stylePreset: body.stylePreset || '',
      model: body.model || '',
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create media asset', details: String(error) },
      { status: 500 }
    );
  }
}
