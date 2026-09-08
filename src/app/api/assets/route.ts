import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const assets = await prisma.asset.findMany({
      where: {
        deletedAt: null,
        ...(category && category !== 'TODOS' ? { category } : {}),
        ...(type && type !== 'TODOS' ? { type } : {}),
      },
      orderBy: { estimatedValue: 'desc' },
    });

    // Summary calculations
    const totalEstimatedValue = assets.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);

    const byCategory: Record<string, { count: number; totalValue: number; items: any[] }> = {};

    assets.forEach((item) => {
      const cat = item.category || 'Outros';
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, totalValue: 0, items: [] };
      }
      byCategory[cat].count += 1;
      byCategory[cat].totalValue += item.estimatedValue;
      byCategory[cat].items.push(item);
    });

    return NextResponse.json({
      items: assets,
      summary: {
        totalAssets: assets.length,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
        totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
        byCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Erro ao buscar patrimônio' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!name || estimatedValue === undefined) {
      return NextResponse.json({ error: 'Nome e Valor de Mercado são obrigatórios' }, { status: 400 });
    }

    const created = await prisma.asset.create({
      data: {
        name,
        type: type || 'OUTRO',
        category: category || 'Outro',
        estimatedValue: parseFloat(estimatedValue),
        purchaseValue: purchaseValue !== undefined && purchaseValue !== '' ? parseFloat(purchaseValue) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        brand: brand || null,
        modelYear: modelYear ? parseInt(modelYear, 10) : null,
        color: color || '#38bdf8',
        icon: icon || 'Box',
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'Asset',
        entityId: created.id,
        action: 'CREATE',
        details: `Bem cadastrado: ${created.name} (${created.category}) no valor de R$ ${created.estimatedValue}`,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar bem' }, { status: 500 });
  }
}
