import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET() {
  try {
    const investments = await prisma.investment.findMany({
      where: { deletedAt: null },
      include: {
        transactions: { orderBy: { date: 'desc' } },
      },
      orderBy: { currentAmount: 'desc' },
    });

    return NextResponse.json(investments);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar investimentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, institution, appliedAmount, currentAmount, yieldRate, yieldAmount, startDate, notes, isEmergencyFund } = body;

    const applied = parseFloat(appliedAmount) || 0;
    const current = currentAmount !== undefined ? parseFloat(currentAmount) : applied;

    const investment = await prisma.investment.create({
      data: {
        name: name || 'Investimento',
        type: type || 'CDB',
        institution: institution || 'Nubank',
        appliedAmount: applied,
        currentAmount: current,
        yieldRate: parseFloat(yieldRate) || 0,
        yieldAmount: parseFloat(yieldAmount) || 0,
        startDate: startDate ? parseDateInput(startDate) : new Date(),
        isEmergencyFund: Boolean(isEmergencyFund),
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Investment',
        entityId: investment.id,
        action: 'CREATE',
        details: `Investimento cadastrado: ${investment.name} (R$ ${investment.currentAmount})`,
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar investimento' }, { status: 500 });
  }
}
