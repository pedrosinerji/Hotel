-- =============================================================================
-- 05_etapa2.sql — artefatos adicionais exigidos pela Etapa 2
-- Executar como administrador DEPOIS de 01_ddl.sql, 02_carga.sql e 04_api.sql.
-- MySQL 8.0+. Troque senhas antes de executar em qualquer ambiente compartilhado.
-- =============================================================================
USE hotel_brmw;

-- B1: visão que alimenta a tela de relatório consolidado.
CREATE OR REPLACE VIEW vw_relatorio_hotel AS
SELECT q.tipo AS tipo_quarto,
       COUNT(DISTINCT q.id_quarto) AS total_quartos,
       COUNT(DISTINCT CASE WHEN q.situacao_atual = 'DISPONIVEL' THEN q.id_quarto END) AS quartos_disponiveis,
       COUNT(DISTINCT CASE WHEN q.situacao_atual = 'OCUPADO' THEN q.id_quarto END) AS quartos_ocupados,
       COUNT(DISTINCT CASE WHEN r.status <> 'CANCELADA' THEN r.id_reserva END) AS reservas_nao_canceladas,
       COALESCE(SUM(CASE WHEN r.status NOT IN ('CANCELADA') THEN r.valor_total ELSE 0 END), 0) AS valor_reservas,
       ROUND(AVG(CASE WHEN r.status NOT IN ('CANCELADA') THEN r.valor_total END), 2) AS ticket_medio
  FROM quarto q
  LEFT JOIN reserva r ON r.id_quarto = q.id_quarto
 GROUP BY q.tipo;

-- B6: triggers para auditar alterações de reservas e quartos no próprio banco.
-- O campo usuario registra CURRENT_USER() do MySQL; a API também mantém auditoria de ações.
DELIMITER $$
CREATE TRIGGER trg_aud_reserva_update
AFTER UPDATE ON reserva
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (data_hora, usuario, papel, acao, tabela, registro, detalhe)
  VALUES (NOW(), CURRENT_USER(), 'BANCO', 'UPDATE', 'reserva', CAST(NEW.id_reserva AS CHAR),
    CONCAT('ANTES=', JSON_OBJECT('status', OLD.status, 'valor_total', OLD.valor_total,
      'data_checkin', OLD.data_checkin, 'data_checkout', OLD.data_checkout),
      '; DEPOIS=', JSON_OBJECT('status', NEW.status, 'valor_total', NEW.valor_total,
      'data_checkin', NEW.data_checkin, 'data_checkout', NEW.data_checkout)));
END$$

CREATE TRIGGER trg_aud_quarto_update
AFTER UPDATE ON quarto
FOR EACH ROW
BEGIN
  IF OLD.situacao_atual <> NEW.situacao_atual OR OLD.preco_diaria <> NEW.preco_diaria THEN
    INSERT INTO auditoria (data_hora, usuario, papel, acao, tabela, registro, detalhe)
    VALUES (NOW(), CURRENT_USER(), 'BANCO', 'UPDATE', 'quarto', CAST(NEW.id_quarto AS CHAR),
      CONCAT('ANTES=', JSON_OBJECT('situacao_atual', OLD.situacao_atual, 'preco_diaria', OLD.preco_diaria),
        '; DEPOIS=', JSON_OBJECT('situacao_atual', NEW.situacao_atual, 'preco_diaria', NEW.preco_diaria)));
  END IF;
END$$
DELIMITER ;

-- B5: três perfis do banco usando roles MySQL 8.0. As permissões são deliberadamente distintas.
CREATE ROLE IF NOT EXISTS 'hotel_leitura', 'hotel_recepcao', 'hotel_gerencia';
GRANT SELECT ON hotel_brmw.vw_relatorio_hotel TO 'hotel_leitura';
-- O perfil de leitura acessa apenas a visão agregada, não a tabela completa de quartos.
GRANT SELECT ON hotel_brmw.reserva TO 'hotel_recepcao';
GRANT SELECT ON hotel_brmw.cliente TO 'hotel_recepcao';
GRANT SELECT ON hotel_brmw.pessoa_fisica TO 'hotel_recepcao';
GRANT SELECT ON hotel_brmw.pessoa_juridica TO 'hotel_recepcao';
GRANT SELECT ON hotel_brmw.quarto TO 'hotel_recepcao';
GRANT INSERT, UPDATE ON hotel_brmw.reserva TO 'hotel_recepcao';
GRANT UPDATE ON hotel_brmw.quarto TO 'hotel_recepcao';
-- Demonstração explícita de REVOKE: retira uma permissão temporária que não deve
-- permanecer no perfil de recepção. O resultado final é sem UPDATE de produtos.
GRANT UPDATE ON hotel_brmw.produto TO 'hotel_recepcao';
REVOKE UPDATE ON hotel_brmw.produto FROM 'hotel_recepcao';
GRANT SELECT, INSERT, UPDATE, DELETE ON hotel_brmw.* TO 'hotel_gerencia';
GRANT SELECT ON hotel_brmw.auditoria TO 'hotel_gerencia';
-- Exemplo de usuário de leitura; crie contas específicas conforme as políticas da equipe:
-- CREATE USER 'hotel_relatorio'@'localhost' IDENTIFIED BY 'TROQUE-ESTA-SENHA';
-- GRANT 'hotel_leitura' TO 'hotel_relatorio'@'localhost';
-- SET DEFAULT ROLE 'hotel_leitura' TO 'hotel_relatorio'@'localhost';

-- B4: índices sugeridos para testar. Não aplique cegamente: compare EXPLAIN e tempo real.
-- Índice composto para filtro por quarto/status/período em consultas de disponibilidade.
CREATE INDEX idx_reserva_quarto_status_periodo
    ON reserva (id_quarto, status, data_checkin, data_checkout);
CREATE INDEX idx_reserva_status_checkin
    ON reserva (status, data_checkin);
CREATE INDEX idx_reserva_servico_reserva
    ON reserva_servico (id_reserva, id_servico);

-- Roteiro de medição obrigatório (salvar resultados reais no relatório; não inventar tempos):
-- 1) EXPLAIN SELECT id_reserva FROM reserva WHERE id_quarto=1 AND status='CONFIRMADA'
--    AND data_checkin < '2026-12-01' AND '2026-11-01' < data_checkout;
-- 2) EXPLAIN SELECT status, COUNT(*) FROM reserva WHERE data_checkin BETWEEN
--    '2026-01-01' AND '2026-12-31' GROUP BY status HAVING COUNT(*) > 1;
-- 3) EXPLAIN SELECT id_reserva, COUNT(*) FROM reserva_servico GROUP BY id_reserva;
-- Execute os mesmos SELECT antes/depois dos índices, use EXPLAIN ANALYZE (MySQL 8.0.18+)
-- e registre volume de linhas, custo/tempo observado e conclusão honesta.
