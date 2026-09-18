-- =============================================================================
-- PROJETO FINAL - LABORATORIO DE BANCO DE DADOS (GPE17M40083)
-- Dominio: Hotel (reservas, hospedagem, servicos, manutencao e suprimentos)
-- Arquivo: 01_ddl.sql  -- Script fisico (DDL)
-- SGBD: MySQL 8.0+ / compativel com MariaDB 10.11+
--
-- Executavel do inicio ao fim em base limpa.
-- Prefixos de restricao: pk_ (primaria), uq_ (unica), fk_ (estrangeira),
--                        ck_ (verificacao), idx_ (indice).
--
-- REGRAS DE NEGOCIO IMPLEMENTADAS POR RESTRICAO DO BANCO:
--   RN01 Todo cliente e' pessoa fisica OU juridica, nunca ambos (t, d).
--   RN02 CPF e CNPJ sao unicos no cadastro.
--   RN03 E-mail do cliente, quando informado, nao pode se repetir.
--   RN04 Telefone do cliente e' opcional.
--   RN05 Dependente so existe vinculado a um cliente, numerado dentro dele.
--   RN06 O numero do quarto e' unico no hotel.
--   RN07 O tipo do quarto e' SIMPLES, DUPLO, SUITE ou LUXO.
--   RN08 O preco da diaria e' sempre maior que zero.
--   RN09 Toda reserva pertence a exatamente um cliente e um quarto.
--   RN10 A data de checkout e' posterior a data de checkin.
--   RN11 O status da reserva e' PENDENTE, CONFIRMADA, EM_ANDAMENTO,
--        FINALIZADA ou CANCELADA.
--   RN12 O valor total da reserva nunca e' negativo.
--   RN13 Cliente com reserva registrada nao pode ser excluido.
--   RN14 Um mesmo servico e' lancado uma unica vez por reserva.
--   RN15 A quantidade de servico solicitada e' de no minimo 1.
--   RN16 Toda alteracao de situacao de quarto gera registro historico datado;
--        o periodo em aberto tem data_hora_fim nula.
--   RN17 A data de fim do historico, quando informada, e' posterior ao inicio.
--   RN18 Toda manutencao e' referente a um quarto e executada por um funcionario.
--   RN19 Um funcionario tem no maximo um supervisor e nunca supervisiona a si mesmo.
--   RN20 Todo produto pertence a um fornecedor; estoque e custo nao sao negativos.
-- =============================================================================

DROP DATABASE IF EXISTS hotel_brmw;
CREATE DATABASE hotel_brmw
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;
USE hotel_brmw;

-- -----------------------------------------------------------------------------
-- CLIENTE - superclasse da especializacao total e disjunta (t, d).
-- Estrategia de mapeamento: uma tabela para a superclasse + uma tabela por
-- subclasse. A coluna tipo_cliente e' o discriminador que garante a disjuncao
-- (RN01); a totalidade e' verificada por consulta e pela aplicacao.
-- -----------------------------------------------------------------------------
CREATE TABLE cliente (
    id_cliente   INT          NOT NULL AUTO_INCREMENT,
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(120)     NULL,               -- RN03
    telefone     VARCHAR(20)      NULL,               -- RN04: contato opcional
    tipo_cliente CHAR(2)      NOT NULL,               -- RN01: discriminador
    data_cadastro DATE        NOT NULL,
    CONSTRAINT pk_cliente            PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_email      UNIQUE (email),                    -- RN03
    CONSTRAINT ck_cliente_tipo       CHECK (tipo_cliente IN ('PF','PJ')) -- RN01
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- PESSOA_FISICA / PESSOA_JURIDICA - subclasses. A PK e' tambem FK para a
-- superclasse (chave herdada), o que impede um cliente sem superclasse.
-- -----------------------------------------------------------------------------
CREATE TABLE pessoa_fisica (
    id_cliente INT        NOT NULL,
    cpf        CHAR(11)   NOT NULL,                   -- RN02
    rg         VARCHAR(15)    NULL,                   -- documento opcional
    CONSTRAINT pk_pessoa_fisica  PRIMARY KEY (id_cliente),
    CONSTRAINT uq_pessoa_fisica_cpf UNIQUE (cpf),     -- RN02
    CONSTRAINT ck_pessoa_fisica_cpf CHECK (cpf REGEXP '^[0-9]{11}$'),
    CONSTRAINT fk_pessoa_fisica_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE            -- subclasse acompanha a superclasse
) ENGINE = InnoDB;

CREATE TABLE pessoa_juridica (
    id_cliente    INT          NOT NULL,
    cnpj          CHAR(14)     NOT NULL,              -- RN02
    razao_social  VARCHAR(150) NOT NULL,
    CONSTRAINT pk_pessoa_juridica   PRIMARY KEY (id_cliente),
    CONSTRAINT uq_pessoa_juridica_cnpj UNIQUE (cnpj), -- RN02
    CONSTRAINT ck_pessoa_juridica_cnpj CHECK (cnpj REGEXP '^[0-9]{14}$'),
    CONSTRAINT fk_pessoa_juridica_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- DEPENDENTE - entidade fraca. Identificacao por dependencia: a PK e' composta
-- pela chave do proprietario (id_cliente) e pelo identificador parcial
-- (num_sequencial). RN05.
-- -----------------------------------------------------------------------------
CREATE TABLE dependente (
    id_cliente      INT          NOT NULL,
    num_sequencial  SMALLINT     NOT NULL,            -- identificador parcial
    nome            VARCHAR(120) NOT NULL,
    data_nascimento DATE             NULL,
    CONSTRAINT pk_dependente PRIMARY KEY (id_cliente, num_sequencial),   -- RN05
    CONSTRAINT ck_dependente_seq CHECK (num_sequencial > 0),
    CONSTRAINT fk_dependente_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE            -- RN05: nao existe sem o dono
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- FUNCIONARIO - autorrelacionamento de supervisao (RN19).
-- -----------------------------------------------------------------------------
CREATE TABLE funcionario (
    id_funcionario INT           NOT NULL AUTO_INCREMENT,
    id_supervisor  INT               NULL,            -- RN19: (0,1)
    nome           VARCHAR(120)  NOT NULL,
    cargo          VARCHAR(40)   NOT NULL,
    salario        DECIMAL(10,2) NOT NULL,
    data_admissao  DATE          NOT NULL,
    CONSTRAINT pk_funcionario PRIMARY KEY (id_funcionario),
    CONSTRAINT ck_funcionario_salario CHECK (salario > 0),
    -- RN19 (nao supervisionar a si mesmo): o SGBD nao aceita coluna
    -- AUTO_INCREMENT dentro de CHECK, entao esta parte da regra e' verificada
    -- por consulta (03_consultas.sql) e pela aplicacao na Etapa 2.
    CONSTRAINT fk_funcionario_supervisor FOREIGN KEY (id_supervisor)
        REFERENCES funcionario (id_funcionario)
        ON DELETE SET NULL ON UPDATE CASCADE           -- saida do chefe nao apaga a equipe
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- QUARTO
-- situacao_atual e' atributo derivado do historico, mantido de forma
-- deliberadamente desnormalizada para evitar subconsulta em toda listagem.
-- -----------------------------------------------------------------------------
CREATE TABLE quarto (
    id_quarto     INT           NOT NULL AUTO_INCREMENT,
    numero        SMALLINT      NOT NULL,             -- RN06
    tipo          VARCHAR(10)   NOT NULL,             -- RN07
    preco_diaria  DECIMAL(10,2) NOT NULL,             -- RN08
    situacao_atual VARCHAR(15)  NOT NULL,             -- derivado do historico
    CONSTRAINT pk_quarto        PRIMARY KEY (id_quarto),
    CONSTRAINT uq_quarto_numero UNIQUE (numero),      -- RN06
    CONSTRAINT ck_quarto_tipo   CHECK (tipo IN ('SIMPLES','DUPLO','SUITE','LUXO')),  -- RN07
    CONSTRAINT ck_quarto_preco  CHECK (preco_diaria > 0),                            -- RN08
    CONSTRAINT ck_quarto_situacao CHECK (situacao_atual IN
        ('DISPONIVEL','OCUPADO','MANUTENCAO','LIMPEZA','BLOQUEADO'))
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- HISTORICO_STATUS_QUARTO - atributo temporal: situacao do quarto ao longo do
-- tempo. Periodo em aberto tem data_hora_fim NULL (RN16, RN17).
-- -----------------------------------------------------------------------------
CREATE TABLE historico_status_quarto (
    id_historico      INT          NOT NULL AUTO_INCREMENT,
    id_quarto         INT          NOT NULL,
    status_anterior   VARCHAR(15)      NULL,          -- nulo no primeiro registro
    novo_status       VARCHAR(15)  NOT NULL,
    data_hora_inicio  DATETIME     NOT NULL,
    data_hora_fim     DATETIME         NULL,          -- RN16: periodo em aberto
    motivo_alteracao  VARCHAR(200)     NULL,
    CONSTRAINT pk_historico_status_quarto PRIMARY KEY (id_historico),
    CONSTRAINT uq_historico_quarto_inicio UNIQUE (id_quarto, data_hora_inicio),
    CONSTRAINT ck_historico_periodo CHECK (data_hora_fim IS NULL
                                        OR data_hora_fim > data_hora_inicio),        -- RN17
    CONSTRAINT ck_historico_status CHECK (novo_status IN
        ('DISPONIVEL','OCUPADO','MANUTENCAO','LIMPEZA','BLOQUEADO')),
    CONSTRAINT fk_historico_quarto FOREIGN KEY (id_quarto)
        REFERENCES quarto (id_quarto)
        ON DELETE CASCADE ON UPDATE CASCADE            -- RN16: historico segue o quarto
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- RESERVA
-- -----------------------------------------------------------------------------
CREATE TABLE reserva (
    id_reserva     INT           NOT NULL AUTO_INCREMENT,
    id_cliente     INT           NOT NULL,            -- RN09
    id_quarto      INT           NOT NULL,            -- RN09
    data_checkin   DATE          NOT NULL,
    data_checkout  DATE          NOT NULL,
    status         VARCHAR(15)   NOT NULL,            -- RN11
    valor_total    DECIMAL(10,2) NOT NULL,            -- RN12
    CONSTRAINT pk_reserva PRIMARY KEY (id_reserva),
    CONSTRAINT ck_reserva_periodo CHECK (data_checkout > data_checkin),   -- RN10
    CONSTRAINT ck_reserva_valor   CHECK (valor_total >= 0),               -- RN12
    CONSTRAINT ck_reserva_status  CHECK (status IN
        ('PENDENTE','CONFIRMADA','EM_ANDAMENTO','FINALIZADA','CANCELADA')), -- RN11
    CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,          -- RN13: preserva o historico comercial
    CONSTRAINT fk_reserva_quarto FOREIGN KEY (id_quarto)
        REFERENCES quarto (id_quarto)
        ON DELETE RESTRICT ON UPDATE CASCADE           -- quarto com reserva nao e' excluido
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- SERVICO
-- -----------------------------------------------------------------------------
CREATE TABLE servico (
    id_servico   INT           NOT NULL AUTO_INCREMENT,
    nome_servico VARCHAR(80)   NOT NULL,
    preco_base   DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_servico        PRIMARY KEY (id_servico),
    CONSTRAINT uq_servico_nome   UNIQUE (nome_servico),
    CONSTRAINT ck_servico_preco  CHECK (preco_base >= 0)
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- RESERVA_SERVICO - tabela associativa N:N com atributos proprios
-- (data_hora_solicitacao, quantidade, preco cobrado no momento). RN14, RN15.
-- O preco e' historico: o valor praticado fica registrado aqui, pois o
-- preco_base do servico pode mudar depois.
-- -----------------------------------------------------------------------------
CREATE TABLE reserva_servico (
    id_reserva            INT           NOT NULL,
    id_servico            INT           NOT NULL,
    data_hora_solicitacao DATETIME      NOT NULL,
    quantidade            SMALLINT      NOT NULL,     -- RN15
    preco                 DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_reserva_servico PRIMARY KEY (id_reserva, id_servico),   -- RN14
    CONSTRAINT ck_reserva_servico_qtd   CHECK (quantidade >= 1),          -- RN15
    CONSTRAINT ck_reserva_servico_preco CHECK (preco >= 0),
    CONSTRAINT fk_reserva_servico_reserva FOREIGN KEY (id_reserva)
        REFERENCES reserva (id_reserva)
        ON DELETE CASCADE ON UPDATE CASCADE,           -- consumo nao existe sem a reserva
    CONSTRAINT fk_reserva_servico_servico FOREIGN KEY (id_servico)
        REFERENCES servico (id_servico)
        ON DELETE RESTRICT ON UPDATE CASCADE           -- servico ja lancado nao some do catalogo
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- FORNECEDOR
-- -----------------------------------------------------------------------------
CREATE TABLE fornecedor (
    id_fornecedor INT          NOT NULL AUTO_INCREMENT,
    razao_social  VARCHAR(150) NOT NULL,
    cnpj          CHAR(14)     NOT NULL,
    telefone      VARCHAR(20)      NULL,
    CONSTRAINT pk_fornecedor      PRIMARY KEY (id_fornecedor),
    CONSTRAINT uq_fornecedor_cnpj UNIQUE (cnpj),
    CONSTRAINT ck_fornecedor_cnpj CHECK (cnpj REGEXP '^[0-9]{14}$')
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- PRODUTO - RN20
-- -----------------------------------------------------------------------------
CREATE TABLE produto (
    id_produto    INT           NOT NULL AUTO_INCREMENT,
    id_fornecedor INT           NOT NULL,             -- RN20
    nome_produto  VARCHAR(100)  NOT NULL,
    qtd_estoque   INT           NOT NULL,
    preco_custo   DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_produto PRIMARY KEY (id_produto),
    CONSTRAINT ck_produto_estoque CHECK (qtd_estoque >= 0),               -- RN20
    CONSTRAINT ck_produto_custo   CHECK (preco_custo >= 0),               -- RN20
    CONSTRAINT fk_produto_fornecedor FOREIGN KEY (id_fornecedor)
        REFERENCES fornecedor (id_fornecedor)
        ON DELETE RESTRICT ON UPDATE CASCADE           -- fornecedor com produto nao e' excluido
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- MANUTENCAO - RN18
-- -----------------------------------------------------------------------------
CREATE TABLE manutencao (
    id_manutencao   INT          NOT NULL AUTO_INCREMENT,
    id_quarto       INT          NOT NULL,            -- RN18
    id_funcionario  INT          NOT NULL,            -- RN18
    data_manutencao DATE         NOT NULL,
    descricao       VARCHAR(200)     NULL,
    CONSTRAINT pk_manutencao PRIMARY KEY (id_manutencao),
    CONSTRAINT fk_manutencao_quarto FOREIGN KEY (id_quarto)
        REFERENCES quarto (id_quarto)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_manutencao_funcionario FOREIGN KEY (id_funcionario)
        REFERENCES funcionario (id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE           -- RN18: responsavel sempre identificado
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- ITEM_MANUTENCAO - segunda tabela associativa N:N com atributos proprios
-- (quantidade e custo unitario aplicado na ocasiao).
-- -----------------------------------------------------------------------------
CREATE TABLE item_manutencao (
    id_manutencao  INT           NOT NULL,
    id_produto     INT           NOT NULL,
    quantidade     SMALLINT      NOT NULL,
    custo          DECIMAL(10,2) NOT NULL,            -- custo unitario na ocasiao
    CONSTRAINT pk_item_manutencao PRIMARY KEY (id_manutencao, id_produto),
    CONSTRAINT ck_item_manutencao_qtd   CHECK (quantidade >= 1),
    CONSTRAINT ck_item_manutencao_custo CHECK (custo >= 0),
    CONSTRAINT fk_item_manutencao_manutencao FOREIGN KEY (id_manutencao)
        REFERENCES manutencao (id_manutencao)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_manutencao_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------------------------------
-- INDICES DE APOIO (alem dos criados automaticamente por PK, UNIQUE e FK)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_reserva_periodo   ON reserva (data_checkin, data_checkout);
CREATE INDEX idx_reserva_status    ON reserva (status);
CREATE INDEX idx_cliente_nome      ON cliente (nome);
CREATE INDEX idx_quarto_tipo       ON quarto (tipo, preco_diaria);
CREATE INDEX idx_historico_aberto  ON historico_status_quarto (id_quarto, data_hora_fim);
CREATE INDEX idx_manutencao_data   ON manutencao (data_manutencao);
