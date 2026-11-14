BEGIN;

ALTER TABLE public.doacao
    ADD COLUMN chave_registro uuid,
    ADD UNIQUE (ong_id, chave_registro);

ALTER TABLE public.anexo_doacao ADD COLUMN conteudo bytea;

COMMIT;
