import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { payments: { orderBy: { date: 'desc' } } },
    });
    if (!debt || debt.deletedAt) return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });
    return NextResponse.json(debt);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dívida' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      name,
      creditor,
      originalAmount,
      paidAmount,
      totalInstallments,
      currentInstallment,
      interestRate,
      startDate,
      dueDate,
      status,
      notes,
    } = body;

    const existing = await prisma.debt.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });

    const orig = originalAmount !== undefined ? parseFloat(originalAmount) : existing.originalAmount;
    const paid = paidAmount !== undefined ? parseFloat(paidAmount) : existing.paidAmount;
    const remaining = Math.max(0, Math.round((orig - paid) * 100) / 100);

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        name,
        creditor,
        originalAmount: orig,
        paidAmount: paid,
        remainingAmount: remaining,
        currentAmount: remaining,
        totalInstallments: totalInstallments !== undefined ? parseInt(totalInstallments, 10) : undefined,
        currentInstallment: currentInstallment !== undefined ? parseInt(currentInstallment, 10) : undefined,
        interestRate: interestRate !== undefined ? parseFloat(interestRate) : undefined,
        startDate: startDate ? parseDateInput(startDate) : undefined,
        dueDate: dueDate ? parseDateInput(dueDate) : undefined,
        status: status || (remaining <= 0 ? 'Paga' : 'Ativa'),
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Debt',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Dívida atualizada: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar dívida' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.debt.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });

    await prisma.debt.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Debt',
        entityId: params.id,
        action: 'DELETE',
        details: `Dívida excluída: ${existing.name}`,
      },
    });

    return NextResponse.json({ message: 'Dívida excluída com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir dívida' }, { status: 500 });
  }
}
