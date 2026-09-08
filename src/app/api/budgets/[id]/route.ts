import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { categoryName, dimension, year, month, plannedAmount, notes } = body;

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: {
        categoryName,
        dimension,
        year: year ? parseInt(year, 10) : undefined,
        month,
        plannedAmount: plannedAmount !== undefined ? parseFloat(plannedAmount) : undefined,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Budget',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Orçamento atualizado: ${updated.categoryName} - R$ ${updated.plannedAmount}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.budget.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });

    await prisma.budget.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        entity: 'Budget',
        entityId: params.id,
        action: 'DELETE',
        details: `Orçamento excluído: ${existing.categoryName}`,
      },
    });

    return NextResponse.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir orçamento' }, { status: 500 });
  }
}
