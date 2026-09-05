# SurePlan                                                                                                                                                                                                                  
  Aplicação web para gestão e acompanhamento de apostas esportivas (surebets). Permite registrar apostas,        controlar ganhos, definir metas e visualizar estatísticas em dashboard.                                      
                                         
  ## Funcionalidades

  - Autenticação com e-mail e senha (NextAuth.js)
  - Registro de apostas com casas, mercados e observações
  - Controle de ganhos e perdas
  - Dashboard com gráficos e resumo financeiro
  - Metas de apostas por período
  - Planilha de acompanhamento
  - Painel administrativo (gerenciar usuários, logs e convites)
  - Sistema de convites para novos cadastros
  - Logs de auditoria de ações

  ## Tecnologias

  - [Next.js 15](https://nextjs.org/)
  - [React 19](https://react.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Prisma ORM](https://www.prisma.io/) + PostgreSQL (Supabase)
  - [NextAuth.js](https://next-auth.js.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Recharts](https://recharts.org/)

  ## Variáveis de ambiente

  Crie um arquivo `.env.local` na raiz com:

  ```env
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=seu_secret_aqui
  NEXTAUTH_URL=http://localhost:3000

  Rodando localmente

  npm install
  npx prisma generate
  npx prisma db push
  npm run dev

  Deploy

  Hospedado na https://vercel.com. Configure as variáveis de ambiente no painel da Vercel antes do deploy:

  - DATABASE_URL
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL (URL de produção)

  ---
