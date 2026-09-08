import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cards = await prisma.creditCard.findMany({
      where: { deletedAt: null },
      include: {
        bank: true,
        purchases: {
          where: { deletedAt: null },
          include: { installments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Erro ao buscar cartões' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, bankId, bankName, limitTotal, closingDay, dueDay, color, brand } = body;

    const limit = parseFloat(limitTotal) || 0;

    const card = await prisma.creditCard.create({
      data: {
        name: name || 'Cartão',
        bankId: bankId || null,
        bankName: bankName || 'Nubank',
        limitTotal: limit,
        limitAvailable: limit,
        closingDay: parseInt(closingDay, 10) || 28,
        dueDay: parseInt(dueDay, 10) || 5,
        color: color || '#8a05be',
        brand: brand || 'Mastercard',
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCard',
        entityId: card.id,
        action: 'CREATE',
        details: `Cartão criado: ${card.name}`,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating credit card:', error);
    return NextResponse.json({ error: 'Erro ao criar cartão de crédito' }, { status: 500 });
  }
}
