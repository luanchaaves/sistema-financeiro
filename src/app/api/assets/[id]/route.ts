import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!asset || asset.deletedAt) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar bem' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      category,
      estimatedValue,
      purchaseValue,
      purchaseDate,
      brand,
      modelYear,
      color,
      icon,
      notes,
    } = body;

    const existing = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 });
    }

    const updated = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? type : existing.type,
        category: category !== undefined ? category : existing.category,
        estimatedValue: estimatedValue !== undefined ? parseFloat(estimatedValue) : existing.estimatedValue,
        purchaseValue:
          purchaseValue !== undefined && purchaseValue !== ''
            ? parseFloat(purchaseValue)
            : purchaseValue === ''
            ? null
            : existing.purchaseValue,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existing.purchaseDate,
        brand: brand !== undefined ? brand : existing.brand,
        modelYear: modelYear !== undefined ? (modelYear ? parseInt(modelYear, 10) : null) : existing.modelYear,
        color: color !== undefined ? color : existing.color,
        icon: icon !== undefined ? icon : existing.icon,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Asset',
        entityId: updated.id,
        action: 'UPDATE',
        details: `Bem atualizado: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Erro ao atualizar bem' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 });
    }

    await prisma.asset.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Asset',
        entityId: params.id,
        action: 'DELETE',
        details: `Bem excluído: ${existing.name}`,
      },
    });

    return NextResponse.json({ message: 'Bem excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Erro ao excluir bem' }, { status: 500 });
  }
}
