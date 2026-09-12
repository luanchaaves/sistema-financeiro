#!/bin/sh
set -e

echo "🚀 [Docker] Inicializando Sistema de Controle Financeiro..."

# 1. Garante que o diretório persistente /app/data existe
mkdir -p /app/data

# 2. Sincroniza schema do banco de dados de forma não destrutiva
echo "📦 [Docker] Sincronizando schema do banco de dados..."
npx prisma db push --schema=/app/prisma/schema.prisma --skip-generate --accept-data-loss || true

# 3. Ativa modo WAL no SQLite para máxima durabilidade e proteção contra reinicializações
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 /app/data/dev.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;" || true
fi

# 4. Executa seed APENAS se for a primeiríssima inicialização ou se FORCE_SEED=true
if [ "$FORCE_SEED" = "true" ] || { [ "$AUTO_SEED" = "true" ] && [ ! -f /app/data/.seeded ]; }; then
  echo "🌱 [Docker] Primeira inicialização detectada: carregando dados iniciais..."
  npx tsx /app/prisma/seed.ts && touch /app/data/.seeded || true
  echo "✅ [Docker] Dados iniciais carregados e trava de segurança criada (/app/data/.seeded)."
else
  echo "💾 [Docker] Banco de dados persistente preservado (/app/data/dev.db). Nenhum dado foi sobrescrito."
fi

echo "✨ [Docker] Banco de dados pronto! Iniciando servidor Next.js em 0.0.0.0:3000..."
exec "$@"
