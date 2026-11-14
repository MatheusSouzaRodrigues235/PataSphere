export function passwordEmail(env = process.env, fetchEmail = fetch) {
  const { RESEND_API_KEY, PASSWORD_RESET_FROM, PUBLIC_APP_URL } = env;
  if (!RESEND_API_KEY || !PASSWORD_RESET_FROM || !PUBLIC_APP_URL) return null;
  let url;
  try {
    url = new URL('/redefinir-senha', PUBLIC_APP_URL);
  } catch {
    return null;
  }
  const local = env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return null;

  return async (email, token) => {
    const link = new URL(url);
    link.hash = token;
    const response = await fetchEmail('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        from: PASSWORD_RESET_FROM, to: [email], subject: 'Redefinição de senha do PataSphere',
        text: 'Para definir uma nova senha, acesse este link em até 30 minutos:\n\n' + link +
          '\n\nSe você não pediu a redefinição, ignore este e-mail.',
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('Falha no envio do e-mail de recuperação.');
    }
    await response.body?.cancel();
  };
}
