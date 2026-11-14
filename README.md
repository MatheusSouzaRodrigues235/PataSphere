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

### Publicação de animais perdidos e encontrados

Em um banco existente, execute `database/migrations/003_detalhes_ocorrencia.sql` no banco `patasphere` com a conta proprietária da tabela `ocorrencia_pet` antes de iniciar a API atualizada. Em um banco novo, o passo acima que aplica as migrações em ordem já inclui esse arquivo.

O mural público consulta `/api/animais-perdidos`. Entre com uma conta de tutor ou ONG para publicar e gerenciar seus anúncios. As fotos são armazenadas no PostgreSQL com a ocorrência.

Em uma publicação, encaminhe `/api` ao Express no mesmo domínio do frontend e use armazenamento persistente para os logos. Os textos de Termos de Uso e Política de Privacidade precisam estar disponíveis antes de abrir os cadastros ao público.

### Animais para adoção

Em um banco existente, aplique `database/migrations/004_publicacao_adocao.sql` antes de usar a API de adoção.
O painel da ONG cadastra, edita, altera o status e exclui seus próprios animais. As fotos JPG ou PNG (até 4, de 3 MB cada) são convertidas para WebP e armazenadas no PostgreSQL.
O mural público consulta `/api/adocao`, exclui os adotados e mostra os animais de urgência alta primeiro.

### Interesse em adoção

Um tutor autenticado pode revisar as respostas e abrir o WhatsApp da ONG responsável, com uma mensagem pronta. O tutor confirma o envio no WhatsApp. Para o destino, a API usa o WhatsApp público da ONG ou o telefone informado no cadastro, conforme a configuração de exibição de contato.

### Doações recebidas

Em um banco existente, aplique `database/migrations/005_registro_doacoes.sql` com a conta proprietária das tabelas.
A ONG registra manualmente doações financeiras, ração e medicamentos. A data é registrada no horário de Brasília.
O histórico e os anexos são acessíveis apenas pela ONG responsável. Cada registro aceita até quatro imagens ou PDFs de até 5 MB cada.
A visão geral usa as doações recentes da ONG e soma as contribuições financeiras do mês atual.

### Perfis e diretório de ONGs

Em um banco existente, aplique `database/migrations/006_perfis.sql` com a conta proprietária das tabelas e execute `npx prisma generate` na pasta `backend/` com a API parada. Reinicie a API após gerar o cliente.

Os perfis autenticados salvam dados, imagens, privacidade e preferências pelo endpoint `/api/perfis/ong` ou `/api/perfis/tutor`. O diretório e as páginas públicas consultam `/api/ongs`. A ONG escolhe o e-mail e o WhatsApp públicos em Perfil da ONG e cadastra os itens e as orientações em Formas de recebimento.

Alterações de perfil feitas antes dessa versão podem ser recuperadas nas respectivas seções, ao entrar na mesma conta pelo navegador em que foram salvas. Revise os dados antes de salvá-los.
