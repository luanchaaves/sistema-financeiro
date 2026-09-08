import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, type, initialBalance, color, icon, isArchived } = body;

    const updated = await prisma.bank.update({
      where: { id: params.id },
      data: {
        name,
        type,
        initialBalance: initialBalance !== undefined ? parseFloat(initialBalance) : undefined,
        color,
        icon,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar banco' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.bank.update({
      where: { id: params.id },
      data: { isArchived: true },
    });
    return NextResponse.json({ message: 'Banco arquivado com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir banco' }, { status: 500 });
  }
}
