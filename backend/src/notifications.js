import { Router } from 'express';

export async function notify(db, { userId, category, title, message, destination = null }) {
  await db.$executeRaw`
    INSERT INTO public.notificacao (usuario_id, categoria, titulo, mensagem, destino)
    SELECT u.id, ${category}, ${title}, ${message}, ${destination}
    FROM public.usuario u
    LEFT JOIN public.tutor t ON t.usuario_id = u.id
    LEFT JOIN public.ong o ON o.usuario_id = u.id
    WHERE u.id = ${userId}
      AND COALESCE(o.notificacoes -> ${category}::text,
        t.perfil -> 'notifications' -> ${category}::text,
        to_jsonb(${category !== 'news'}::boolean)) = 'true'::jsonb
  `;
}

const pageSize = 20;
const maxId = 9_223_372_036_854_775_807n;
const parseId = (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= maxId ? BigInt(value) : null;

export function notificationRoutes(prisma, sessionAccountId) {
  const router = Router();
  router.use(async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    req.accountId = await sessionAccountId(req);
    if (!req.accountId) return res.status(401).json({ message: 'Entre na sua conta para continuar.' });
    next();
  });

  router.get('/nao-lidas', async (req, res) => {
    const [row] = await prisma.$queryRaw`
      SELECT
        (SELECT count(*) FROM public.notificacao WHERE usuario_id = ${req.accountId} AND lido_em IS NULL)
        + (SELECT count(*) FROM public.avistamento_pet a JOIN public.ocorrencia_pet o ON o.id = a.ocorrencia_id
           WHERE o.autor_id = ${req.accountId} AND a.notificar AND a.lido_em IS NULL) AS total
    `;
    res.json({ unread: Number(row.total) });
  });

  router.get('/', async (req, res) => {
    const rawPage = req.query.pagina ?? '1';
    if (typeof rawPage !== 'string' || !/^[1-9]\d{0,5}$/.test(rawPage)) {
      return res.status(400).json({ message: 'Página inválida.' });
    }
    const offset = (Number(rawPage) - 1) * pageSize;
    const rows = await prisma.$queryRaw`
      SELECT * FROM (
        SELECT 'aviso-' || id AS id, categoria, titulo, mensagem, destino, criado_em, lido_em
        FROM public.notificacao WHERE usuario_id = ${req.accountId}
        UNION ALL
        SELECT 'avistamento-' || a.id, 'sightings', 'Novo avistamento',
          'Há um avistamento de ' || o.nome_animal || '.', '/avistamentos', a.criado_em, a.lido_em
        FROM public.avistamento_pet a JOIN public.ocorrencia_pet o ON o.id = a.ocorrencia_id
        WHERE o.autor_id = ${req.accountId} AND a.notificar
      ) feed ORDER BY criado_em DESC, id DESC
      LIMIT ${pageSize + 1} OFFSET ${offset}
    `;
    res.json({
      notifications: rows.slice(0, pageSize).map((row) => ({
        id: row.id, category: row.categoria, title: row.titulo, message: row.mensagem,
        destination: row.destino, createdAt: row.criado_em, read: row.lido_em !== null,
      })),
      hasNext: rows.length > pageSize,
    });
  });

  router.patch('/:key/lida', async (req, res) => {
    const match = /^(aviso|avistamento)-(\d+)$/.exec(req.params.key);
    const id = match && parseId(match[2]);
    if (!id) return res.status(404).json({ message: 'Notificação indisponível.' });
    const updated = match[1] === 'aviso'
      ? await prisma.$executeRaw`
          UPDATE public.notificacao SET lido_em = COALESCE(lido_em, NOW())
          WHERE id = ${id} AND usuario_id = ${req.accountId}
        `
      : await prisma.$executeRaw`
          UPDATE public.avistamento_pet a SET lido_em = COALESCE(a.lido_em, NOW())
          FROM public.ocorrencia_pet o WHERE a.id = ${id} AND o.id = a.ocorrencia_id
            AND o.autor_id = ${req.accountId} AND a.notificar
        `;
    if (!updated) return res.status(404).json({ message: 'Notificação indisponível.' });
    res.sendStatus(204);
  });

  return router;
}
