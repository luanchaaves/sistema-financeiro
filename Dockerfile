# syntax=docker/dockerfile:1

# 1. Base Image com dependências do sistema necessárias para Prisma no Alpine
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# 2. Instalação das dependências do Node
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 3. Build da aplicação Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Garante a existência do diretório public
RUN mkdir -p /app/public

# Gera o client do Prisma e compila o Next.js
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Imagem final de Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/dev.db"

# Cria diretórios de dados persistentes, prisma e estáticos
RUN mkdir -p /app/data /app/prisma /app/public

# Copia arquivos necessários do build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Garante formato Unix (LF) e permissões de execução para o entrypoint
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

# Porta exposta
EXPOSE 3000

# Volume para persistir banco de dados no diretório isolado /app/data
VOLUME ["/app/data"]

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
