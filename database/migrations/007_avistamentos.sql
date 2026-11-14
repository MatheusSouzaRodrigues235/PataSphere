BEGIN;

CREATE TABLE IF NOT EXISTS public.avistamento_pet (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrencia_id bigint NOT NULL REFERENCES public.ocorrencia_pet (id) ON DELETE CASCADE,
    chave_envio uuid NOT NULL,
    nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 1 AND 80),
    whatsapp text NOT NULL CHECK (whatsapp ~ '^[1-9]{2}[0-9]{8,9}$'),
    local_avistamento text NOT NULL CHECK (char_length(btrim(local_avistamento)) BETWEEN 1 AND 160),
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lido_em timestamptz,
    UNIQUE (ocorrencia_id, chave_envio)
);

COMMIT;
