import { NextRequest, NextResponse } from 'next/server';
import { getLessonById, updateLesson, deleteLesson } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Failed to get lesson:', error);
    return NextResponse.json({ error: 'Failed to retrieve lesson' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const body = await req.json();
    const updated = updateLesson(lessonId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json({ lesson: updated });
  } catch (error) {
    console.error('Failed to update lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const success = deleteLesson(lessonId);
    if (!success) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
