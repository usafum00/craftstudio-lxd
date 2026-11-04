import { NextRequest, NextResponse } from 'next/server';
import { getQuestionBankById, updateQuestionBank, deleteQuestionBank } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bank = getQuestionBankById(id);
    if (!bank) {
      return NextResponse.json({ error: 'Question Bank not found' }, { status: 404 });
    }
    return NextResponse.json({ questionBank: bank });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch question bank', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = updateQuestionBank(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Question Bank not found' }, { status: 404 });
    }
    return NextResponse.json({ questionBank: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update question bank', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteQuestionBank(id);
    if (!success) {
      return NextResponse.json({ error: 'Question Bank not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete question bank', details: String(error) },
      { status: 500 }
    );
  }
}
