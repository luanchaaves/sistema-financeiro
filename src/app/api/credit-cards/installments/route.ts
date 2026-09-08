import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const where: any = {
      deletedAt: null,
    };

    if (month && month !== 'TODOS') where.invoiceMonth = month;
    if (year && year !== 'TODOS') where.invoiceYear = parseInt(year, 10);
    if (status && status !== 'TODOS') where.status = status;
    if (cardId && cardId !== 'TODOS') {
      where.purchase = { cardId };
    }

    const installments = await prisma.creditCardInstallment.findMany({
      where,
      include: {
        purchase: {
          include: {
            card: true,
            category: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(installments);
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json({ error: 'Erro ao buscar parcelas' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amount, invoiceMonth, invoiceYear, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da parcela é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.creditCardInstallment.update({
      where: { id },
      data: {
        status,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        invoiceMonth,
        invoiceYear: invoiceYear ? parseInt(invoiceYear, 10) : undefined,
        notes,
      },
      include: { purchase: true },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCardInstallment',
        entityId: id,
        action: 'UPDATE',
        details: `Parcela atualizada: ${updated.installmentNumber}/${updated.totalInstallments} (${updated.status})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar parcela' }, { status: 500 });
  }
}
