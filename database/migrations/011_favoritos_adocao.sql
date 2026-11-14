BEGIN;

CREATE TABLE public.favorito_adocao (
    tutor_id bigint NOT NULL REFERENCES public.tutor (usuario_id) ON DELETE CASCADE,
    animal_id bigint NOT NULL REFERENCES public.animal (id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, animal_id)
);

CREATE INDEX favorito_adocao_por_animal ON public.favorito_adocao (animal_id);

COMMIT;
