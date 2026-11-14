import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';

const cookieName = 'patasphere_session';
const sessionDuration = 8 * 60 * 60 * 1000;
const attemptWindow = 15 * 60 * 1000;
const credentials = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).refine((value) => Buffer.byteLength(value) <= 72),
});
const organizationFields = { nome: true, cnpj: true, logoUrl: true };
const accountFields = {
  id: true, email: true, telefone: true,
  endereco: { select: { cep: true, cidade: true, uf: true } },
  ong: { select: organizationFields },
  tutor: { select: { nome: true, sobrenome: true } },
};

function identity(account) {
  const { ong, tutor } = account;
  if (!ong && !tutor) return null;
  const profile = ong
    ? { role: 'ong', name: ong.nome, photo: ong.logoUrl, cnpj: ong.cnpj }
    : { role: 'tutor', name: tutor.nome + ' ' + tutor.sobrenome, firstName: tutor.nome, lastName: tutor.sobrenome };

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

export function authRoutes(prisma) {
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

  router.post('/login', async (req, res) => {
    const input = credentials.safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: 'Informe um e-mail e uma senha válidos.' });

    const now = Date.now();
    const previous = attempts.get(req.ip);
    const attempt = previous?.expires > now ? previous : { count: 0, expires: now + attemptWindow };
    if (attempt.count >= 20) {
      res.set('Retry-After', String(Math.ceil((attempt.expires - now) / 1000)));
      return res.status(429).json({ message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }
    attempt.count += 1;
    attempts.set(req.ip, attempt);

    const account = await prisma.usuario.findUnique({
      where: { email: input.data.email },
      select: { ...accountFields, senhaHash: true },
    });
    const valid = await bcrypt.compare(input.data.password, account?.senhaHash ?? await fallbackHash);
    const profile = valid && account ? identity(account) : null;
    if (!profile) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });

    sessions.delete(currentKey(req));
    const token = randomBytes(32).toString('hex');
    sessions.set(sessionKey(token), { accountId: account.id, expires: Date.now() + sessionDuration });
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionDuration });
    return res.json({ account: profile });
  });

  router.get('/sessao', async (req, res) => {
    const key = currentKey(req);
    const session = sessions.get(key);
    if (session?.expires > Date.now()) {
      const account = await prisma.usuario.findUnique({
        where: { id: session.accountId }, select: accountFields,
      });
      const profile = account && identity(account);
      if (profile) return res.json({ account: profile });
    }

    sessions.delete(key);
    return res.status(401).json({ message: 'Entre na sua conta.' });
  });

  router.post('/sair', (req, res) => {
    sessions.delete(currentKey(req));
    res.clearCookie(cookieName, cookieOptions);
    return res.sendStatus(204);
  });

  return router;
}
