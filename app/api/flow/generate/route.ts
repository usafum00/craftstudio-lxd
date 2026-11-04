import { NextRequest, NextResponse } from 'next/server';
import { generateFlowMedia } from '@/lib/flow-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const aspectRatio = body.aspectRatio || '16:9';
    const stylePreset = body.stylePreset || 'Photorealistic Office';
    const apiKey = body.apiKey ? String(body.apiKey).trim() : undefined;
    const engine = (body.engine || 'nano-banana-pro') as 'nano-banana-pro' | 'flow-accelerated' | 'imagen-3';

    const result = await generateFlowMedia({
      prompt,
      aspectRatio,
      stylePreset,
      apiKey,
      engine,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, message: result.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
