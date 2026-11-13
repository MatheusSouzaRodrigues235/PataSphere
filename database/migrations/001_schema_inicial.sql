-- PostgreSQL 18. Execute uma vez no banco patasphere.
-- A transação impede que uma falha deixe apenas parte das tabelas criada.
BEGIN;

CREATE TABLE public.endereco (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cep text CHECK (cep ~ '^[0-9]{8}$'),
    uf text CHECK (uf IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
    cidade text,
    bairro text,
    logradouro text,
    numero text,
    complemento text
);

CREATE TABLE public.usuario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL UNIQUE CHECK (email <> '' AND email = lower(btrim(email))),
    senha_hash text NOT NULL CHECK (btrim(senha_hash) <> ''),
    telefone text NOT NULL CHECK (telefone ~ '^[0-9]{10,11}$'),
    endereco_id bigint UNIQUE REFERENCES public.endereco (id),
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A API deve criar a conta e exatamente um perfil na mesma transação,
-- validar CPF/CNPJ e exigir o endereço completo no cadastro da ONG.
CREATE TABLE public.tutor (
    usuario_id bigint PRIMARY KEY REFERENCES public.usuario (id) ON DELETE CASCADE,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    sobrenome text NOT NULL CHECK (btrim(sobrenome) <> ''),
    cpf text NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$')
);

CREATE TABLE public.ong (
    usuario_id bigint PRIMARY KEY REFERENCES public.usuario (id) ON DELETE CASCADE,
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    cnpj text NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9]{14}$'),
    data_fundacao date,
    slogan text,
    descricao text,
    email_publico text,
    whatsapp_publico text,
    site_url text,
    instagram_url text,
    facebook_url text,
    logo_url text,
    capa_url text,
    chave_pix text,
    instrucoes_doacao_itens text,
    exibir_contato boolean NOT NULL DEFAULT true,
    exibir_localizacao boolean NOT NULL DEFAULT true
);

CREATE TABLE public.animal (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ong_id bigint NOT NULL REFERENCES public.ong (usuario_id),
    nome text NOT NULL CHECK (btrim(nome) <> ''),
    especie text NOT NULL CHECK (especie IN ('cao', 'gato', 'outro')),
    raca text,
    porte text NOT NULL CHECK (porte IN ('pequeno', 'medio', 'grande')),
    faixa_etaria text NOT NULL,
    sexo text NOT NULL CHECK (sexo IN ('femea', 'macho')),
    cor text,
    saude text,
    temperamento text,
    urgencia text NOT NULL CHECK (urgencia IN ('baixa', 'media', 'alta')),
    status_adocao text NOT NULL DEFAULT 'disponivel'
        CHECK (status_adocao IN ('disponivel', 'em_tratamento', 'em_processo_de_adocao', 'adotado')),
    descricao text,
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.foto_animal (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    animal_id bigint NOT NULL REFERENCES public.animal (id) ON DELETE CASCADE,
    url text NOT NULL CHECK (btrim(url) <> ''),
    ordem integer NOT NULL CHECK (ordem >= 1),
    UNIQUE (animal_id, ordem)
);

CREATE TABLE public.ocorrencia_pet (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    autor_id bigint NOT NULL REFERENCES public.usuario (id),
    animal_id bigint REFERENCES public.animal (id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('perdido', 'encontrado')),
    status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
    nome_animal text,
    especie text NOT NULL CHECK (especie IN ('cao', 'gato', 'outro')),
    raca text,
    sexo text NOT NULL CHECK (sexo IN ('femea', 'macho', 'nao_identificado')),
    porte text NOT NULL CHECK (porte IN ('pequeno', 'medio', 'grande')),
    faixa_etaria text NOT NULL,
    urgencia text NOT NULL CHECK (urgencia IN ('baixa', 'media', 'alta')),
    descricao text NOT NULL CHECK (btrim(descricao) <> ''),
    data_fato date NOT NULL,
    cep text CHECK (cep ~ '^[0-9]{8}$'),
    uf text NOT NULL CHECK (uf IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
    cidade text NOT NULL CHECK (btrim(cidade) <> ''),
    bairro text NOT NULL CHECK (btrim(bairro) <> ''),
    logradouro text,
    numero text,
    referencia text,
    latitude numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
    longitude numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
    nome_contato text NOT NULL CHECK (btrim(nome_contato) <> ''),
    whatsapp_contato text NOT NULL CHECK (whatsapp_contato ~ '^[0-9]{10,11}$'),
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em timestamptz,
    CONSTRAINT ocorrencia_nome_perdido CHECK (tipo <> 'perdido' OR (nome_animal IS NOT NULL AND btrim(nome_animal) <> '')),
    CONSTRAINT ocorrencia_coordenadas_em_par CHECK ((latitude IS NULL) = (longitude IS NULL)),
    CONSTRAINT ocorrencia_encerramento CHECK (
        (status = 'encerrada') = (encerrado_em IS NOT NULL)
    )
);

-- A API deve publicar a ocorrência e pelo menos uma foto na mesma transação.
-- A faixa de posições e a unicidade impedem mais de quatro fotos por ocorrência.
CREATE TABLE public.foto_ocorrencia (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrencia_id bigint NOT NULL REFERENCES public.ocorrencia_pet (id) ON DELETE CASCADE,
    url text NOT NULL CHECK (btrim(url) <> ''),
    ordem integer NOT NULL CHECK (ordem BETWEEN 1 AND 4),
    UNIQUE (ocorrencia_id, ordem)
);

CREATE TABLE public.doacao (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ong_id bigint NOT NULL REFERENCES public.ong (usuario_id),
    tipo text NOT NULL CHECK (tipo IN ('financeira', 'racao', 'medicamento')),
    forma_recebimento text NOT NULL,
    valor numeric(14,2),
    quantidade numeric(14,3),
    unidade text,
    nome_doador text NOT NULL CHECK (btrim(nome_doador) <> ''),
    email_doador text,
    descricao text,
    data_doacao date NOT NULL DEFAULT CURRENT_DATE,
    criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doacao_dados_por_tipo CHECK (
        (tipo = 'financeira' AND forma_recebimento IN ('pix', 'transferencia', 'dinheiro')
            AND valor IS NOT NULL AND valor > 0 AND valor <> 'NaN'::numeric
            AND quantidade IS NULL AND unidade IS NULL)
        OR
        (tipo = 'racao' AND forma_recebimento = 'entrega_presencial'
            AND valor IS NULL AND quantidade IS NOT NULL AND quantidade > 0
            AND quantidade <> 'NaN'::numeric AND unidade IS NOT NULL AND unidade = 'kg')
        OR
        (tipo = 'medicamento' AND forma_recebimento = 'entrega_presencial'
            AND valor IS NULL AND quantidade IS NOT NULL AND quantidade > 0
            AND quantidade <> 'NaN'::numeric AND quantidade = trunc(quantidade)
            AND unidade IS NOT NULL AND unidade IN ('unidades', 'caixas', 'frascos'))
    )
);

CREATE TABLE public.anexo_doacao (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doacao_id bigint NOT NULL REFERENCES public.doacao (id) ON DELETE CASCADE,
    chave_arquivo text NOT NULL CHECK (btrim(chave_arquivo) <> ''),
    nome_original text NOT NULL CHECK (btrim(nome_original) <> ''),
    tipo_mime text NOT NULL CHECK (tipo_mime IN (
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
    ))
);

CREATE INDEX animal_por_ong_status ON public.animal (ong_id, status_adocao);
CREATE INDEX ocorrencia_por_autor ON public.ocorrencia_pet (autor_id);
CREATE INDEX ocorrencia_por_animal ON public.ocorrencia_pet (animal_id);
CREATE INDEX ocorrencia_por_tipo_status_data ON public.ocorrencia_pet (tipo, status, data_fato DESC);
CREATE INDEX doacao_por_ong_data ON public.doacao (ong_id, data_doacao DESC);
CREATE INDEX anexo_por_doacao ON public.anexo_doacao (doacao_id);

CREATE FUNCTION public.patasphere_atualizar_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em := statement_timestamp();
    RETURN NEW;
END;
$$;

CREATE TRIGGER usuario_atualizar_data BEFORE UPDATE ON public.usuario
    FOR EACH ROW EXECUTE FUNCTION public.patasphere_atualizar_data();
CREATE TRIGGER animal_atualizar_data BEFORE UPDATE ON public.animal
    FOR EACH ROW EXECUTE FUNCTION public.patasphere_atualizar_data();
CREATE TRIGGER ocorrencia_atualizar_data BEFORE UPDATE ON public.ocorrencia_pet
    FOR EACH ROW EXECUTE FUNCTION public.patasphere_atualizar_data();

COMMIT;
