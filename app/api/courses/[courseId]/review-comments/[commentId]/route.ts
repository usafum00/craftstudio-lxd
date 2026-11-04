import { NextRequest, NextResponse } from 'next/server';
import { updateReviewComment, deleteReviewComment } from '@/lib/db';
import { ReviewCommentStatus } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const body = await request.json();

    const updates: { status?: ReviewCommentStatus; content?: string } = {};
    if (body.status !== undefined) {
      updates.status = body.status as ReviewCommentStatus;
    }
    if (body.content !== undefined) {
      updates.content = String(body.content);
    }

    const updated = updateReviewComment(commentId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error('Failed to update review comment:', error);
    return NextResponse.json(
      { error: 'Failed to update review comment', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const deleted = deleteReviewComment(commentId);
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete review comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete review comment', details: String(error) },
      { status: 500 }
    );
  }
}
