import express from 'express';
import multer from 'multer';
import { lostAnimalRoutes } from './lost-animals.js';
import { authRoutes } from './auth.js';
import { PrismaClient } from '@prisma/client';
import { logoDirectory, registrationRoutes } from './registration.js';

if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no ambiente do backend.');
const prisma = new PrismaClient();
try {
  await prisma.$connect();
} catch {
  console.error('Não foi possível conectar ao PostgreSQL. Confira DATABASE_URL e o serviço db.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
const auth = authRoutes(prisma);
app.use('/api/animais-perdidos', lostAnimalRoutes(prisma, auth.sessionAccountId));
app.use(express.json({ limit: '16kb' }));
app.use('/api/uploads/logos', express.static(logoDirectory, { index: false }));
app.use('/api/auth', auth.router);
app.use('/api/cadastros', registrationRoutes(prisma));
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError || error.status === 413) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE' || error.status === 413;
    return res.status(tooLarge ? 413 : 400).json({
      message: tooLarge ? 'O cadastro excede o limite. O logo pode ter até 5 MB.' : 'O formulário contém arquivos ou campos inválidos.',
    });
  }
  if (error.status === 400) return res.status(400).json({ message: 'O formulário enviado é inválido.' });
  console.error('Falha na API:', error.code ?? error.name);
  return res.status(500).json({ message: 'Não foi possível concluir a operação. Tente novamente.' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log('API do PataSphere na porta ' + port));
