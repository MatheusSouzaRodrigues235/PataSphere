import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { ongRegistration, tutorRegistration } from './registration-dto.js';

export const logoDirectory = fileURLToPath(new URL('../uploads/logos/', import.meta.url));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 12, fieldSize: 1024, parts: 14 },
});

async function processLogo(file) {
  const image = sharp(file.buffer, { limitInputPixels: 16_000_000 });
  const { format } = await image.metadata();
  if (format !== 'jpeg' && format !== 'png') throw new Error('Formato inválido');
  return image.rotate().resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true }).webp().toBuffer();
}

function register(prisma, role, schema) {
  return async (req, res) => {
    const input = schema.safeParse(req.body);
    if (!input.success) {
      const fields = Object.fromEntries(input.error.issues.map(({ path, message }) => [path[0] ?? 'body', message]));
      return res.status(400).json({ message: 'Revise os dados do cadastro.', fields });
    }

    const data = input.data;
    let logo;
    if (req.file) {
      try {
        logo = await processLogo(req.file);
      } catch {
        return res.status(400).json({ message: 'Envie um logo JPG ou PNG válido, de até 16 megapixels.' });
      }
    }

    const fileName = logo ? randomUUID() + '.webp' : null;
    const filePath = fileName ? join(logoDirectory, fileName) : null;
    const logoUrl = fileName ? '/api/uploads/logos/' + fileName : null;
    const profile = role === 'tutor'
      ? { tutor: { create: { nome: data.firstName, sobrenome: data.lastName, cpf: data.cpf } } }
      : { ong: { create: { nome: data.organization, cnpj: data.cnpj, logoUrl } } };
    const address = role === 'ong'
      ? { logradouro: data.street, bairro: data.district, numero: data.number }
      : {};

    let user;
    try {
      const senhaHash = await bcrypt.hash(data.password, 12);
      if (logo) {
        await mkdir(logoDirectory, { recursive: true });
        await writeFile(filePath, logo, { flag: 'wx' });
      }
      // Prisma grava o endereço, a conta e exatamente um perfil na mesma transação.
      user = await prisma.usuario.create({
        data: {
          email: data.email,
          telefone: data.phone,
          senhaHash,
          endereco: { create: { cep: data.cep, ...data.city, ...address } },
          ...profile,
        },
        select: { id: true },
      });
    } catch (error) {
      if (filePath) {
        await unlink(filePath).catch((cleanupError) => {
          if (cleanupError.code !== 'ENOENT') console.error('Falha ao remover logo pendente:', cleanupError.code);
        });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Já existe um cadastro com este e-mail ou documento.' });
      }
      const code = error.errorCode ?? error.code;
      const connectionFailed = error instanceof Prisma.PrismaClientInitializationError && !code;
      if (connectionFailed || ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(code)) {
        console.error('Banco indisponível durante o cadastro:', code ?? error.name);
        return res.status(503).json({ message: 'O banco de dados está temporariamente indisponível. Tente novamente em instantes.' });
      }
      throw error;
    }

    return res.status(201).json({ id: user.id.toString(), role });
  };
}

export function registrationRoutes(prisma) {
  const router = Router();
  router.post('/tutor', register(prisma, 'tutor', tutorRegistration));
  router.post('/ong', upload.single('logo'), register(prisma, 'ong', ongRegistration));
  return router;
}
