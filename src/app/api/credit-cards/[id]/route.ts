import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const card = await prisma.creditCard.findUnique({
      where: { id: params.id },
      include: {
        bank: true,
        purchases: {
          where: { deletedAt: null },
          include: { installments: true },
        },
      },
    });

    if (!card || card.deletedAt) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar cartão' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, bankId, bankName, limitTotal, limitAvailable, closingDay, dueDay, color, brand, isActive } = body;

    const updated = await prisma.creditCard.update({
      where: { id: params.id },
      data: {
        name,
        bankId: bankId || null,
        bankName,
        limitTotal: limitTotal !== undefined ? parseFloat(limitTotal) : undefined,
        limitAvailable: limitAvailable !== undefined ? parseFloat(limitAvailable) : undefined,
        closingDay: closingDay !== undefined ? parseInt(closingDay, 10) : undefined,
        dueDay: dueDay !== undefined ? parseInt(dueDay, 10) : undefined,
        color,
        brand,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCard',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Cartão atualizado: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating credit card:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cartão' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const card = await prisma.creditCard.findUnique({ where: { id: params.id } });
    if (!card) return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });

    await prisma.creditCard.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'CreditCard',
        entityId: params.id,
        action: 'DELETE',
        details: `Cartão excluído: ${card.name}`,
      },
    });

    return NextResponse.json({ message: 'Cartão excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir cartão' }, { status: 500 });
  }
}
