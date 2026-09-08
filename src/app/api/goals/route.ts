import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET() {
  try {
    const goals = await prisma.financialGoal.findMany({
      where: { deletedAt: null },
      orderBy: { targetAmount: 'desc' },
    });

    const enriched = goals.map((g) => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      return {
        ...g,
        progressPercentage: Math.round(progress * 10) / 10,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar metas financeiras' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, targetAmount, currentAmount, deadline, color, icon, notes } = body;

    const goal = await prisma.financialGoal.create({
      data: {
        name: name || 'Nova Meta',
        category: category || 'Geral',
        targetAmount: parseFloat(targetAmount) || 0,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? parseDateInput(deadline) : null,
        color: color || '#10b981',
        icon: icon || 'Target',
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FinancialGoal',
        entityId: goal.id,
        action: 'CREATE',
        details: `Meta criada: ${goal.name} (Alvo: R$ ${goal.targetAmount})`,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
  }
}
