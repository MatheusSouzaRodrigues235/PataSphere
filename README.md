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

### Avistamentos de animais

Em um banco existente, aplique `database/migrations/007_avistamentos.sql` com a conta proprietária do schema e da tabela de ocorrências. Conceda à conta da API acesso de leitura, inserção e atualização em `public.avistamento_pet` e acesso à sequência se essas permissões não forem herdadas.

Qualquer visitante pode registrar um avistamento em um anúncio aberto de animal perdido. O responsável recebe o aviso em Avistamentos recebidos, no menu da conta, e pode marcar o aviso como lido ou conversar com quem o enviou pelo WhatsApp. O menu mostra a quantidade de notificações não lidas.

### Notificações

Aplique `database/migrations/008_notificacoes.sql` após as migrações 006 e 007. A conta da API precisa de acesso de leitura e inserção em `public.interesse_adocao`, leitura, inserção e atualização em `public.notificacao` e acesso à sequência `public.notificacao_id_seq`.

A caixa Notificações exibe avisos para ONGs e tutores conforme as preferências de cada conta. O tutor pode registrar interesse no formulário de adoção para acompanhar mudanças de status. Esse registro também pode gerar um aviso para a ONG. O WhatsApp continua disponível para enviar a mensagem com as respostas. Avistamentos que não geram notificação continuam na caixa de avistamentos do responsável.

Para publicar um comunicado para as contas que ativaram Novidades, execute `npm run noticias:publicar -- "Título" "Mensagem"` em `backend/`, com acesso ao banco do ambiente que receberá o comunicado.

### Solicitações de adoção no painel

Aplique `database/migrations/009_solicitacoes_adocao.sql` após a migração 008. Conceda `UPDATE` em `public.interesse_adocao` à conta da API, caso ainda falte essa permissão.

Na revisão do formulário de adoção, o tutor pode enviar as respostas à ONG ou abrir o WhatsApp com a mensagem pronta. A visão geral da ONG mostra as dez solicitações mais recentes dos seus animais. Há uma solicitação por tutor e animal. Reenvios com respostas diferentes atualizam a solicitação. Registros anteriores continuam disponíveis com os dados que já existiam.

### Gerenciamento de conta

Aplique `database/migrations/010_gerenciamento_conta.sql` e conceda à conta da API leitura, inserção, atualização e exclusão em `public.recuperacao_senha`. Para encerrar contas, a API também precisa excluir de `usuario`, `endereco`, `ocorrencia_pet`, `animal` e `doacao`.

Para enviar a recuperação de senha, configure `PUBLIC_APP_URL` com o endereço público do frontend, `RESEND_API_KEY` com a chave do Resend e `PASSWORD_RESET_FROM` com um remetente do domínio verificado. Em produção, use HTTPS. O link vale 30 minutos e só pode ser usado uma vez.

Tutores e ONGs podem trocar a senha em Segurança da conta ou encerrar a conta no menu do perfil. O encerramento exige a senha atual e uma confirmação explícita e remove a conta e os dados associados. Trocar ou redefinir a senha encerra os logins ativos.

### Favoritos de adoção

Aplique `database/migrations/011_favoritos_adocao.sql` e conceda leitura, inserção e exclusão em `public.favorito_adocao` à conta da API.

Ao entrar como tutor, os favoritos ficam vinculados à conta e aparecem em outros dispositivos. O filtro Favoritos fica no mural de adoção. Visitantes podem continuar salvando animais neste navegador e importar a lista ao entrar como tutor. Os animais adotados ficam fora do mural e os removidos perdem o vínculo de favorito.
