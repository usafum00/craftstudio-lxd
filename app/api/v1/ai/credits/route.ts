import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceCredits, topUpCredits, resetCredits, getCreditLogs } from '@/lib/db';

export async function GET() {
  try {
    const credits = getWorkspaceCredits();
    const logs = getCreditLogs(20);
    return NextResponse.json({ credits, logs });
  } catch (error) {
    console.error('Failed to get credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'topup';

    let credits;
    if (action === 'reset') {
      credits = resetCredits();
    } else {
      const amount = typeof body.amount === 'number' ? body.amount : 10000;
      credits = topUpCredits(amount);
    }

    const logs = getCreditLogs(20);
    return NextResponse.json({ success: true, credits, logs });
  } catch (error) {
    console.error('Failed to update credits:', error);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}
