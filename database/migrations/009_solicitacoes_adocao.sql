BEGIN;

ALTER TABLE public.interesse_adocao
    ADD COLUMN registrado_em timestamptz,
    ADD COLUMN moradia text,
    ADD COLUMN outros_animais text,
    ADD COLUMN espaco text,
    ADD COLUMN aceito_em timestamptz,
    ADD CONSTRAINT interesse_respostas_completas CHECK (
        num_nonnulls(moradia, outros_animais, espaco, aceito_em) IN (0, 4)
    );

ALTER TABLE public.interesse_adocao
    ALTER COLUMN registrado_em SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
