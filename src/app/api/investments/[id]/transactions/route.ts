import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { type, amount, date, notes } = body;

    const txAmount = parseFloat(amount) || 0;
    const parsedDate = date ? parseDateInput(date) : new Date();

    const inv = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!inv) return NextResponse.json({ error: 'Investimento não encontrado' }, { status: 404 });

    let newCurrent = inv.currentAmount;
    let newApplied = inv.appliedAmount;

    if (type === 'Aporte') {
      newCurrent += txAmount;
      newApplied += txAmount;
    } else if (type === 'Resgate') {
      newCurrent = Math.max(0, newCurrent - txAmount);
      newApplied = Math.max(0, newApplied - txAmount);
    } else if (type === 'Rendimento') {
      newCurrent += txAmount;
      const newYieldAmount = inv.yieldAmount + txAmount;
      await prisma.investment.update({
        where: { id: params.id },
        data: { yieldAmount: newYieldAmount },
      });
    }

    const [tx, updatedInv] = await prisma.$transaction([
      prisma.investmentTransaction.create({
        data: {
          investmentId: params.id,
          type: type || 'Aporte',
          amount: txAmount,
          date: parsedDate,
          notes: notes || null,
        },
      }),
      prisma.investment.update({
        where: { id: params.id },
        data: {
          currentAmount: Math.round(newCurrent * 100) / 100,
          appliedAmount: Math.round(newApplied * 100) / 100,
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        entity: 'InvestmentTransaction',
        entityId: tx.id,
        action: 'CREATE',
        details: `${tx.type} de R$ ${txAmount} em ${inv.name}`,
      },
    });

    return NextResponse.json({ transaction: tx, investment: updatedInv }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar movimentação de investimento' }, { status: 500 });
  }
}
