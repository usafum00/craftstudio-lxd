import { NextResponse } from 'next/server';
import { getFlowStatus } from '@/lib/flow-service';

export async function GET() {
  try {
    const status = getFlowStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get Flow status', details: String(error) },
      { status: 500 }
    );
  }
}
