import { notify } from './notifications.js';
import express, { Router } from 'express';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { z } from 'zod';

const endpoint = '/api/adocao';
const photoPrefix = 'data:image/webp;base64,';
const labels = {
  species: { cao: 'Cão', gato: 'Gato', outro: 'Outro' },
  sex: { femea: 'Fêmea', macho: 'Macho' },
  size: { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' },
  urgency: { alta: 'Alta', media: 'Média', baixa: 'Baixa' },
  status: {
    disponivel: 'Disponível', em_tratamento: 'Em tratamento',
    em_processo_de_adocao: 'Em processo de adoção', adotado: 'Adotado',
  },
};
const option = (field) => z.enum(Object.values(labels[field]));
const code = (field, value) => Object.keys(labels[field]).find((key) => labels[field][key] === value);
const parseId = (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9_223_372_036_854_775_807n
  ? BigInt(value) : null;

const text = (limit) => z.string().trim().max(limit).default('');
const imageData = z.string().max(4_194_336).regex(/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/);
const retainedPhoto = z.string().regex(/^[1-9]\d{0,18}$/).refine((value) => parseId(value) !== null);
const fields = z.strictObject({
  name: z.string().trim().min(1).max(60),
  species: option('species'),
  sex: option('sex'),
  size: option('size'),
  urgency: option('urgency'),
  age: z.enum(['Até 1 ano', '1 a 3 anos', '4 a 7 anos', '8 anos ou mais', 'Não informada']),
  breed: text(120),
  color: text(120),
  health: text(120),
  temperament: text(120),
  description: text(1500),
});
const publication = fields.extend({ key: z.uuid(), photos: z.array(imageData).max(4) });
const edit = fields.extend({ photos: z.array(z.union([imageData, retainedPhoto])).max(4) });
const statusChange = z.strictObject({ status: option('status') });

async function loadAnimals(db, condition, publicOrder = false) {
  const order = publicOrder ? Prisma.sql`(a.urgencia = 'alta') DESC,` : Prisma.empty;
  const rows = await db.$queryRaw`
    SELECT a.id, a.ong_id, a.nome, a.especie, a.raca, a.porte, a.faixa_etaria, a.sexo, a.cor,
      a.saude, a.temperamento, a.urgencia, a.status_adocao, a.descricao, a.criado_em,
      o.nome AS organization,
      CASE WHEN o.exibir_localizacao THEN e.bairro END AS bairro,
      CASE WHEN o.exibir_localizacao THEN e.cidade END AS cidade,
      CASE WHEN o.exibir_localizacao THEN e.uf END AS uf,
      ARRAY(SELECT f.id FROM public.foto_animal f WHERE f.animal_id = a.id ORDER BY f.ordem) AS fotos
    FROM public.animal a
    JOIN public.ong o ON o.usuario_id = a.ong_id
    JOIN public.usuario u ON u.id = o.usuario_id
    LEFT JOIN public.endereco e ON e.id = u.endereco_id
    WHERE ${condition}
    ORDER BY ${order} a.criado_em DESC, a.id DESC
  `;
  return rows.map((row) => {
    const photos = row.fotos.map((id) => endpoint + '/' + row.id + '/fotos/' + id);
    return {
      id: String(row.id), organizationId: String(row.ong_id), organization: row.organization,
      name: row.nome, species: labels.species[row.especie], size: labels.size[row.porte], sex: labels.sex[row.sexo],
      age: row.faixa_etaria, ageLabel: row.faixa_etaria, puppy: row.faixa_etaria === 'Até 1 ano',
      breed: row.raca, color: row.cor, health: row.saude, temperament: row.temperamento,
      traits: [...new Set((row.temperamento ?? '').split(',').map((value) => value.trim()).filter(Boolean))],
      description: row.descricao, status: labels.status[row.status_adocao], urgency: labels.urgency[row.urgencia],
      urgent: row.urgencia === 'alta', medicalCare: row.status_adocao === 'em_tratamento',
      neighborhood: row.bairro, city: row.cidade, region: row.uf,
      registeredAt: row.criado_em.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      photos, photo: photos[0],
    };
  });
}

async function preparePhotos(photos) {
  const prepared = [];
  for (const photo of photos) {
    if (!photo.startsWith('data:')) {
      prepared.push({ id: parseId(photo) });
      continue;
    }
    const [header, base64] = photo.split(',');
    const image = sharp(Buffer.from(base64, 'base64'), { limitInputPixels: 24_000_000 });
    const { format } = await image.metadata();
    if (header !== 'data:image/' + format + ';base64') throw new Error('Formato inválido');
    const bytes = await image.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();
    prepared.push({ url: photoPrefix + bytes.toString('base64') });
  }
  return prepared;
}

async function writePhotos(db, id, photos) {
  if (!photos.length) return;
  const rows = photos.map((url, index) => Prisma.sql`(${id}, ${url}, ${index + 1})`);
  await db.$executeRaw`INSERT INTO public.foto_animal (animal_id, url, ordem) VALUES ${Prisma.join(rows)}`;
}

const adoptionInterest = z.strictObject({
  confirmed: z.literal(true),
  residence: z.enum(['Casa com quintal', 'Casa sem quintal', 'Apartamento', 'Outro']),
  pets: z.enum(['Não tenho', 'Tenho cão', 'Tenho gato', 'Tenho mais de um pet', 'Tenho outro tipo de pet']),
  space: z.enum(['Pequeno', 'Médio', 'Grande']),
  responsibility: z.literal(true),
});

const publicAnimal = Prisma.sql`a.status_adocao <> 'adotado'`;
const missing = (res) => res.status(404).json({ message: 'Animal não encontrado.' });
const invalid = (res) => res.status(400).json({ message: 'Confira os dados e as fotos do animal.' });

function requireJson(req, res, next) {
  if (!req.is('application/json')) return res.status(415).json({ message: 'Envie os dados em JSON.' });
  next();
}

export function adoptionRoutes(prisma, sessionAccountId) {
  const router = Router();
  const json = [requireJson, express.json({ limit: '17mb' })];

  async function requireOng(req, res, next) {
    const id = sessionAccountId(req);
    if (!id) return res.status(401).json({ message: 'Entre na sua conta para continuar.' });
    const ong = await prisma.ong.findUnique({ where: { usuarioId: id }, select: { usuarioId: true } });
    if (!ong) return res.status(403).json({ message: 'Apenas ONGs podem gerenciar animais para adoção.' });
    req.ongId = id;
    next();
  }

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/', async (_req, res) => {
    res.json({ animals: await loadAnimals(prisma, publicAnimal, true) });
  });

  const favorites = Router();
  router.use('/favoritos', favorites);
  favorites.use(async (req, res, next) => {
    const tutorId = sessionAccountId(req);
    if (!tutorId) return res.status(401).json({ message: 'Entre como tutor para acessar seus favoritos.' });
    const tutor = await prisma.tutor.findUnique({
      where: { usuarioId: tutorId }, select: { usuarioId: true },
    });
    if (!tutor) return res.status(403).json({ message: 'Apenas tutores podem sincronizar favoritos.' });
    req.tutorId = tutorId;
    next();
  });

  favorites.get('/', async (req, res) => {
    const rows = await prisma.$queryRaw`
      SELECT f.animal_id FROM public.favorito_adocao f JOIN public.animal a ON a.id = f.animal_id
      WHERE f.tutor_id = ${req.tutorId} AND ${publicAnimal}
      ORDER BY f.animal_id
    `;
    res.json({ favorites: rows.map((row) => String(row.animal_id)) });
  });

  async function saveFavorites(tutorId, ids) {
    return prisma.$queryRaw`
      WITH available AS (
        SELECT a.id FROM public.animal a WHERE a.id IN (${Prisma.join(ids)}) AND ${publicAnimal} FOR SHARE
      ), saved AS (
        INSERT INTO public.favorito_adocao (tutor_id, animal_id)
        SELECT ${tutorId}, id FROM available ORDER BY id
        ON CONFLICT (tutor_id, animal_id) DO NOTHING
      )
      SELECT id AS animal_id FROM available
    `;
  }

  favorites.post('/importar', requireJson, express.json({ limit: '32kb' }), async (req, res) => {
    const input = z.object({ ids: z.array(retainedPhoto).min(1).max(500) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confira a lista de favoritos para importar.' });
    const ids = [...new Set(input.data.ids)].map(BigInt);
    const rows = await saveFavorites(req.tutorId, ids);
    res.json({ favorites: rows.map((row) => String(row.animal_id)) });
  });

  favorites.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const rows = await saveFavorites(req.tutorId, [id]);
    if (!rows.length) return missing(res);
    res.sendStatus(204);
  });

  favorites.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    await prisma.$executeRaw`
      DELETE FROM public.favorito_adocao WHERE tutor_id = ${req.tutorId} AND animal_id = ${id}
    `;
    res.sendStatus(204);
  });

  router.get('/meus/solicitacoes', requireOng, async (req, res) => {
    const rows = await prisma.$queryRaw`
      SELECT i.animal_id, i.tutor_id, i.registrado_em, i.moradia, i.outros_animais, i.espaco, i.aceito_em,
        a.nome AS animal, t.nome, t.sobrenome,
        (SELECT f.id FROM public.foto_animal f WHERE f.animal_id = a.id ORDER BY f.ordem LIMIT 1) AS foto_id
      FROM public.interesse_adocao i
      JOIN public.animal a ON a.id = i.animal_id
      JOIN public.tutor t ON t.usuario_id = i.tutor_id
      WHERE a.ong_id = ${req.ongId}
      ORDER BY i.registrado_em DESC NULLS LAST, i.animal_id DESC, i.tutor_id DESC
      LIMIT 10
    `;
    res.json({ requests: rows.map((row) => ({
      id: row.animal_id + '-' + row.tutor_id,
      animal: {
        name: row.animal,
        photo: row.foto_id ? endpoint + '/' + row.animal_id + '/fotos/' + row.foto_id : null,
      },
      applicant: row.nome + ' ' + row.sobrenome,
      home: row.moradia, pets: row.outros_animais, space: row.espaco,
      createdAt: row.registrado_em, acceptedAt: row.aceito_em,
    })) });
  });

  router.get('/meus', requireOng, async (req, res) => {
    res.json({ animals: await loadAnimals(prisma, Prisma.sql`a.ong_id = ${req.ongId}`) });
  });

  router.post('/meus', requireOng, ...json, async (req, res) => {
    const input = publication.safeParse(req.body);
    if (!input.success) return invalid(res);
    const data = input.data;
    let photos;
    try {
      photos = await preparePhotos(data.photos);
    } catch {
      return res.status(400).json({ message: 'Selecione fotos JPG ou PNG válidas, com até 24 megapixels.' });
    }
    const animal = await prisma.$transaction(async (db) => {
      const [created] = await db.$queryRaw`
        INSERT INTO public.animal (
          ong_id, chave_publicacao, nome, especie, raca, porte, faixa_etaria, sexo, cor,
          saude, temperamento, urgencia, descricao
        ) VALUES (
          ${req.ongId}, ${data.key}::uuid, ${data.name}, ${code('species', data.species)}, ${data.breed || null},
          ${code('size', data.size)}, ${data.age}, ${code('sex', data.sex)}, ${data.color || null},
          ${data.health || null}, ${data.temperament || null}, ${code('urgency', data.urgency)}, ${data.description || null}
        )
        ON CONFLICT (ong_id, chave_publicacao) DO NOTHING RETURNING id
      `;
      if (created) await writePhotos(db, created.id, photos.map(({ url }) => url));
      const [saved] = await loadAnimals(db, Prisma.sql`a.ong_id = ${req.ongId} AND a.chave_publicacao = ${data.key}::uuid`);
      return saved;
    });
    if (!animal) return missing(res);
    return res.status(201).json({ animal });
  });

  router.patch('/meus/:id', requireOng, ...json, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const input = z.union([statusChange, edit]).safeParse(req.body);
    if (!input.success) return invalid(res);
    const data = input.data;
    const own = Prisma.sql`a.id = ${id} AND a.ong_id = ${req.ongId}`;
    if ('status' in data) {
      const status = code('status', data.status);
      const animal = await prisma.$transaction(async (db) => {
        const [updated] = await db.$queryRaw`
          UPDATE public.animal a SET status_adocao = ${status}, atualizado_em = NOW()
          WHERE ${own} AND a.status_adocao <> ${status} RETURNING a.nome
        `;
        if (updated) {
          await db.$executeRaw`
            INSERT INTO public.notificacao (usuario_id, categoria, titulo, mensagem, destino)
            SELECT i.tutor_id, 'adoption', 'Atualização de adoção',
              ${updated.nome + ' agora está com o status “' + data.status + '”.'},
              ${status === 'adotado' ? null : '/adocao/' + req.params.id}
            FROM public.interesse_adocao i JOIN public.tutor t ON t.usuario_id = i.tutor_id
            WHERE i.animal_id = ${id}
              AND COALESCE(t.perfil -> 'notifications' -> 'adoption', 'true'::jsonb) = 'true'::jsonb
          `;
        }
        const [saved] = await loadAnimals(db, own);
        return saved;
      });
      return animal ? res.json({ animal }) : missing(res);
    }

    const [owned] = await prisma.$queryRaw`SELECT a.id FROM public.animal a WHERE ${own}`;
    if (!owned) return missing(res);
    let photos;
    try {
      photos = await preparePhotos(data.photos);
    } catch {
      return res.status(400).json({ message: 'Selecione fotos JPG ou PNG válidas, com até 24 megapixels.' });
    }

    const saved = await prisma.$transaction(async (db) => {
      const [locked] = await db.$queryRaw`SELECT a.id FROM public.animal a WHERE ${own} FOR UPDATE`;
      if (!locked) return null;
      const current = await db.$queryRaw`SELECT id, url FROM public.foto_animal WHERE animal_id = ${id} ORDER BY ordem`;
      const byId = new Map(current.map(({ id, url }) => [id, url]));
      const retained = photos.flatMap((photo) => photo.id ? [photo.id] : []);
      if (new Set(retained).size !== retained.length || retained.some((photoId) => !byId.has(photoId))) {
        return { stalePhotos: true };
      }
      await db.$executeRaw`
        UPDATE public.animal a SET nome = ${data.name}, especie = ${code('species', data.species)},
          raca = ${data.breed || null}, porte = ${code('size', data.size)}, faixa_etaria = ${data.age},
          sexo = ${code('sex', data.sex)}, cor = ${data.color || null}, saude = ${data.health || null},
          temperamento = ${data.temperament || null}, urgencia = ${code('urgency', data.urgency)},
          descricao = ${data.description || null}, atualizado_em = NOW() WHERE ${own}
      `;
      if (photos.length !== current.length || photos.some((photo, index) => photo.id !== current[index].id)) {
        await db.$executeRaw`DELETE FROM public.foto_animal WHERE animal_id = ${id}`;
        await writePhotos(db, id, photos.map((photo) => photo.url ?? byId.get(photo.id)));
      }
      const [animal] = await loadAnimals(db, own);
      return { animal };
    });

    if (!saved) return missing(res);
    if (saved.stalePhotos) return res.status(409).json({ message: 'As fotos foram alteradas. Recarregue a página antes de editar.' });
    return res.json(saved);
  });

  router.delete('/meus/:id', requireOng, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const deleted = await prisma.$executeRaw`DELETE FROM public.animal WHERE id = ${id} AND ong_id = ${req.ongId}`;
    return deleted ? res.sendStatus(204) : missing(res);
  });

  router.get('/:id/fotos/:photoId', async (req, res) => {
    const id = parseId(req.params.id);
    const photoId = parseId(req.params.photoId);
    if (!id || !photoId) return missing(res);
    const [photo] = await prisma.$queryRaw`
      SELECT f.url FROM public.foto_animal f JOIN public.animal a ON a.id = f.animal_id
      WHERE a.id = ${id} AND f.id = ${photoId}
        AND (${publicAnimal} OR a.ong_id = ${sessionAccountId(req)})
    `;
    if (!photo?.url.startsWith(photoPrefix)) return missing(res);
    return res.type('image/webp').send(Buffer.from(photo.url.slice(photoPrefix.length), 'base64'));
  });

  router.post('/:id/interesse', ...json, async (req, res) => {
    const userId = sessionAccountId(req);
    if (!userId) return res.status(401).json({ message: 'Entre com uma conta de tutor para continuar.' });
    const input = adoptionInterest.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confira as respostas e aceite o termo para enviar a solicitação.' });
    const { residence, pets, space } = input.data;
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const tutor = await prisma.tutor.findUnique({
      where: { usuarioId: userId }, select: { nome: true },
    });
    if (!tutor) return res.status(403).json({ message: 'Apenas tutores podem registrar interesse em adotar.' });

    const available = await prisma.$transaction(async (db) => {
      const [animal] = await db.$queryRaw`
        SELECT a.nome, a.ong_id FROM public.animal a
        WHERE a.id = ${id} AND ${publicAnimal} FOR SHARE
      `;
      if (!animal) return false;
      const inserted = await db.$executeRaw`
        INSERT INTO public.interesse_adocao (animal_id, tutor_id, moradia, outros_animais, espaco, aceito_em)
        VALUES (${id}, ${userId}, ${residence}, ${pets}, ${space}, NOW()) ON CONFLICT DO NOTHING
      `;
      if (inserted) {
        await notify(db, {
          userId: animal.ong_id, category: 'adoption', title: 'Novo interesse em adoção',
          message: tutor.nome + ' registrou interesse em adotar ' + animal.nome + '.',
          destination: '/dashboard/ong#ong-overview-requests',
        });
      } else {
        await db.$executeRaw`
          UPDATE public.interesse_adocao
          SET moradia = ${residence}, outros_animais = ${pets}, espaco = ${space},
              aceito_em = NOW(), registrado_em = COALESCE(registrado_em, NOW())
          WHERE animal_id = ${id} AND tutor_id = ${userId}
            AND (moradia, outros_animais, espaco) IS DISTINCT FROM (${residence}, ${pets}, ${space})
        `;
      }
      return true;
    });
    if (!available) return missing(res);
    res.sendStatus(204);
  });

  router.get('/:id/contato', async (req, res) => {
    const accountId = sessionAccountId(req);
    if (!accountId) return res.status(401).json({ message: 'Entre com uma conta de tutor para continuar.' });
    const tutor = await prisma.tutor.findUnique({ where: { usuarioId: accountId }, select: { usuarioId: true } });
    if (!tutor) return res.status(403).json({ message: 'Apenas tutores podem manifestar interesse em adotar.' });

    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const [contact] = await prisma.$queryRaw`
      SELECT o.exibir_contato, o.whatsapp_publico, u.telefone
      FROM public.animal a
      JOIN public.ong o ON o.usuario_id = a.ong_id
      JOIN public.usuario u ON u.id = o.usuario_id
      WHERE a.id = ${id} AND ${publicAnimal}
    `;
    if (!contact) return missing(res);

    const phone = contact.exibir_contato
      ? (contact.whatsapp_publico?.trim() || contact.telefone).replace(/[\s()+.-]/g, '')
      : '';
    const nationalNumber = /^[1-9]{2}\d{8,9}$/;
    const whatsapp = nationalNumber.test(phone) ? '55' + phone
      : phone.startsWith('55') && nationalNumber.test(phone.slice(2)) ? phone : null;
    return res.json({ whatsapp });
  });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return missing(res);
    const [animal] = await loadAnimals(prisma, Prisma.sql`a.id = ${id} AND ${publicAnimal}`);
    return animal ? res.json({ animal }) : missing(res);
  });

  router.use((error, _req, res, next) => {
    if (error.status === 413) return res.status(413).json({ message: 'Envie até 4 fotos de no máximo 3 MB cada.' });
    return next(error);
  });
  return router;
}
