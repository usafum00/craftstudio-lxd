import { NextResponse } from 'next/server';
import { getQuestionBanks, createQuestionBank } from '@/lib/db';

export async function GET() {
  try {
    const banks = getQuestionBanks();
    return NextResponse.json(banks);
  } catch (error) {
    console.error('Error fetching question banks:', error);
    return NextResponse.json({ error: 'Failed to fetch question banks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, questions } = body;

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Title and valid questions array are required' }, { status: 400 });
    }

    const bank = createQuestionBank({
      title,
      description,
      questions,
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error('Error creating question bank:', error);
    return NextResponse.json({ error: 'Failed to create question bank' }, { status: 500 });
  }
}
