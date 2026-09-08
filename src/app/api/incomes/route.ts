import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMonthNameFromDate, parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const bank = searchParams.get('bank');
    const search = searchParams.get('search');

    const where: any = {
      deletedAt: null,
    };

    if (month && month !== 'TODOS') where.month = month;
    if (year && year !== 'TODOS') where.year = parseInt(year, 10);
    if (type && type !== 'TODOS') where.type = type;
    if (category && category !== 'TODOS') where.categoryName = category;
    if (status && status !== 'TODOS') where.status = status;
    if (bank && bank !== 'TODOS') where.bankName = bank;

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { categoryName: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const incomes = await prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        bank: true,
      },
    });

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return NextResponse.json({ error: 'Erro ao buscar receitas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      type,
      categoryName,
      categoryId,
      description,
      amount,
      status,
      paymentMethod,
      bankName,
      bankId,
      notes,
      isRecurring,
    } = body;

    const parsedDate = date ? parseDateInput(date) : new Date();
    const month = body.month || getMonthNameFromDate(parsedDate);
    const year = body.year || parsedDate.getFullYear();

    const income = await prisma.income.create({
      data: {
        date: parsedDate,
        month,
        year,
        type: type || 'Salário',
        categoryId: categoryId || null,
        categoryName: categoryName || 'Salário',
        description: description || 'Receita',
        amount: parseFloat(amount) || 0,
        status: status || 'Recebido',
        paymentMethod: paymentMethod || 'Pix',
        bankId: bankId || null,
        bankName: bankName || 'Nubank',
        notes: notes || null,
        isRecurring: Boolean(isRecurring),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Income',
        entityId: income.id,
        action: 'CREATE',
        details: `Receita criada: ${income.description} - R$ ${income.amount}`,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar receita' }, { status: 500 });
  }
}
