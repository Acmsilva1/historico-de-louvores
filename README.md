# Histórico de Louvores

App web para lançar e consultar louvores cantados, com alerta de repetição.

- **UI:** Next.js na VPS (`historico-de-louvores.duckdns.org`)
- **Dados:** Supabase (Postgres)
- **Secrets:** `.env` só na máquina local / `/opt/louvores/.env` na VPS

## Local

```bash
cp .env.example .env   # se ainda nao tiver
npm install
npm run db:migrate
npm run import -- "C:\Users\...\Downloads\LISTA DE LOUVORES JA CANTADOS.xlsx"
npm run dev
```

PIN padrão: variável `APP_PIN` no `.env`.

## VPS

1. Clonar em `/opt/louvores`
2. Colocar `.env` na pasta (nunca no git)
3. `docker compose up -d --build`
4. Nginx: `ops/nginx-historico-de-louvores.conf`
5. Certbot para o domínio DuckDNS
6. Opcional: copiar `ops/deploy.conf` para `/opt/deploy/config/louvores.conf`
