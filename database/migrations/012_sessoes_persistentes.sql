BEGIN;

CREATE TABLE public.sessao_usuario (
    token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    usuario_id bigint NOT NULL REFERENCES public.usuario (id) ON DELETE CASCADE,
    expira_em timestamptz NOT NULL
);

CREATE INDEX sessao_usuario_por_usuario ON public.sessao_usuario (usuario_id);
CREATE INDEX sessao_usuario_por_expiracao ON public.sessao_usuario (expira_em);

COMMIT;
