BEGIN;

CREATE TABLE public.recuperacao_senha (
    usuario_id bigint PRIMARY KEY REFERENCES public.usuario (id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    expira_em timestamptz NOT NULL
);

COMMIT;
