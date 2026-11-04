import { NextRequest, NextResponse } from 'next/server';
import { launchFlowBrowser } from '@/lib/flow-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'side-by-side' ? 'side-by-side' : 'auth';
    const result = launchFlowBrowser(mode);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Launch failed' },
      { status: 500 }
    );
  }
}
