import { NextRequest, NextResponse } from 'next/server';
import { duplicateCourse } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const duplicated = duplicateCourse(courseId);
    if (!duplicated) {
      return NextResponse.json({ error: 'Failed to duplicate course' }, { status: 404 });
    }
    return NextResponse.json({ course: duplicated }, { status: 201 });
  } catch (error) {
    console.error('Failed to duplicate course:', error);
    return NextResponse.json({ error: 'Failed to duplicate course' }, { status: 500 });
  }
}
