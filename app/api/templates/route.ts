import { NextResponse } from 'next/server';
import { getBlockTemplates, createBlockTemplate } from '@/lib/db';

export async function GET() {
  try {
    const templates = getBlockTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching block templates:', error);
    return NextResponse.json({ error: 'Failed to fetch block templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, blocks } = body;

    if (!name || !blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Name and valid blocks array are required' }, { status: 400 });
    }

    const template = createBlockTemplate({
      name,
      description,
      category,
      blocks,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating block template:', error);
    return NextResponse.json({ error: 'Failed to create block template' }, { status: 500 });
  }
}
