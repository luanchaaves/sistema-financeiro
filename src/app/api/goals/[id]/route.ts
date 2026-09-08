import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const goal = await prisma.financialGoal.findUnique({ where: { id: params.id } });
    if (!goal || goal.deletedAt) return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar meta' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, category, targetAmount, currentAmount, deadline, color, icon, notes } = body;

    const updated = await prisma.financialGoal.update({
      where: { id: params.id },
      data: {
        name,
        category,
        targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : undefined,
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
        deadline: deadline ? parseDateInput(deadline) : undefined,
        color,
        icon,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FinancialGoal',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Meta atualizada: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar meta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.financialGoal.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });

    await prisma.financialGoal.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FinancialGoal',
        entityId: params.id,
        action: 'DELETE',
        details: `Meta excluída: ${existing.name}`,
      },
    });

    return NextResponse.json({ message: 'Meta excluída com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir meta' }, { status: 500 });
  }
}
