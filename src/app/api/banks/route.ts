import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      where: { isArchived: false },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(banks);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar bancos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, initialBalance, color, icon } = body;

    const bank = await prisma.bank.create({
      data: {
        name: name || 'Novo Banco',
        type: type || 'CHECKING',
        initialBalance: parseFloat(initialBalance) || 0,
        color: color || '#38bdf8',
        icon: icon || 'Building2',
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar banco' }, { status: 500 });
  }
}
