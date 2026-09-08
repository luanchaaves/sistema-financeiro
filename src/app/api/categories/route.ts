import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = {};
    if (type && type !== 'TODOS') where.type = type;

    const categories = await prisma.category.findMany({
      where,
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, color, icon } = body;

    const category = await prisma.category.create({
      data: {
        name: name || 'Nova Categoria',
        type: type || 'EXPENSE',
        color: color || '#38bdf8',
        icon: icon || 'Tag',
        isCustom: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
