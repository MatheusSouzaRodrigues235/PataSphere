BEGIN;
ALTER TABLE public.ong DROP CONSTRAINT ong_cnpj_check;
ALTER TABLE public.ong ADD CONSTRAINT ong_cnpj_check CHECK (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$');
COMMIT;
