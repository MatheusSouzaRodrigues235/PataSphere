import { randomUUID } from 'node:crypto';
import { notify } from './notifications.js';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';

const types = { money: 'financeira', food: 'racao', medicine: 'medicamento' };
const payments = { Pix: 'pix', Transferência: 'transferencia', Dinheiro: 'dinheiro' };
const paymentLabels = { pix: 'Pix', transferencia: 'Transferência', dinheiro: 'Dinheiro', entrega_presencial: 'Entrega presencial' };
const imageTypes = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const parseId = (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9_223_372_036_854_775_807n
  ? BigInt(value) : null;

const common = {
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).pipe(z.union([z.email(), z.literal('')])),
  description: z.string().trim().max(2000),
  retained: z.array(z.string().refine((id) => parseId(id) !== null)).max(4),
  key: z.uuid().optional(),
};
const donation = z.discriminatedUnion('type', [
  z.strictObject({ ...common, type: z.literal('money'), amount: z.int().positive().max(99_999_999_999_999),
    payment: z.enum(Object.keys(payments)), unit: z.literal('') }),
  z.strictObject({ ...common, type: z.literal('food'), amount: z.number().positive().max(99_999_999_999.999).multipleOf(0.001),
    payment: z.literal('Entrega presencial'), unit: z.literal('kg') }),
  z.strictObject({ ...common, type: z.literal('medicine'), amount: z.int().positive().max(99_999_999_999),
    payment: z.literal('Entrega presencial'), unit: z.enum(['unidades', 'caixas', 'frascos']) }),
]);

const maxFileSize = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 4, fileSize: maxFileSize + 1, fields: 1, fieldSize: 16 * 1024, parts: 6 },
}).array('attachments', 4);

async function readInput(req) {
  let input;
  try {
    input = donation.safeParse(JSON.parse(req.body?.donation));
  } catch {
    return null;
  }
  if (!input.success) return null;
  const { data } = input;
  if (data.retained.length + req.files.length > 4 || new Set(data.retained).size !== data.retained.length) return null;

  const attachments = [];
  for (const file of req.files) {
    if (file.size > maxFileSize) return null;
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[\p{Cc}\p{Cf}]/gu, '').trim();
    if (!name || name.length > 255) return null;
    let mime;
    if (file.buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
      mime = 'application/pdf';
    } else {
      const metadata = await sharp(file.buffer, { limitInputPixels: 24_000_000 }).metadata().catch(() => null);
      mime = imageTypes[metadata?.format];
    }
    if (!mime || file.mimetype !== mime) return null;
    attachments.push({ name, mime, bytes: file.buffer });
  }

  return {
    ...data, attachments, retained: data.retained.map(BigInt),
    payment: data.type === 'money' ? payments[data.payment] : 'entrega_presencial',
    value: data.type === 'money' ? new Prisma.Decimal(data.amount).div(100) : null,
    quantity: data.type === 'money' ? null : new Prisma.Decimal(data.amount),
  };
}

async function loadRecords(db, ongId, extra = Prisma.empty) {
  const rows = await db.$queryRaw`
    SELECT d.*, ARRAY(
      SELECT json_build_object('id', a.id::text, 'name', a.nome_original, 'type', a.tipo_mime)
      FROM public.anexo_doacao a WHERE a.doacao_id = d.id AND a.conteudo IS NOT NULL ORDER BY a.id
    ) AS anexos
    FROM public.doacao d WHERE d.ong_id = ${ongId} ${extra}
    ORDER BY d.data_doacao DESC, d.id DESC
  `;
  return rows.map((row) => ({
    id: String(row.id), name: row.nome_doador, email: row.email_doador ?? '',
    type: Object.keys(types).find((type) => types[type] === row.tipo),
    amount: row.valor == null ? Number(row.quantidade) : row.valor.mul(100).toNumber(),
    unit: row.unidade ?? '', payment: paymentLabels[row.forma_recebimento],
    date: row.data_doacao.toISOString().slice(0, 10), description: row.descricao ?? '',
    attachments: row.anexos.map((file) => ({ ...file, url: '/api/doacoes/' + row.id + '/anexos/' + file.id })),
  }));
}

async function addAttachments(db, id, attachments) {
  for (const { name, mime, bytes } of attachments) {
    await db.$executeRaw`
      INSERT INTO public.anexo_doacao (doacao_id, chave_arquivo, nome_original, tipo_mime, conteudo)
      VALUES (${id}, ${randomUUID()}, ${name}, ${mime}, ${bytes})
    `;
  }
}

const missing = (res) => res.status(404).json({ message: 'Doação ou anexo não encontrado.' });
const invalid = (res) => res.status(400).json({ message: 'Confira os dados e os anexos da doação.' });
function requireMultipart(req, res, next) {
  if (!req.is('multipart/form-data')) return res.status(415).json({ message: 'Envie o formulário de doação.' });
  next();
}

export function donationRoutes(prisma, sessionAccountId) {
  const router = Router();

  router.use(async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const id = sessionAccountId(req);
    if (!id) return res.status(401).json({ message: 'Entre na sua conta para continuar.' });
    const ong = await prisma.ong.findUnique({ where: { usuarioId: id }, select: { usuarioId: true } });
    if (!ong) return res.status(403).json({ message: 'Apenas ONGs podem acessar o histórico de doações.' });
    req.ongId = id;
    next();
  });

  router.get('/', async (req, res) => {
    return res.json({ records: await loadRecords(prisma, req.ongId) });
  });

  router.post('/', requireMultipart, upload, async (req, res) => {
    const data = await readInput(req);
    if (!data?.key || data.retained.length) return invalid(res);
    const record = await prisma.$transaction(async (db) => {
      const [created] = await db.$queryRaw`
        INSERT INTO public.doacao (
          ong_id, chave_registro, tipo, forma_recebimento, valor, quantidade, unidade,
          nome_doador, email_doador, descricao, data_doacao
        ) VALUES (
          ${req.ongId}, ${data.key}::uuid, ${types[data.type]}, ${data.payment}, ${data.value},
          ${data.quantity}, ${data.unit || null}, ${data.name}, ${data.email || null},
          ${data.description || null}, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        )
        ON CONFLICT (ong_id, chave_registro) DO NOTHING RETURNING id
      `;
      if (created) {
        await addAttachments(db, created.id, data.attachments);
        await notify(db, {
          userId: req.ongId, category: 'donations', title: 'Doação registrada',
          message: 'Uma nova doação foi registrada no histórico da ONG.', destination: '/dashboard/ong/doacoes',
        });
      }
      const [saved] = await loadRecords(db, req.ongId, Prisma.sql`AND d.chave_registro = ${data.key}::uuid`);
      return saved;
    });
    return record ? res.status(201).json({ record }) : missing(res);
  });

  router.patch('/:id', requireMultipart, upload, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const data = await readInput(req);
    if (!data || data.key) return invalid(res);
    const saved = await prisma.$transaction(async (db) => {
      const [owned] = await db.$queryRaw`
        SELECT id FROM public.doacao WHERE id = ${id} AND ong_id = ${req.ongId} FOR UPDATE
      `;
      if (!owned) return null;
      const attachments = await db.$queryRaw`
        SELECT id FROM public.anexo_doacao WHERE doacao_id = ${id} AND conteudo IS NOT NULL
      `;
      const current = new Set(attachments.map((attachment) => attachment.id));
      if (data.retained.some((fileId) => !current.has(fileId))) return { stale: true };
      await db.$executeRaw`
        UPDATE public.doacao SET tipo = ${types[data.type]}, forma_recebimento = ${data.payment},
          valor = ${data.value}, quantidade = ${data.quantity}, unidade = ${data.unit || null},
          nome_doador = ${data.name}, email_doador = ${data.email || null}, descricao = ${data.description || null}
        WHERE id = ${id} AND ong_id = ${req.ongId}
      `;
      const removed = attachments.filter((file) => !data.retained.includes(file.id));
      if (removed.length) {
        await db.$executeRaw`
          DELETE FROM public.anexo_doacao WHERE doacao_id = ${id} AND id IN (${Prisma.join(removed.map((file) => file.id))})
        `;
      }
      await addAttachments(db, id, data.attachments);
      const [record] = await loadRecords(db, req.ongId, Prisma.sql`AND d.id = ${id}`);
      return { record };
    });

    if (!saved) return missing(res);
    if (saved.stale) return res.status(409).json({ message: 'Os anexos foram alterados. Recarregue o histórico para editar.' });
    return res.json(saved);
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const deleted = await prisma.$executeRaw`DELETE FROM public.doacao WHERE id = ${id} AND ong_id = ${req.ongId}`;
    return deleted ? res.sendStatus(204) : missing(res);
  });

  router.get('/:id/anexos/:attachmentId', async (req, res) => {
    const id = parseId(req.params.id);
    const attachmentId = parseId(req.params.attachmentId);
    if (!id || !attachmentId) return missing(res);
    const [file] = await prisma.$queryRaw`
      SELECT a.nome_original, a.tipo_mime, a.conteudo FROM public.anexo_doacao a
      JOIN public.doacao d ON d.id = a.doacao_id
      WHERE d.ong_id = ${req.ongId} AND d.id = ${id} AND a.id = ${attachmentId} AND a.conteudo IS NOT NULL
    `;
    if (!file) return missing(res);
    return res.attachment(file.nome_original).type(file.tipo_mime)
      .set('X-Content-Type-Options', 'nosniff').send(Buffer.from(file.conteudo));
  });

  router.use((error, _req, res, next) => {
    if (error instanceof multer.MulterError) {
      return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
        .json({ message: 'Envie até quatro anexos de no máximo 5 MB cada.' });
    }
    return next(error);
  });
  return router;
}
