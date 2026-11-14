import { PrismaClient } from '@prisma/client';

const [title = '', message = '', ...extra] = process.argv.slice(2).map((value) => value.trim());
if (!title || title.length > 160 || !message || message.length > 1000 || extra.length) {
  console.error('Informe um título de até 160 caracteres e uma mensagem de até 1000 caracteres.');
  process.exitCode = 1;
} else {
  const db = new PrismaClient();
  try {
    const count = await db.$executeRaw`
      INSERT INTO public.notificacao (usuario_id, categoria, titulo, mensagem)
      SELECT u.id, 'news', ${title}, ${message}
      FROM public.usuario u
      LEFT JOIN public.tutor t ON t.usuario_id = u.id
      LEFT JOIN public.ong o ON o.usuario_id = u.id
      WHERE COALESCE(o.notificacoes -> 'news', t.perfil -> 'notifications' -> 'news') = 'true'::jsonb
    `;
    console.log('Comunicado publicado para ' + count + ' conta(s).');
  } catch {
    console.error('Não foi possível publicar o comunicado. Confira a conexão e as permissões do banco.');
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
