import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, type, color, icon } = body;

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { name, type, color, icon },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
