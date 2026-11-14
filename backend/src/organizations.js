import { Router } from 'express';
import { Prisma } from '@prisma/client';

async function loadOrganizations(db, condition = Prisma.empty) {
  const rows = await db.$queryRaw`
    SELECT o.usuario_id, o.nome, o.logo_url, o.slogan, o.descricao, o.data_fundacao,
      CASE WHEN o.exibir_localizacao THEN e.bairro END AS bairro,
      CASE WHEN o.exibir_localizacao THEN e.cidade END AS cidade,
      CASE WHEN o.exibir_localizacao THEN e.uf END AS uf,
      (SELECT count(*) FROM public.animal a
       WHERE a.ong_id = o.usuario_id AND a.status_adocao <> 'adotado') AS disponiveis,
      (SELECT count(*) FROM public.animal a
       WHERE a.ong_id = o.usuario_id AND a.status_adocao = 'adotado') AS adotados
    FROM public.ong o
    JOIN public.usuario u ON u.id = o.usuario_id
    LEFT JOIN public.endereco e ON e.id = u.endereco_id
    ${condition}
    ORDER BY lower(o.nome), o.usuario_id
  `;
  return rows.map((row) => ({
    accountId: String(row.usuario_id), name: row.nome, logo: row.logo_url,
    tagline: row.slogan, description: row.descricao, founded: row.data_fundacao?.getUTCFullYear(),
    neighborhood: row.bairro, city: [row.cidade, row.uf].filter(Boolean).join(' – '),
    available: Number(row.disponiveis), adopted: Number(row.adotados),
  }));
}

export function organizationRoutes(prisma) {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ organizations: await loadOrganizations(prisma) });
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    res.set('Cache-Control', 'no-store');
    if (/^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9_223_372_036_854_775_807n) {
      const [organization] = await loadOrganizations(prisma, Prisma.sql`WHERE o.usuario_id = ${BigInt(id)}`);
      if (organization) return res.json({ organization });
    }
    return res.status(404).json({ message: 'ONG não encontrada.' });
  });
  return router;
}
