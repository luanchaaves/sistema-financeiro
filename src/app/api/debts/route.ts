import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      where: { deletedAt: null },
      include: {
        payments: { orderBy: { date: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = debts.map((d) => {
      const progress = d.originalAmount > 0 ? (d.paidAmount / d.originalAmount) * 100 : 0;
      return {
        ...d,
        progressPercentage: Math.round(progress * 10) / 10,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dívidas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      creditor,
      originalAmount,
      totalInstallments,
      currentInstallment,
      interestRate,
      startDate,
      dueDate,
      notes,
    } = body;

    const original = parseFloat(originalAmount) || 0;
    const installments = parseInt(totalInstallments, 10) || 1;
    const currentInst = parseInt(currentInstallment, 10) || 0;
    const installmentAmt = Math.round((original / installments) * 100) / 100;
    const paid = Math.round((currentInst * installmentAmt) * 100) / 100;
    const remaining = Math.max(0, Math.round((original - paid) * 100) / 100);

    const debt = await prisma.debt.create({
      data: {
        name: name || 'Dívida',
        creditor: creditor || 'Credor',
        originalAmount: original,
        currentAmount: remaining,
        paidAmount: paid,
        remainingAmount: remaining,
        totalInstallments: installments,
        currentInstallment: currentInst,
        installmentAmount: installmentAmt,
        interestRate: parseFloat(interestRate) || 0,
        startDate: startDate ? parseDateInput(startDate) : new Date(),
        dueDate: dueDate ? parseDateInput(dueDate) : null,
        status: remaining <= 0 ? 'Paga' : 'Ativa',
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Debt',
        entityId: debt.id,
        action: 'CREATE',
        details: `Dívida cadastrada: ${debt.name} (Total: R$ ${debt.originalAmount})`,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar dívida' }, { status: 500 });
  }
}
