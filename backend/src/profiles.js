import express, { Router } from 'express';
import { z } from 'zod';
import { cnpj } from './registration-dto.js';

const text = (max) => z.string().trim().max(max);
const optional = (schema) => z.union([z.literal(''), schema]);
const website = optional(z.url({ protocol: /^https?$/ }).max(300));
const email = optional(text(254).pipe(z.email('Informe um e-mail válido.')));
const social = optional(text(50).regex(/^@?[a-zA-Z0-9._]+$/, 'Informe um nome de usuário válido.'));
const phone = optional(text(20).regex(/^\(?\d{2}\)?[ .-]?\d{4,5}[ .-]?\d{4}$/, 'Informe um WhatsApp com DDD.'))
  .transform((value) => value.replace(/\D/g, ''));
const image = z.string().max(2_800_000).regex(/^(?:data:image\/webp;base64,UklGR[A-Za-z0-9+/]+={0,2})?$/, 'Envie uma imagem válida.');

const states = new Map(Object.entries({
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}).flatMap(([uf, name]) => [[uf, uf], [name, uf]]));
const state = text(40).refine((value) => !value || states.has(value), 'Informe um estado válido.');
const common = { bio: text(3000), city: text(160), state, email, website, instagram: social, facebook: social };
const tutorForm = z.object({ ...common, firstName: text(160).min(1), lastName: text(160).min(1), intro: text(60), phone });
const ongForm = z.object({
  ...common, name: text(160).min(1), cnpj,
  founded: optional(z.string().regex(/^\d{4}$/).refine((year) => Number(year) >= 1000 && Number(year) <= new Date().getFullYear())),
  tagline: text(60), whatsapp: phone, cep: optional(z.string().regex(/^\d{5}-?\d{3}$/)),
  pixKey: text(150),
});
const privacy = z.object({ contact: z.boolean(), location: z.boolean() });
const notifications = z.object({ sightings: z.boolean(), adoption: z.boolean(), news: z.boolean() });
const tutorSettings = z.strictObject({
  profile: tutorForm, photo: image, privacy, notifications,
}).partial();
const ongSettings = z.strictObject({
  profile: ongForm, images: z.strictObject({ logo: image, cover: image }).partial(),
  donations: z.object({ supplies: text(600), instructions: text(1000) }),
  privacy, notifications: notifications.extend({ donations: z.boolean() }),
}).partial();

const addressFields = { cep: true, cidade: true, uf: true };
const accountFields = { email: true, telefone: true, endereco: { select: addressFields } };
const defaultNotifications = { sightings: true, adoption: true, news: false };

function readTutor(account) {
  const { tutor, endereco } = account;
  const { profile, photo, privacy, notifications } = tutor.perfil;
  return {
    profile: {
      intro: '', bio: '', website: '', instagram: '', facebook: '',
      email: account.email, phone: account.telefone, city: endereco?.cidade ?? '', state: endereco?.uf ?? '',
      ...profile, firstName: tutor.nome, lastName: tutor.sobrenome,
    },
    photo: photo ?? '',
    privacy: { contact: false, location: true, ...privacy },
    notifications: { ...defaultNotifications, ...notifications },
  };
}

function socialHandle(value) {
  return value?.replace(/^https?:\/\/(?:www\.)?(?:instagram|facebook)\.com\//i, '').replace(/\/$/, '') ?? '';
}

function readOng({ ong, endereco }) {
  return {
    profile: {
      name: ong.nome, cnpj: ong.cnpj, founded: String(ong.dataFundacao?.getUTCFullYear() ?? ''),
      tagline: ong.slogan ?? '', bio: ong.descricao ?? '', email: ong.emailPublico ?? '',
      whatsapp: ong.whatsappPublico ?? '', cep: endereco?.cep ?? '',
      city: endereco?.cidade ?? '', state: endereco?.uf ?? '', website: ong.siteUrl ?? '',
      instagram: socialHandle(ong.instagramUrl), facebook: socialHandle(ong.facebookUrl), pixKey: ong.chavePix ?? '',
    },
    images: { logo: ong.logoUrl ?? '', cover: ong.capaUrl ?? '' },
    donations: { supplies: ong.instrucoesDoacaoItens ?? '', instructions: ong.orientacoesDoacao ?? '' },
    privacy: { contact: ong.exibirContato, location: ong.exibirLocalizacao },
    notifications: { ...defaultNotifications, donations: true, ...ong.notificacoes },
  };
}

async function saveTutor(db, id, current, changes) {
  const { profile, ...settings } = changes;
  const names = profile && { nome: profile.firstName, sobrenome: profile.lastName };
  await db.tutor.update({
    where: { usuarioId: id },
    data: { ...names, perfil: { ...current.perfil, ...settings, ...(profile && { profile }) } },
  });
}

async function saveOng(db, id, changes) {
  const { profile, privacy, notifications, donations, images } = changes;
  if (profile) {
    const address = { cidade: profile.city || null, uf: states.get(profile.state) ?? null, cep: profile.cep.replace('-', '') || null };
    await db.usuario.update({
      where: { id }, data: { endereco: { upsert: { create: address, update: address } } },
    });
  }
  await db.ong.update({
    where: { usuarioId: id },
    data: {
      ...(profile && {
        nome: profile.name, cnpj: profile.cnpj,
        dataFundacao: profile.founded ? new Date(profile.founded + '-01-01T00:00:00Z') : null,
        slogan: profile.tagline, descricao: profile.bio, emailPublico: profile.email,
        whatsappPublico: profile.whatsapp, siteUrl: profile.website,
        instagramUrl: profile.instagram, facebookUrl: profile.facebook, chavePix: profile.pixKey,
      }),
      ...(images?.logo !== undefined && { logoUrl: images.logo || null }),
      ...(images?.cover !== undefined && { capaUrl: images.cover || null }),
      ...(donations && { instrucoesDoacaoItens: donations.supplies, orientacoesDoacao: donations.instructions }),
      ...(privacy && { exibirContato: privacy.contact, exibirLocalizacao: privacy.location }),
      ...(notifications && { notificacoes: notifications }),
    },
  });
}

const configurations = {
  ong: { schema: ongSettings, read: readOng, save: (db, id, _current, changes) => saveOng(db, id, changes) },
  tutor: { schema: tutorSettings, read: readTutor, save: saveTutor },
};

export function profileRoutes(prisma, sessionAccountId) {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.locals.accountId = sessionAccountId(req);
    if (!res.locals.accountId) return res.status(401).json({ message: 'Entre na sua conta.' });
    next();
  });

  for (const [role, { schema, read, save }] of Object.entries(configurations)) {
    const select = { ...accountFields, [role]: true };
    const forbidden = (res) => res.status(403).json({ message: 'Este perfil não pertence à sua conta.' });

    router.get('/' + role, async (_req, res) => {
      const account = await prisma.usuario.findUnique({ where: { id: res.locals.accountId }, select });
      if (!account?.[role]) return forbidden(res);
      return res.json({ settings: read(account) });
    });

    router.patch('/' + role, express.json({ limit: '3mb' }), async (req, res) => {
      if (!req.is('application/json')) return res.status(415).json({ message: 'Envie os dados em JSON.' });
      const changes = schema.safeParse(req.body);
      if (!changes.success || !Object.keys(changes.data).length) {
        return res.status(400).json({ message: changes.error?.issues[0]?.message ?? 'Revise os dados do perfil.' });
      }

      const id = res.locals.accountId;
      try {
        const updated = await prisma.$transaction(async (db) => {
          // Serializa gravações da mesma conta antes de ler as preferências existentes.
          await db.$queryRaw`SELECT id FROM public.usuario WHERE id = ${id} FOR UPDATE`;
          const account = await db.usuario.findUnique({ where: { id }, select });
          if (!account?.[role]) return null;
          await save(db, id, account[role], changes.data);
          return db.usuario.findUnique({ where: { id }, select });
        });
        return updated ? res.json({ settings: read(updated) }) : forbidden(res);
      } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Este CNPJ já está em uso.' });
        throw error;
      }
    });
  }
  return router;
}
