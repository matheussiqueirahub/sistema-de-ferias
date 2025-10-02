# Sistema de Férias — Prefeitura do Jaboatão dos Guararapes

Aplicação completa para solicitação e gestão de férias de servidores:
- Servidor solicita período em calendário.
- Gerente aprova/reprova e registra observação.
- Notificações para Servidor e Secretário Executivo.
- Secretário acompanha controle geral.

## Stack
- Backend: Node.js + Express + TypeScript + Prisma (PostgreSQL)
- Frontend: HTML/CSS/JS estático (calendário com Flatpickr, inline)
- Banco: Postgres (Docker) + Adminer (opcional)

## Requisitos
- Node 18+
- Docker Desktop (para Postgres)
- npm

## Configuração
```bash
cd backend
copy .env.example .env  # Windows
# ou: cp .env.example .env
```
Ajuste `DATABASE_URL` se necessário.

## Subir Banco (Docker)
```bash
# Com Docker Desktop aberto
docker compose up -d db
```
Adminer (opcional): http://localhost:8080 (system: PostgreSQL; servidor: db; user: postgres; senha: postgres; db: ferias)

## Prisma (gerar, migrar, seed)
```bash
npm run prisma_generate
npx prisma migrate dev --name init
npm run seed
```

## Rodar API + Frontend
```bash
npm run dev
```
Acesse: http://localhost:3000

Contas seed:
- Servidor: servidor@jaboatao.pe.gov.br / senha123
- Gerente:  gerente@jaboatao.pe.gov.br / senha123
- Secretário: exec@jaboatao.pe.gov.br / senha123

## Logo e Cores
Coloque a logo oficial em `frontend/assets/logo-jaboatao.png`.
A paleta utiliza tons de azul primário/escuro e detalhes em amarelo/verde.

## Scripts úteis
- `npm run prisma_studio` → abre o Prisma Studio
- `npm run build && npm start` → build TS e inicia em JS

## Rotas principais
- Auth: `POST /auth/register`, `POST /auth/login`
- Usuários: `GET /users/me`, `GET /users/managers`, `GET /users/executives`
- Férias: `POST /ferias`, `GET /ferias/mine`, `GET /ferias/pending`, `POST /ferias/:id/decide`, `GET /ferias/all`, `GET /ferias/history/:id`
- Notificações: `GET /notifications`, `POST /notifications/:id/read`

---
Se quiser, posso trocar o calendário por outro componente visual, adicionar e-mails de notificação e relatórios (CSV/PDF).
