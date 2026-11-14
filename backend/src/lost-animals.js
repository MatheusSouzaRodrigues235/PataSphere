import express, { Router } from 'express';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { z } from 'zod';

const labels = {
  species: { cao: 'Cão', gato: 'Gato', outro: 'Outro' },
  sex: { femea: 'Fêmea', macho: 'Macho', nao_identificado: 'Não identificado' },
  size: { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' },
  urgency: { baixa: 'Baixa', media: 'Média', alta: 'Alta' },
};
const options = (field) => z.enum(Object.values(labels[field]));
const code = (field, value) => Object.keys(labels[field]).find((key) => labels[field][key] === value);
const required = (limit) => z.string().trim().min(1).max(limit);
const optional = (limit) => z.string().trim().max(limit).optional();
const editFields = {
  name: required(80),
  neighborhood: required(80),
  date: z.iso.date().refine((date) => date <= new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })),
  description: required(500),
};
const publication = z.object({
  ...editFields,
  name: optional(60),
  key: z.uuid(),
  kind: z.enum(['lost', 'found']),
  species: options('species'),
  sex: options('sex'),
  size: options('size'),
  urgency: options('urgency'),
  breed: optional(80),
  ageLabel: z.enum(['Até 1 ano', '1 a 3 anos', '4 a 7 anos', '8 anos ou mais', 'Não informada']),
  health: optional(160),
  temperament: optional(160),
  contactName: required(80),
  phone: z.string().regex(/^(?:\d{10,11}|\(\d{2}\) \d{4,5}-\d{4})$/),
  email: z.union([z.email().max(120), z.literal('')]).optional(),
  cep: z.string().regex(/^(?:\d{5}-?\d{3})?$/).optional(),
  street: optional(120),
  city: required(80),
  region: z.enum('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')),
  reference: optional(240),
  point: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).nullish(),
  photos: z.array(z.string().max(3_000_000).regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/)).min(1).max(4),
}).refine((input) => input.kind === 'found' || !!input.name);

const photoPrefix = 'data:image/webp;base64,';
const endpoint = '/api/animais-perdidos';
const parseId = (value) => /^ocorrencia-[1-9]\d{0,18}$/.test(value) && BigInt(value.slice(11)) <= 9_223_372_036_854_775_807n
  ? BigInt(value.slice(11)) : null;

async function loadAlerts(db, condition) {
  const rows = await db.$queryRaw`
    SELECT o.*, ARRAY(
      SELECT f.ordem FROM public.foto_ocorrencia f WHERE f.ocorrencia_id = o.id ORDER BY f.ordem
    ) AS fotos
    FROM public.ocorrencia_pet o WHERE ${condition}
    ORDER BY o.criado_em DESC, o.id DESC
  `;
  return rows.map((row) => ({
    id: 'ocorrencia-' + row.id,
    name: row.nome_animal ?? labels.species[row.especie] + ' sem nome identificado',
    kind: row.tipo === 'encontrado' ? 'found' : 'lost',
    closed: row.status === 'encerrada',
    species: labels.species[row.especie],
    sex: labels.sex[row.sexo],
    size: labels.size[row.porte],
    urgency: labels.urgency[row.urgencia],
    ageLabel: row.faixa_etaria,
    breed: row.raca,
    health: row.saude,
    temperament: row.temperamento,
    description: row.descricao,
    date: row.data_fato.toISOString().slice(0, 10),
    cep: row.cep,
    street: row.logradouro,
    neighborhood: row.bairro,
    city: row.cidade,
    region: row.uf,
    reference: row.referencia,
    point: row.latitude == null ? null : [Number(row.latitude), Number(row.longitude)],
    contactName: row.nome_contato,
    phone: row.whatsapp_contato,
    email: row.email_contato,
    photos: row.fotos.map((order) => endpoint + '/ocorrencia-' + row.id + '/fotos/' + order),
  }));
}

export function lostAnimalRoutes(prisma, sessionAccountId) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  function requireAccount(req, res, next) {
    req.accountId = sessionAccountId(req);
    if (!req.accountId) return res.status(401).json({ message: 'Entre na sua conta para continuar.' });
    next();
  }

  const json = (limit) => [
    (req, res, next) => {
      if (!req.is('application/json')) return res.status(415).json({ message: 'Envie os dados em JSON.' });
      next();
    },
    express.json({ limit }),
  ];

  router.get('/', async (_req, res) => {
    res.json({ alerts: await loadAlerts(prisma, Prisma.sql`o.status = 'aberta'`) });
  });

  router.get('/meus', requireAccount, async (req, res) => {
    res.json({ alerts: await loadAlerts(prisma, Prisma.sql`o.autor_id = ${req.accountId}`) });
  });

  router.post('/', requireAccount, ...json('12mb'), async (req, res) => {
    const input = publication.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confira os dados e as fotos da ocorrência.' });
    const data = input.data;
    let photos;
    try {
      photos = await Promise.all(data.photos.map(async (photo) => {
        const bytes = Buffer.from(photo.split(',')[1], 'base64');
        const image = sharp(bytes, { limitInputPixels: 1200 * 1200 });
        const { format } = await image.metadata();
        if (!['jpeg', 'png', 'webp'].includes(format)) throw new Error('Formato inválido');
        return photoPrefix + (await image.webp({ quality: 85 }).toBuffer()).toString('base64');
      }));
    } catch {
      return res.status(400).json({ message: 'Selecione fotos JPG, PNG ou WebP válidas.' });
    }

    const alert = await prisma.$transaction(async (tx) => {
      const [created] = await tx.$queryRaw`
        INSERT INTO public.ocorrencia_pet (
          autor_id, chave_publicacao, tipo, nome_animal, especie, raca, sexo, porte,
          faixa_etaria, urgencia, descricao, data_fato, cep, uf, cidade, bairro, logradouro,
          referencia, latitude, longitude, nome_contato, whatsapp_contato, saude,
          temperamento, email_contato
        ) VALUES (
          ${req.accountId}, ${data.key}::uuid, ${data.kind === 'found' ? 'encontrado' : 'perdido'},
          ${data.name || null}, ${code('species', data.species)}, ${data.breed || null},
          ${code('sex', data.sex)}, ${code('size', data.size)}, ${data.ageLabel},
          ${code('urgency', data.urgency)}, ${data.description}, ${data.date}::date,
          ${data.cep?.replace('-', '') || null}, ${data.region}, ${data.city}, ${data.neighborhood},
          ${data.street || null}, ${data.reference || null}, ${data.point?.[0] ?? null},
          ${data.point?.[1] ?? null}, ${data.contactName}, ${data.phone.replace(/\D/g, '')},
          ${data.health || null}, ${data.temperament || null}, ${data.email || null}
        )
        ON CONFLICT (chave_publicacao) DO NOTHING
        RETURNING id
      `;
      if (created) {
        const values = photos.map((photo, index) => Prisma.sql`(${created.id}, ${photo}, ${index + 1})`);
        await tx.$executeRaw`
          INSERT INTO public.foto_ocorrencia (ocorrencia_id, url, ordem) VALUES ${Prisma.join(values)}
        `;
      }
      const [saved] = await loadAlerts(tx, Prisma.sql`o.chave_publicacao = ${data.key}::uuid AND o.autor_id = ${req.accountId}`);
      return saved;
    });
    if (!alert) return res.status(409).json({ message: 'Não foi possível reutilizar esta publicação.' });
    res.status(201).json({ alert });
  });

  const visible = (id, req) => Prisma.sql`
    o.id = ${id} AND (o.status = 'aberta' OR o.autor_id = ${sessionAccountId(req)})
  `;
  const missing = (res) => res.status(404).json({ message: 'Anúncio indisponível.' });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const [alert] = await loadAlerts(prisma, visible(id, req));
    if (!alert) return missing(res);
    res.json({ alert });
  });

  router.get('/:id/fotos/:order', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id || !/^[1-4]$/.test(req.params.order)) return missing(res);
    const [photo] = await prisma.$queryRaw`
      SELECT f.url FROM public.foto_ocorrencia f JOIN public.ocorrencia_pet o ON o.id = f.ocorrencia_id
      WHERE ${visible(id, req)} AND f.ordem = ${Number(req.params.order)}
    `;
    if (!photo?.url.startsWith(photoPrefix)) return missing(res);
    res.type('image/webp').send(Buffer.from(photo.url.slice(photoPrefix.length), 'base64'));
  });

  const changes = z.union([z.object(editFields), z.strictObject({ closed: z.literal(true) })]);
  router.patch('/:id', requireAccount, ...json('16kb'), async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const input = changes.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confira os dados da ocorrência.' });
    const data = input.data;
    const fields = data.closed
      ? Prisma.sql`status = 'encerrada', encerrado_em = NOW()`
      : Prisma.sql`nome_animal = ${data.name}, bairro = ${data.neighborhood}, data_fato = ${data.date}::date, descricao = ${data.description}`;
    const updated = await prisma.$executeRaw`
      UPDATE public.ocorrencia_pet SET ${fields}, atualizado_em = NOW()
      WHERE id = ${id} AND autor_id = ${req.accountId} AND status = 'aberta'
    `;
    if (!updated) return missing(res);
    res.sendStatus(204);
  });

  router.delete('/:id', requireAccount, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const deleted = await prisma.$executeRaw`
      DELETE FROM public.ocorrencia_pet WHERE id = ${id} AND autor_id = ${req.accountId}
    `;
    if (!deleted) return missing(res);
    res.sendStatus(204);
  });

  router.use((error, _req, res, next) => {
    if (error.status === 413) return res.status(413).json({ message: 'As fotos excedem o tamanho permitido.' });
    next(error);
  });

  return router;
}
