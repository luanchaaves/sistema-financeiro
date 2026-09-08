import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.fixedExpense.findUnique({
      where: { id: params.id },
      include: { category: true, bank: true },
    });
    if (!item || item.deletedAt) return NextResponse.json({ error: 'Conta fixa não encontrada' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar conta fixa' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, categoryId, categoryName, amount, dueDay, bankId, bankName, paymentMethod, frequency, isActive, notes } = body;

    const updated = await prisma.fixedExpense.update({
      where: { id: params.id },
      data: {
        name,
        categoryId: categoryId || null,
        categoryName,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDay: dueDay !== undefined ? parseInt(dueDay, 10) : undefined,
        bankId: bankId || null,
        bankName,
        paymentMethod,
        frequency,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FixedExpense',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Conta fixa atualizada: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar conta fixa' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.fixedExpense.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Conta fixa não encontrada' }, { status: 404 });

    await prisma.fixedExpense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FixedExpense',
        entityId: params.id,
        action: 'DELETE',
        details: `Conta fixa excluída: ${existing.name}`,
      },
    });

    return NextResponse.json({ message: 'Conta fixa excluída com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir conta fixa' }, { status: 500 });
  }
}
