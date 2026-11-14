BEGIN;

ALTER TABLE public.tutor ADD COLUMN IF NOT EXISTS perfil jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.ong
    ADD COLUMN IF NOT EXISTS notificacoes jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS orientacoes_doacao text;

COMMIT;
