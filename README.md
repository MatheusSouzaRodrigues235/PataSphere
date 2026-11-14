# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## API de cadastro

Use o serviço PostgreSQL do Windows em `127.0.0.1:5432` e o banco `patasphere`.
Em uma instalação nova, crie o banco e aplique os arquivos de `database/migrations/` em ordem.
Use uma conta de aplicação com acesso ao schema, às tabelas e às sequências.
Em `backend/`, copie `.env.example` para `.env` e configure a URL com a credencial dessa conta.
No pgAdmin, abra o Query Tool no banco `patasphere` do servidor na porta `5432` e execute:

```sql
SELECT id, email, criado_em FROM public.usuario ORDER BY id DESC;
```

Execute `npm ci` e `npm run dev` nessa pasta. Em outro terminal, execute `npm run dev` na raiz.
O Vite encaminha o caminho `/api` para a porta 3000 durante o desenvolvimento.

### Endpoints

- `POST /api/cadastros/tutor` recebe JSON. Campos comuns: `email`, `phone`, `cep`, `city` (cidade e UF), `password` e `consent` (true). Campos de Tutor: `firstName`, `lastName` e `cpf`.
- `POST /api/cadastros/ong` recebe os campos comuns e `organization`, `cnpj`, `street`, `district` e `number`. Aceita JSON ou formulário multipart com `logo` opcional em JPG ou PNG (até 5 MB). No formulário multipart, a caixa de consentimento envia `on`. Os logos ficam em `backend/uploads/logos/`.
- As duas rotas são públicas. Retornam `201` com `id` e `role`, `400` para dados inválidos, `409` para e-mail ou documento em uso e `413` quando o envio excede o limite.

Em uma publicação, encaminhe `/api` ao Express no mesmo domínio do frontend e use armazenamento persistente para os logos. Os textos de Termos de Uso e Política de Privacidade precisam estar disponíveis antes de abrir os cadastros ao público.
