-- =============================================================================
-- 04_api.sql  -- Preparação do banco para a API (rodar DEPOIS de 01, 02 e 03)
--   * login do funcionário (senha só como hash bcrypt, nunca em texto)
--   * tabela de auditoria
--   * usuário do MySQL usado pela API, com privilégios mínimos
-- =============================================================================
USE hotel_brmw;

ALTER TABLE funcionario
    ADD COLUMN login      VARCHAR(40)  NULL,
    ADD COLUMN senha_hash VARCHAR(100) NULL,
    ADD COLUMN papel      VARCHAR(12)  NULL,
    ADD COLUMN ativo      TINYINT(1)   NOT NULL DEFAULT 1,
    ADD CONSTRAINT uq_funcionario_login UNIQUE (login),
    ADD CONSTRAINT ck_funcionario_papel CHECK (papel IS NULL OR papel IN ('GERENTE','RECEPCAO'));

CREATE TABLE auditoria (
    id_auditoria BIGINT       NOT NULL AUTO_INCREMENT,
    data_hora    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario      VARCHAR(60)  NOT NULL,
    papel        VARCHAR(20)  NOT NULL,
    acao         VARCHAR(30)  NOT NULL,
    tabela       VARCHAR(40)  NOT NULL,
    registro     VARCHAR(40)  NOT NULL,
    detalhe      VARCHAR(500)     NULL,
    CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria)
) ENGINE = InnoDB;
CREATE INDEX idx_auditoria_data ON auditoria (data_hora);

-- Usuário da API (troque o placeholder e use a mesma senha em backend/.env)
CREATE USER IF NOT EXISTS 'hotel_app'@'localhost' IDENTIFIED BY 'TROQUE_ANTES_DE_EXECUTAR';
-- SELECT explícito nas tabelas usadas pela API (evita privilégio global por tabela).
GRANT SELECT ON hotel_brmw.cliente TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.pessoa_fisica TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.pessoa_juridica TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.dependente TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.funcionario TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.quarto TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.historico_status_quarto TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.reserva TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.servico TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.reserva_servico TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.fornecedor TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.produto TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.manutencao TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.item_manutencao TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.auditoria TO 'hotel_app'@'localhost';
GRANT INSERT ON hotel_brmw.cliente                 TO 'hotel_app'@'localhost';
GRANT INSERT ON hotel_brmw.pessoa_fisica           TO 'hotel_app'@'localhost';
GRANT INSERT ON hotel_brmw.pessoa_juridica         TO 'hotel_app'@'localhost';
GRANT INSERT, UPDATE ON hotel_brmw.reserva         TO 'hotel_app'@'localhost';
GRANT UPDATE ON hotel_brmw.quarto                  TO 'hotel_app'@'localhost';
GRANT INSERT, UPDATE ON hotel_brmw.historico_status_quarto TO 'hotel_app'@'localhost';
GRANT INSERT ON hotel_brmw.auditoria               TO 'hotel_app'@'localhost'; -- auditoria só recebe INSERT
-- Permissões para os CRUDs administrativos; as rotas continuam restritas a GERENTE.
GRANT INSERT, UPDATE, DELETE ON hotel_brmw.quarto      TO 'hotel_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON hotel_brmw.servico     TO 'hotel_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON hotel_brmw.produto     TO 'hotel_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON hotel_brmw.fornecedor  TO 'hotel_app'@'localhost';
GRANT SELECT ON hotel_brmw.vw_relatorio_hotel          TO 'hotel_app'@'localhost';
FLUSH PRIVILEGES;
