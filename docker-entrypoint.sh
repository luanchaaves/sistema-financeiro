#!/bin/sh
set -e

echo "🚀 [Docker] Inicializando Sistema de Controle Financeiro..."

mkdir -p /app/data

echo "📦 [Docker] Sincronizando schema do banco de dados..."
npx prisma db push --schema=/app/prisma/schema.prisma --skip-generate --accept-data-loss || true

if [ "$AUTO_SEED" = "true" ]; then
  echo "🌱 [Docker] Verificando dados iniciais (seed)..."
  npx tsx /app/prisma/seed.ts || true
fi

echo "✨ [Docker] Banco de dados pronto! Iniciando servidor Next.js em 0.0.0.0:3000..."
exec "$@"
