import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthNameFromDate, parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { category: true, bank: true },
    });

    if (!expense || expense.deletedAt) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar despesa' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      date,
      type,
      categoryName,
      categoryId,
      description,
      amount,
      status,
      paymentMethod,
      bankName,
      bankId,
      notes,
      isRecurring,
    } = body;

    const parsedDate = date ? parseDateInput(date) : undefined;
    const month = parsedDate ? getMonthNameFromDate(parsedDate) : body.month;
    const year = parsedDate ? parsedDate.getFullYear() : body.year;

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        date: parsedDate,
        month,
        year,
        type,
        categoryName,
        categoryId: categoryId || null,
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        status,
        paymentMethod,
        bankName,
        bankId: bankId || null,
        notes,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Expense',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Despesa atualizada: ${updated.description} - R$ ${updated.amount}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Erro ao atualizar despesa' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    await prisma.expense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Expense',
        entityId: params.id,
        action: 'DELETE',
        details: `Despesa excluída: ${existing.description} - R$ ${existing.amount}`,
      },
    });

    return NextResponse.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 });
  }
}
