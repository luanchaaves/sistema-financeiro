import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const fixed = await prisma.fixedExpense.findMany({
      where: { deletedAt: null },
      include: { category: true, bank: true },
      orderBy: { dueDay: 'asc' },
    });
    return NextResponse.json(fixed);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar contas fixas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, categoryName, amount, dueDay, bankId, bankName, paymentMethod, frequency, notes } = body;

    const fixed = await prisma.fixedExpense.create({
      data: {
        name: name || 'Conta Fixa',
        categoryId: categoryId || null,
        categoryName: categoryName || 'Aluguel',
        amount: parseFloat(amount) || 0,
        dueDay: parseInt(dueDay, 10) || 1,
        bankId: bankId || null,
        bankName: bankName || 'Nubank',
        paymentMethod: paymentMethod || 'Pix',
        frequency: frequency || 'Mensal',
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'FixedExpense',
        entityId: fixed.id,
        action: 'CREATE',
        details: `Conta fixa criada: ${fixed.name} - R$ ${fixed.amount}`,
      },
    });

    return NextResponse.json(fixed, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar conta fixa' }, { status: 500 });
  }
}
