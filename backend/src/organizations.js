import { Router } from 'express';
import { Prisma } from '@prisma/client';

const publicDetails = Prisma.sql`,
  o.capa_url, o.site_url, o.instagram_url, o.facebook_url, o.chave_pix,
  o.instrucoes_doacao_itens, o.orientacoes_doacao,
  CASE WHEN o.exibir_contato THEN o.email_publico END AS email,
  CASE WHEN o.exibir_contato THEN o.whatsapp_publico END AS whatsapp
`;

async function loadOrganizations(db, id) {
  const detail = id !== undefined;
  const rows = await db.$queryRaw(Prisma.sql`
    SELECT o.usuario_id, o.nome, o.logo_url, o.slogan, o.descricao, o.data_fundacao,
      CASE WHEN o.exibir_localizacao THEN e.bairro END AS bairro,
      CASE WHEN o.exibir_localizacao THEN e.cidade END AS cidade,
      CASE WHEN o.exibir_localizacao THEN e.uf END AS uf,
      (SELECT count(*) FROM public.animal a
       WHERE a.ong_id = o.usuario_id AND a.status_adocao <> 'adotado') AS disponiveis,
      (SELECT count(*) FROM public.animal a
       WHERE a.ong_id = o.usuario_id AND a.status_adocao = 'adotado') AS adotados
      ${detail ? publicDetails : Prisma.empty}
    FROM public.ong o
    JOIN public.usuario u ON u.id = o.usuario_id
    LEFT JOIN public.endereco e ON e.id = u.endereco_id
    ${detail ? Prisma.sql`WHERE o.usuario_id = ${id}` : Prisma.empty}
    ORDER BY lower(o.nome), o.usuario_id
  `);
  return rows.map((row) => ({
    accountId: String(row.usuario_id), name: row.nome, logo: row.logo_url,
    tagline: row.slogan, description: row.descricao, founded: row.data_fundacao?.getUTCFullYear(),
    neighborhood: row.bairro, city: [row.cidade, row.uf].filter(Boolean).join(' – '),
    available: Number(row.disponiveis), adopted: Number(row.adotados),
    ...(detail && {
      cover: row.capa_url, email: row.email, whatsapp: row.whatsapp,
      website: safeWebsite(row.site_url),
      instagram: socialLink('instagram.com', row.instagram_url),
      facebook: socialLink('facebook.com', row.facebook_url),
      pixKey: row.chave_pix, donationInstructions: row.orientacoes_doacao,
      supplies: [...new Set((row.instrucoes_doacao_itens ?? '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean))],
    }),
  }));
}

function safeWebsite(value) {
  return /^https?:\/\//i.test(value ?? '') ? value : null;
}

function socialLink(domain, value) {
  const handle = value?.replace(/^https?:\/\/(?:www\.)?(?:instagram|facebook)\.com\//i, '').replace(/\/$/, '').replace(/^@/, '');
  return handle && /^[a-zA-Z0-9._]+$/.test(handle) ? 'https://www.' + domain + '/' + handle : null;
}

export function organizationRoutes(prisma) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/', async (_req, res) => {
    res.json({ organizations: await loadOrganizations(prisma) });
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (/^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9_223_372_036_854_775_807n) {
      const [organization] = await loadOrganizations(prisma, BigInt(id));
      if (organization) return res.json({ organization });
    }
    return res.status(404).json({ message: 'ONG não encontrada.' });
  });
  return router;
}
