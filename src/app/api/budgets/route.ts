import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where: any = {};
    if (year && year !== 'TODOS') where.year = parseInt(year, 10);
    if (month && month !== 'TODOS') where.month = month;

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { plannedAmount: 'desc' },
    });

    // Also fetch actual expense totals for these categories to enrich budget execution
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        ...(year && year !== 'TODOS' ? { year: parseInt(year, 10) } : {}),
        ...(month && month !== 'TODOS' ? { month } : {}),
      },
    });

    const enriched = budgets.map((b) => {
      const actualSum = expenses
        .filter((e) => e.categoryName.toLowerCase() === b.categoryName.toLowerCase())
        .reduce((sum, e) => sum + e.amount, 0);

      const variance = Math.round((b.plannedAmount - actualSum) * 100) / 100;
      const pct = b.plannedAmount > 0 ? (actualSum / b.plannedAmount) * 100 : 0;

      let statusBadge: 'ok' | 'warning' | 'danger' = 'ok';
      if (pct > 100) statusBadge = 'danger';
      else if (pct >= 80) statusBadge = 'warning';

      return {
        ...b,
        actualAmount: Math.round(actualSum * 100) / 100,
        variance,
        percentageUsed: Math.round(pct * 10) / 10,
        statusBadge,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, categoryName, dimension, year, month, plannedAmount, notes } = body;

    const budget = await prisma.budget.create({
      data: {
        categoryId: categoryId || null,
        categoryName: categoryName || 'Geral',
        dimension: dimension || 'Despesa',
        year: parseInt(year, 10) || new Date().getFullYear(),
        month: month || null,
        plannedAmount: parseFloat(plannedAmount) || 0,
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Budget',
        entityId: budget.id,
        action: 'CREATE',
        details: `Orçamento cadastrado: ${budget.categoryName} - R$ ${budget.plannedAmount}`,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar orçamento' }, { status: 500 });
  }
}
