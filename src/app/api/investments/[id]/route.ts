import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateInput } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const inv = await prisma.investment.findUnique({
      where: { id: params.id },
      include: { transactions: { orderBy: { date: 'desc' } } },
    });
    if (!inv || inv.deletedAt) return NextResponse.json({ error: 'Investimento não encontrado' }, { status: 404 });
    return NextResponse.json(inv);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar investimento' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, type, institution, appliedAmount, currentAmount, yieldRate, yieldAmount, startDate, notes, isEmergencyFund } = body;

    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: {
        name,
        type,
        institution,
        appliedAmount: appliedAmount !== undefined ? parseFloat(appliedAmount) : undefined,
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
        yieldRate: yieldRate !== undefined ? parseFloat(yieldRate) : undefined,
        yieldAmount: yieldAmount !== undefined ? parseFloat(yieldAmount) : undefined,
        startDate: startDate ? parseDateInput(startDate) : undefined,
        isEmergencyFund: isEmergencyFund !== undefined ? Boolean(isEmergencyFund) : undefined,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Investment',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Investimento atualizado: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar investimento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Investimento não encontrado' }, { status: 404 });

    await prisma.investment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Investment',
        entityId: params.id,
        action: 'DELETE',
        details: `Investimento excluído: ${existing.name}`,
      },
    });

    return NextResponse.json({ message: 'Investimento excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir investimento' }, { status: 500 });
  }
}
