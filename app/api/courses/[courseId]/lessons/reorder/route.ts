import { NextRequest, NextResponse } from 'next/server';
import { reorderLessons } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { lessonIds } = await req.json();

    if (!Array.isArray(lessonIds)) {
      return NextResponse.json({ error: 'lessonIds must be an array of string IDs' }, { status: 400 });
    }

    reorderLessons(courseId, lessonIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder lessons:', error);
    return NextResponse.json({ error: 'Failed to reorder lessons' }, { status: 500 });
  }
}
