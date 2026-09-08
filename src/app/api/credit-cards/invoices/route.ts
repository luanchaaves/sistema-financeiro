import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MONTHS } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const installments = await prisma.creditCardInstallment.findMany({
      where: {
        deletedAt: null,
        ...(cardId && cardId !== 'TODOS' ? { purchase: { cardId } } : {}),
        ...(year && year !== 'TODOS' ? { invoiceYear: parseInt(year, 10) } : {}),
        ...(month && month !== 'TODOS' ? { invoiceMonth: month } : {}),
      },
      include: {
        purchase: {
          include: { card: true, category: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Group installments by Card + Month + Year to create invoice aggregates
    const invoiceMap = new Map<string, {
      cardId: string;
      cardName: string;
      cardColor: string;
      brand?: string;
      month: string;
      year: number;
      totalAmount: number;
      paidAmount: number;
      purchasesCount: number;
      status: string;
      dueDate: Date;
      items: any[];
    }>();

    installments.forEach((inst) => {
      const card = inst.purchase?.card;
      if (!card) return;

      const key = `${card.id}-${inst.invoiceMonth}-${inst.invoiceYear}`;
      const existing = invoiceMap.get(key) || {
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color,
        brand: card.brand,
        month: inst.invoiceMonth,
        year: inst.invoiceYear,
        totalAmount: 0,
        paidAmount: 0,
        purchasesCount: 0,
        status: 'Fatura Aberta',
        dueDate: inst.dueDate,
        items: [],
      };

      existing.totalAmount += inst.amount;
      existing.purchasesCount += 1;
      if (inst.status === 'Fatura Paga') {
        existing.paidAmount += inst.amount;
      }

      existing.items.push({
        id: inst.id,
        purchaseId: inst.purchaseId,
        installmentNumber: inst.installmentNumber,
        totalInstallments: inst.totalInstallments,
        amount: inst.amount,
        status: inst.status,
        dueDate: inst.dueDate,
        notes: inst.notes,
        purchase: {
          id: inst.purchase.id,
          date: inst.purchase.date,
          description: inst.purchase.description,
          categoryName: inst.purchase.categoryName,
          totalAmount: inst.purchase.totalAmount,
          notes: inst.purchase.notes,
        },
      });

      invoiceMap.set(key, existing);
    });

    // Determine invoice status and sort chronologically
    const result = Array.from(invoiceMap.values()).map((inv) => {
      let status = 'Fatura Aberta';
      if (inv.paidAmount >= inv.totalAmount && inv.totalAmount > 0) {
        status = 'Fatura Paga';
      } else if (new Date() > new Date(inv.dueDate) && inv.paidAmount < inv.totalAmount) {
        status = 'Fatura Vencida';
      }

      return {
        ...inv,
        status,
        totalAmount: Math.round(inv.totalAmount * 100) / 100,
        paidAmount: Math.round(inv.paidAmount * 100) / 100,
      };
    });

    // Sort by Year then Month Index
    result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const mIdxA = MONTHS.indexOf(a.month as any);
      const mIdxB = MONTHS.indexOf(b.month as any);
      return mIdxA - mIdxB;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Erro ao consolidar faturas' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, month, year, status } = body;

    if (!cardId || !month || !year || !status) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    // Update all installments matching card, month, year
    await prisma.creditCardInstallment.updateMany({
      where: {
        invoiceMonth: month,
        invoiceYear: parseInt(year, 10),
        purchase: { cardId },
      },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCardInvoice',
        entityId: `${cardId}-${month}-${year}`,
        action: 'UPDATE',
        details: `Status da fatura alterado para ${status} (${month}/${year})`,
      },
    });

    return NextResponse.json({ message: 'Fatura atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fatura' }, { status: 500 });
  }
}
