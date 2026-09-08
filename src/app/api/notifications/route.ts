import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'Todas as notificações marcadas como lidas' });
    }

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: isRead !== undefined ? Boolean(isRead) : true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.notification.delete({ where: { id } });
    } else {
      await prisma.notification.deleteMany();
    }

    return NextResponse.json({ message: 'Notificações excluídas' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir notificações' }, { status: 500 });
  }
}
