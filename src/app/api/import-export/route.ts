import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthNameFromDate, parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'all';

    const result: any = {};

    if (entity === 'all' || entity === 'incomes') {
      result.incomes = await prisma.income.findMany({ where: { deletedAt: null } });
    }
    if (entity === 'all' || entity === 'expenses') {
      result.expenses = await prisma.expense.findMany({ where: { deletedAt: null } });
    }
    if (entity === 'all' || entity === 'cards') {
      result.cards = await prisma.creditCard.findMany({ where: { deletedAt: null } });
      result.purchases = await prisma.creditCardPurchase.findMany({
        where: { deletedAt: null },
        include: { installments: true },
      });
    }
    if (entity === 'all' || entity === 'debts') {
      result.debts = await prisma.debt.findMany({ where: { deletedAt: null } });
    }
    if (entity === 'all' || entity === 'investments') {
      result.investments = await prisma.investment.findMany({ where: { deletedAt: null } });
    }
    if (entity === 'all' || entity === 'budgets') {
      result.budgets = await prisma.budget.findMany();
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Nenhum registro para importar' }, { status: 400 });
    }

    let count = 0;

    if (type === 'incomes') {
      for (const r of records) {
        const parsedDate = r.data ? parseDateInput(r.data) : (r.date ? parseDateInput(r.date) : new Date());
        await prisma.income.create({
          data: {
            date: parsedDate,
            month: r.mes || r.month || getMonthNameFromDate(parsedDate),
            year: r.ano ? parseInt(r.ano, 10) : parsedDate.getFullYear(),
            type: r.tipo || r.type || 'Salário',
            categoryName: r.categoria || r.category || 'Salário',
            description: r.descricao || r.description || 'Receita importada',
            amount: parseFloat(r.valor || r.amount) || 0,
            status: r.status || 'Recebido',
            paymentMethod: r.formaPagamento || r.paymentMethod || 'Pix',
            bankName: r.banco || r.bankName || 'Nubank',
            notes: r.observacoes || r.notes || 'Importado via planilha',
          },
        });
        count++;
      }
    } else if (type === 'expenses') {
      for (const r of records) {
        const parsedDate = r.data ? parseDateInput(r.data) : (r.date ? parseDateInput(r.date) : new Date());
        await prisma.expense.create({
          data: {
            date: parsedDate,
            month: r.mes || r.month || getMonthNameFromDate(parsedDate),
            year: r.ano ? parseInt(r.ano, 10) : parsedDate.getFullYear(),
            type: r.tipo || r.type || 'Despesa',
            categoryName: r.categoria || r.category || 'Outros',
            description: r.descricao || r.description || 'Despesa importada',
            amount: parseFloat(r.valor || r.amount) || 0,
            status: r.status || 'Pago',
            paymentMethod: r.formaPagamento || r.paymentMethod || 'Pix',
            bankName: r.banco || r.bankName || 'Nubank',
            notes: r.observacoes || r.notes || 'Importado via planilha',
          },
        });
        count++;
      }
    }

    await prisma.auditLog.create({
      data: {
        entity: 'Import',
        entityId: 'batch',
        action: 'CREATE',
        details: `Importação de ${count} registros do tipo ${type}`,
      },
    });

    return NextResponse.json({ message: `${count} registros importados com sucesso`, count });
  } catch (error) {
    console.error('Error importing:', error);
    return NextResponse.json({ error: 'Erro ao importar dados' }, { status: 500 });
  }
}
