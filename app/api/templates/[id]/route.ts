import { NextResponse } from 'next/server';
import { deleteBlockTemplate } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteBlockTemplate(id);
    if (!success) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block template:', error);
    return NextResponse.json({ error: 'Failed to delete block template' }, { status: 500 });
  }
}
