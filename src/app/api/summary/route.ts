import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FinancialService } from '@/lib/financial-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const selectedYear = yearParam && yearParam !== 'TODOS' ? parseInt(yearParam, 10) : undefined;
    const selectedMonth = monthParam && monthParam !== 'TODOS' ? monthParam : undefined;

    const [incomes, expenses, fixedExpenses, installments, banks, debts, investments, budgets, assets] = await Promise.all([
      prisma.income.findMany({ where: { deletedAt: null } }),
      prisma.expense.findMany({ where: { deletedAt: null } }),
      prisma.fixedExpense.findMany({ where: { deletedAt: null, isActive: true } }),
      prisma.creditCardInstallment.findMany({
        where: { deletedAt: null },
        include: {
          purchase: {
            include: {
              card: true,
            },
          },
        },
      }),
      prisma.bank.findMany({ where: { isArchived: false } }),
      prisma.debt.findMany({ where: { deletedAt: null } }),
      prisma.investment.findMany({ where: { deletedAt: null } }),
      prisma.budget.findMany(),
      prisma.asset.findMany({ where: { deletedAt: null } }),
    ]);

    const summary = FinancialService.computeDashboard({
      incomes,
      expenses,
      fixedExpenses,
      installments,
      banks,
      debts,
      investments,
      budgets,
      assets,
      selectedYear,
      selectedMonth,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error computing summary:', error);
    return NextResponse.json({ error: 'Erro ao processar dados do painel' }, { status: 500 });
  }
}
