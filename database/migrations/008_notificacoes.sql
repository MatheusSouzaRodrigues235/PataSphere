BEGIN;

ALTER TABLE public.avistamento_pet ADD COLUMN notificar boolean NOT NULL DEFAULT true;

CREATE TABLE public.interesse_adocao (
    animal_id bigint NOT NULL REFERENCES public.animal (id) ON DELETE CASCADE,
    tutor_id bigint NOT NULL REFERENCES public.tutor (usuario_id) ON DELETE CASCADE,
    PRIMARY KEY (animal_id, tutor_id)
);

CREATE TABLE public.notificacao (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES public.usuario (id) ON DELETE CASCADE,
    categoria text NOT NULL CHECK (categoria IN ('adoption', 'donations', 'news')),
    titulo text NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 1 AND 160),
    mensagem text NOT NULL CHECK (char_length(btrim(mensagem)) BETWEEN 1 AND 1000),
    destino text,
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lido_em timestamptz
);

CREATE INDEX notificacao_por_usuario ON public.notificacao (usuario_id, id DESC);
CREATE INDEX notificacao_nao_lida_por_usuario ON public.notificacao (usuario_id) WHERE lido_em IS NULL;

COMMIT;
