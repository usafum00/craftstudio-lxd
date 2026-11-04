import { NextRequest, NextResponse } from 'next/server';
import { createLesson } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const lesson = createLesson(courseId, body);
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Failed to create lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
