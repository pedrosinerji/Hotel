-- 06_testes_etapa2.sql — roteiro de experimentos B2, B3 e B4
USE hotel_brmw;

-- B2: demonstração manual de SQL injection na interface (não executar como SQL):
-- Valor de teste no campo de busca textual: ' OR '1'='1' --
-- Resultado esperado: é tratado como valor literal por prepared statement; não autentica
-- nem altera a consulta. Anexar captura da interface e log da resposta no relatório.

-- B3: transação bem-sucedida de demonstração (usar IDs existentes e ambiente de teste).
-- START TRANSACTION;
-- UPDATE reserva SET status='CONFIRMADA' WHERE id_reserva = <ID_PENDENTE>;
-- INSERT INTO auditoria (usuario,papel,acao,tabela,registro,detalhe)
-- VALUES (CURRENT_USER(),'TESTE','DEMO','reserva','<ID_PENDENTE>','transação de demonstração');
-- COMMIT;
-- Verifique ambas as alterações após COMMIT.

-- B3: falha provocada no meio e rollback.
-- START TRANSACTION;
-- UPDATE reserva SET status='CONFIRMADA' WHERE id_reserva = <ID_PENDENTE>;
-- UPDATE quarto SET preco_diaria=-1 WHERE id_quarto = <ID_QUARTO_EXISTENTE>; -- viola CHECK
-- ROLLBACK;
-- Verifique que o status da reserva não mudou. Execute somente em base de testes.

-- B3: concorrência (duas sessões/terminais simultâneos):
-- Sessão A: SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
--           START TRANSACTION;
--           SELECT * FROM quarto WHERE id_quarto=1 FOR UPDATE;
--           -- aguarde sem COMMIT.
-- Sessão B: SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
--           START TRANSACTION;
--           UPDATE quarto SET situacao_atual='LIMPEZA' WHERE id_quarto=1;
--           -- registre a espera; depois faça COMMIT na sessão A e observe B.
-- Documentar o que foi realmente observado e o isolamento consultado por:
SELECT @@transaction_isolation AS nivel_isolamento_sessao;

-- B4: execute antes/depois de criar os índices do arquivo 05_etapa2.sql.
EXPLAIN SELECT id_reserva FROM reserva WHERE id_quarto=1 AND status='CONFIRMADA'
  AND data_checkin < '2026-12-01' AND '2026-11-01' < data_checkout;
EXPLAIN SELECT status, COUNT(*) FROM reserva WHERE data_checkin BETWEEN
  '2026-01-01' AND '2026-12-31' GROUP BY status HAVING COUNT(*) > 1;
EXPLAIN SELECT id_reserva, COUNT(*) FROM reserva_servico GROUP BY id_reserva;
