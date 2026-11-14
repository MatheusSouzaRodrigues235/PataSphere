import { createHash, randomBytes } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { newPassword } from './registration-dto.js';
import { logoDirectory } from './registration.js';
import { passwordEmail } from './password-email.js';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';

const cookieName = 'patasphere_session';
const sessionDuration = 8 * 60 * 60 * 1000;
const attemptWindow = 15 * 60 * 1000;
const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = z.string().min(1).refine((value) => Buffer.byteLength(value) <= 72);
const credentials = z.object({ email, password });
const resetDuration = 30 * 60 * 1000;
const tokenPattern = /^[a-f0-9]{64}$/;
const resetPassword = z.object({ token: z.string().regex(tokenPattern), password: newPassword });
const changePassword = z.object({ currentPassword: password, password: newPassword });
const closeAccount = z.object({ password, confirmed: z.literal(true) });
const genericRecovery = 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.';
const organizationFields = { nome: true, cnpj: true, logoUrl: true };
const accountFields = {
  id: true, email: true, telefone: true,
  endereco: { select: { cep: true, cidade: true, uf: true } },
  ong: { select: organizationFields },
  tutor: { select: { nome: true, sobrenome: true, perfil: true } },
};

function identity(account) {
  const { ong, tutor } = account;
  if (!ong && !tutor) return null;
  const profile = ong
    ? { role: 'ong', name: ong.nome, photo: ong.logoUrl, cnpj: ong.cnpj }
    : { role: 'tutor', name: tutor.nome + ' ' + tutor.sobrenome, firstName: tutor.nome, lastName: tutor.sobrenome, photo: tutor.perfil.photo ?? null };

  return {
    ...profile,
    id: account.id.toString(),
    email: account.email,
    phone: account.telefone,
    cep: account.endereco?.cep ?? '',
    city: account.endereco?.cidade ?? '',
    state: account.endereco?.uf ?? '',
  };
}

function sessionKey(token) {
  return createHash('sha256').update(token).digest('hex');
}

function currentKey(req) {
  const value = req.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? sessionKey(value) : null;
}

export function authRoutes(prisma, { sendPasswordEmail = passwordEmail() } = {}) {
  const router = Router();
  const sessions = new Map();
  const attempts = new Map();
  const fallbackHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);
  const cookieOptions = {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/',
  };

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of sessions) if (entry.expires <= now) sessions.delete(key);
    for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  }, 60_000).unref();

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST' && !req.is('application/json')) {
      return res.status(415).json({ message: 'Envie os dados em JSON.' });
    }
    return next();
  });

  function limit(key, max, res) {
    const now = Date.now();
    const previous = attempts.get(key);
    const entry = previous?.expires > now ? previous : { count: 0, expires: now + attemptWindow };
    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      return false;
    }
    entry.count += 1;
    attempts.set(key, entry);
    return true;
  }

  function invalidateSessions(id) {
    for (const [key, session] of sessions) {
      if (session.accountId === id) sessions.delete(key);
    }
  }

  const tooMany = (res) => res.status(429).json({ message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  const deny = (res) => res.status(401).json({ message: 'Entre na sua conta.' });
  const invalidLink = (res) => res.status(400).json({ message: 'Este link é inválido, expirou ou já foi usado. Solicite outro.' });

  async function lockAccount(db, id) {
    const [row] = await db.$queryRaw`
      SELECT senha_hash, endereco_id FROM public.usuario WHERE id = ${id} FOR UPDATE
    `;
    return row;
  }

  router.post('/login', async (req, res) => {
    const input = credentials.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Informe um e-mail e uma senha válidos.' });

    if (!limit('login:' + req.ip, 20, res)) return tooMany(res);

    const account = await prisma.usuario.findUnique({
      where: { email: input.data.email },
      select: { ...accountFields, senhaHash: true },
    });
    const valid = await bcrypt.compare(input.data.password, account?.senhaHash ?? await fallbackHash);
    const profile = valid && account ? identity(account) : null;
    if (!profile) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });

    const token = randomBytes(32).toString('hex');
    const key = sessionKey(token);
    try {
      const issued = await prisma.$transaction(async (db) => {
        const locked = await lockAccount(db, account.id);
        if (locked?.senha_hash !== account.senhaHash) return false;
        sessions.set(key, { accountId: account.id, expires: Date.now() + sessionDuration });
        return true;
      });
      if (!issued || !sessions.has(key)) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    } catch (error) {
      sessions.delete(key);
      throw error;
    }
    sessions.delete(currentKey(req));
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionDuration });
    return res.json({ account: profile });
  });

  function sessionAccountId(req) {
    const session = sessions.get(currentKey(req));
    return session?.expires > Date.now() ? session.accountId : null;
  }

  router.get('/sessao', async (req, res) => {
    const key = currentKey(req);
    const accountId = sessionAccountId(req);
    if (accountId) {
      const account = await prisma.usuario.findUnique({
        where: { id: accountId }, select: accountFields,
      });
      const profile = account && identity(account);
      if (profile) return res.json({ account: profile });
    }

    sessions.delete(key);
    return res.status(401).json({ message: 'Entre na sua conta.' });
  });

  router.post('/recuperar-senha', async (req, res) => {
    const input = email.safeParse(req.body?.email);
    if (!input.success) return res.status(400).json({ message: 'Informe um e-mail válido.' });
    if (!sendPasswordEmail) return res.status(503).json({ message: 'A recuperação por e-mail está indisponível no momento.' });
    if (!limit('recovery-ip:' + req.ip, 12, res)) return tooMany(res);
    if (!limit('recovery-email:' + sessionKey(input.data), 3, res)) {
      return res.status(202).json({ message: genericRecovery });
    }

    const account = await prisma.usuario.findUnique({ where: { email: input.data }, select: { id: true } });
    if (account) {
      const token = randomBytes(32).toString('hex');
      const hash = sessionKey(token);
      const expires = new Date(Date.now() + resetDuration);
      const saved = await prisma.$transaction(async (db) => {
        if (!await lockAccount(db, account.id)) return false;
        await db.$executeRaw`
          INSERT INTO public.recuperacao_senha (usuario_id, token_hash, expira_em)
          VALUES (${account.id}, ${hash}, ${expires})
          ON CONFLICT (usuario_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expira_em = EXCLUDED.expira_em
        `;
        return true;
      });
      if (saved) {
        // Responda sem esperar o provedor para que o tempo de envio não revele a existência da conta.
        void Promise.resolve().then(() => sendPasswordEmail(input.data, token)).catch(() => {
          console.error('Falha ao enviar e-mail de recuperação.');
        });
      }
    }
    return res.status(202).json({ message: genericRecovery });
  });

  router.post('/redefinir-senha', async (req, res) => {
    if (!limit('reset:' + req.ip, 15, res)) return tooMany(res);
    const input = resetPassword.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ message: 'Confira o link e use uma senha de pelo menos 8 caracteres com letras e números.' });
    }
    const hash = sessionKey(input.data.token);
    const [recovery] = await prisma.$queryRaw`
      SELECT usuario_id FROM public.recuperacao_senha WHERE token_hash = ${hash} AND expira_em > NOW()
    `;
    if (!recovery) return invalidLink(res);

    const id = recovery.usuario_id;
    const senhaHash = await bcrypt.hash(input.data.password, 12);
    const updated = await prisma.$transaction(async (db) => {
      if (!await lockAccount(db, id)) return false;
      const consumed = await db.$executeRaw`
        DELETE FROM public.recuperacao_senha WHERE usuario_id = ${id} AND token_hash = ${hash} AND expira_em > NOW()
      `;
      if (!consumed) return false;
      await db.usuario.update({ where: { id }, data: { senhaHash } });
      invalidateSessions(id);
      return true;
    });
    if (!updated) return invalidLink(res);
    sessions.delete(currentKey(req));
    res.clearCookie(cookieName, cookieOptions);
    return res.sendStatus(204);
  });

  async function verifyCurrentPassword(req, res, currentPassword) {
    const id = sessionAccountId(req);
    if (!id) {
      deny(res);
      return null;
    }
    if (!limit('account:' + id, 12, res)) {
      tooMany(res);
      return null;
    }
    const account = await prisma.usuario.findUnique({ where: { id }, select: { senhaHash: true } });
    if (!account || !await bcrypt.compare(currentPassword, account.senhaHash)) {
      res.status(400).json({ message: 'Senha atual incorreta.' });
      return null;
    }
    return { id, hash: account.senhaHash };
  }

  router.post('/senha', async (req, res) => {
    if (!sessionAccountId(req)) return deny(res);
    const input = changePassword.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confira os dados. A nova senha precisa ter pelo menos 8 caracteres, com letras e números.' });
    const account = await verifyCurrentPassword(req, res, input.data.currentPassword);
    if (!account) return;
    const senhaHash = await bcrypt.hash(input.data.password, 12);
    const { id, hash } = account;
    const updated = await prisma.$transaction(async (db) => {
      const locked = await lockAccount(db, id);
      if (locked?.senha_hash !== hash || sessionAccountId(req) !== id) return false;
      await db.usuario.update({ where: { id }, data: { senhaHash } });
      await db.$executeRaw`DELETE FROM public.recuperacao_senha WHERE usuario_id = ${id}`;
      invalidateSessions(id);
      return true;
    });
    if (!updated) return deny(res);
    res.clearCookie(cookieName, cookieOptions);
    return res.sendStatus(204);
  });

  router.post('/encerrar-conta', async (req, res) => {
    if (!sessionAccountId(req)) return deny(res);
    const input = closeAccount.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Confirme o encerramento e informe sua senha atual.' });
    const account = await verifyCurrentPassword(req, res, input.data.password);
    if (!account) return;
    const { id, hash } = account;
    const deleted = await prisma.$transaction(async (db) => {
      const locked = await lockAccount(db, id);
      if (locked?.senha_hash !== hash || sessionAccountId(req) !== id) return null;
      const ong = await db.ong.findUnique({ where: { usuarioId: id }, select: { logoUrl: true } });
      await db.$executeRaw`DELETE FROM public.ocorrencia_pet WHERE autor_id = ${id}`;
      if (ong) {
        await db.$executeRaw`DELETE FROM public.animal WHERE ong_id = ${id}`;
        await db.$executeRaw`DELETE FROM public.doacao WHERE ong_id = ${id}`;
      }
      await db.usuario.delete({ where: { id } });
      if (locked.endereco_id) await db.endereco.delete({ where: { id: locked.endereco_id } });
      invalidateSessions(id);
      return { logo: ong?.logoUrl };
    });
    if (!deleted) return deny(res);

    const logo = /^\/api\/uploads\/logos\/([a-f0-9-]{36}\.webp)$/.exec(deleted.logo ?? '');
    if (logo) {
      await unlink(join(logoDirectory, logo[1])).catch((error) => {
        if (error.code !== 'ENOENT') console.error('Falha ao remover logo após encerramento:', error.code);
      });
    }
    res.clearCookie(cookieName, cookieOptions);
    return res.sendStatus(204);
  });

  router.post('/sair', (req, res) => {
    sessions.delete(currentKey(req));
    res.clearCookie(cookieName, cookieOptions);
    return res.sendStatus(204);
  });

  return { router, sessionAccountId };
}
