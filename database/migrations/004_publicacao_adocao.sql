ALTER TABLE public.animal
    ADD COLUMN chave_publicacao uuid,
    ADD UNIQUE (ong_id, chave_publicacao);
