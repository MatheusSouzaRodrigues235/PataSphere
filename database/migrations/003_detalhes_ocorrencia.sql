ALTER TABLE public.ocorrencia_pet
    ADD COLUMN chave_publicacao uuid UNIQUE,
    ADD COLUMN saude text,
    ADD COLUMN temperamento text,
    ADD COLUMN email_contato text;
