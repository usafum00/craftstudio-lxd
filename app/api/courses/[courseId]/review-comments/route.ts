import { NextRequest, NextResponse } from 'next/server';
import { getReviewComments, createReviewComment } from '@/lib/db';
import { ReviewCommentCategory } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const comments = getReviewComments(courseId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Failed to fetch review comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review comments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();

    const content = (body.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const authorName = (body.authorName || '').trim() || 'Co-Instructional Designer';
    const category = (body.category || 'comment') as ReviewCommentCategory;
    const lessonId = body.lessonId ? String(body.lessonId) : null;
    const lessonTitle = body.lessonTitle ? String(body.lessonTitle) : null;
    const blockId = body.blockId ? String(body.blockId) : null;

    const comment = createReviewComment({
      courseId,
      lessonId,
      lessonTitle,
      blockId,
      authorName,
      content,
      category,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create review comment:', error);
    return NextResponse.json(
      { error: 'Failed to create review comment', details: String(error) },
      { status: 500 }
    );
  }
}
