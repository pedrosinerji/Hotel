-- =============================================================================
-- PROJETO FINAL - LABORATORIO DE BANCO DE DADOS (GPE17M40083)
-- Dominio: Hotel
-- Arquivo: 03_consultas.sql  -- Consultas de verificacao (A8)
--
-- 15 consultas: 5 basicas, 5 de juncao/agregacao e 5 avancadas.
-- Cada consulta e' precedida da pergunta de negocio que responde.
-- =============================================================================

USE hotel_brmw;

-- #############################################################################
-- BASICAS
-- #############################################################################

-- -----------------------------------------------------------------------------
-- C01. Quais quartos o hotel oferece e por qual diaria, do mais caro ao mais
--      barato? (projecao + ordenacao)
-- -----------------------------------------------------------------------------
SELECT numero, tipo, preco_diaria, situacao_atual
FROM quarto
ORDER BY preco_diaria DESC, numero ASC;

-- -----------------------------------------------------------------------------
-- C02. Quais clientes sao contas corporativas, identificadas pelo prefixo
--      "Comercial" na razao social? (LIKE)
-- -----------------------------------------------------------------------------
SELECT id_cliente, nome, email, tipo_cliente
FROM cliente
WHERE nome LIKE 'Comercial%'
ORDER BY nome;

-- -----------------------------------------------------------------------------
-- C03. Quais reservas tem check-in previsto para o primeiro trimestre de 2026?
--      (BETWEEN)
-- -----------------------------------------------------------------------------
SELECT id_reserva, id_cliente, data_checkin, data_checkout, status, valor_total
FROM reserva
WHERE data_checkin BETWEEN '2026-01-01' AND '2026-03-31'
ORDER BY data_checkin;

-- -----------------------------------------------------------------------------
-- C04. Quais quartos pertencem as categorias superiores do hotel? (IN)
-- -----------------------------------------------------------------------------
SELECT numero, tipo, preco_diaria
FROM quarto
WHERE tipo IN ('SUITE', 'LUXO')
ORDER BY tipo, numero;

-- -----------------------------------------------------------------------------
-- C05. Quais clientes estao sem telefone ou sem e-mail cadastrado e precisam
--      de atualizacao cadastral? (tratamento de NULL)
-- -----------------------------------------------------------------------------
SELECT id_cliente,
       nome,
       COALESCE(telefone, 'SEM TELEFONE') AS telefone,
       COALESCE(email,    'SEM E-MAIL')   AS email
FROM cliente
WHERE telefone IS NULL OR email IS NULL
ORDER BY id_cliente;

-- #############################################################################
-- JUNCOES E AGREGACAO
-- #############################################################################

-- -----------------------------------------------------------------------------
-- C06. Qual a agenda de hospedagem em andamento: quem esta hospedado, em qual
--      quarto e por quanto? (juncao de tres tabelas)
-- -----------------------------------------------------------------------------
SELECT r.id_reserva,
       c.nome            AS cliente,
       q.numero          AS quarto,
       q.tipo,
       r.data_checkin,
       r.data_checkout,
       r.valor_total
FROM reserva r
INNER JOIN cliente c ON c.id_cliente = r.id_cliente
INNER JOIN quarto  q ON q.id_quarto  = r.id_quarto
WHERE r.status = 'EM_ANDAMENTO'
ORDER BY r.data_checkin, q.numero;

-- -----------------------------------------------------------------------------
-- C07. Quais clientes estao cadastrados mas nunca fizeram reserva? (LEFT JOIN)
-- -----------------------------------------------------------------------------
SELECT c.id_cliente,
       c.nome,
       c.data_cadastro,
       COUNT(r.id_reserva) AS total_reservas
FROM cliente c
LEFT JOIN reserva r ON r.id_cliente = c.id_cliente
GROUP BY c.id_cliente, c.nome, c.data_cadastro
HAVING COUNT(r.id_reserva) = 0
ORDER BY c.data_cadastro;

-- -----------------------------------------------------------------------------
-- C08. Quais categorias de quarto ja geraram mais de R$ 20.000 em reservas
--      efetivadas? (GROUP BY + HAVING)
-- -----------------------------------------------------------------------------
SELECT q.tipo,
       COUNT(r.id_reserva)      AS qtd_reservas,
       SUM(r.valor_total)       AS receita_total,
       ROUND(AVG(r.valor_total), 2) AS ticket_medio
FROM quarto q
INNER JOIN reserva r ON r.id_quarto = q.id_quarto
WHERE r.status <> 'CANCELADA'
GROUP BY q.tipo
HAVING SUM(r.valor_total) > 20000
ORDER BY receita_total DESC;

-- -----------------------------------------------------------------------------
-- C09. Quais servicos mais faturam e quantas reservas os consumiram?
--      (juncao + agregacao sobre a associativa)
-- -----------------------------------------------------------------------------
SELECT s.id_servico,
       s.nome_servico,
       COUNT(rs.id_reserva)                  AS reservas_que_consumiram,
       SUM(rs.quantidade)                    AS unidades_vendidas,
       SUM(rs.quantidade * rs.preco)         AS faturamento
FROM servico s
INNER JOIN reserva_servico rs ON rs.id_servico = s.id_servico
GROUP BY s.id_servico, s.nome_servico
ORDER BY faturamento DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- C10. Qual a carga de manutencao por funcionario, incluindo os que nunca
--      executaram nenhuma ordem? (LEFT JOIN + agregacao)
-- -----------------------------------------------------------------------------
SELECT f.id_funcionario,
       f.nome,
       f.cargo,
       COUNT(m.id_manutencao) AS manutencoes_executadas,
       MAX(m.data_manutencao) AS ultima_manutencao
FROM funcionario f
LEFT JOIN manutencao m ON m.id_funcionario = f.id_funcionario
GROUP BY f.id_funcionario, f.nome, f.cargo
ORDER BY manutencoes_executadas DESC, f.nome;

-- #############################################################################
-- AVANCADAS
-- #############################################################################

-- -----------------------------------------------------------------------------
-- C11. Quais reservas ficaram acima da media de valor do proprio tipo de
--      quarto? (subconsulta correlacionada)
-- -----------------------------------------------------------------------------
SELECT r.id_reserva,
       q.numero AS quarto,
       q.tipo,
       r.valor_total,
       (SELECT ROUND(AVG(r2.valor_total), 2)
          FROM reserva r2
          INNER JOIN quarto q2 ON q2.id_quarto = r2.id_quarto
         WHERE q2.tipo = q.tipo
           AND r2.status <> 'CANCELADA') AS media_do_tipo
FROM reserva r
INNER JOIN quarto q ON q.id_quarto = r.id_quarto
WHERE r.status <> 'CANCELADA'
  AND r.valor_total > (SELECT AVG(r3.valor_total)
                         FROM reserva r3
                         INNER JOIN quarto q3 ON q3.id_quarto = r3.id_quarto
                        WHERE q3.tipo = q.tipo
                          AND r3.status <> 'CANCELADA')
ORDER BY q.tipo, r.valor_total DESC;

-- -----------------------------------------------------------------------------
-- C12. Quais quartos nunca passaram por manutencao e por isso devem entrar na
--      proxima vistoria preventiva? (EXISTS / NOT EXISTS)
-- -----------------------------------------------------------------------------
SELECT q.id_quarto, q.numero, q.tipo, q.situacao_atual
FROM quarto q
WHERE NOT EXISTS (SELECT 1
                    FROM manutencao m
                   WHERE m.id_quarto = q.id_quarto)
ORDER BY q.numero;

-- -----------------------------------------------------------------------------
-- C13. Quem sao os dez clientes que mais gastaram no hotel, somando diarias e
--      servicos consumidos? (subconsultas agregadas + ranking)
-- -----------------------------------------------------------------------------
SELECT c.id_cliente,
       c.nome,
       c.tipo_cliente,
       SUM(r.valor_total) AS gasto_hospedagem,
       COALESCE(SUM(cons.valor_servicos), 0) AS gasto_servicos,
       SUM(r.valor_total) + COALESCE(SUM(cons.valor_servicos), 0) AS gasto_total
FROM cliente c
INNER JOIN reserva r ON r.id_cliente = c.id_cliente AND r.status <> 'CANCELADA'
LEFT JOIN (SELECT rs.id_reserva,
                  SUM(rs.quantidade * rs.preco) AS valor_servicos
             FROM reserva_servico rs
            GROUP BY rs.id_reserva) cons ON cons.id_reserva = r.id_reserva
GROUP BY c.id_cliente, c.nome, c.tipo_cliente
ORDER BY gasto_total DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- C14. Em 15/07/2026, quais quartos estao comprometidos por reserva ativa e
--      quais estao livres para venda? (sobreposicao de periodos)
-- -----------------------------------------------------------------------------
SELECT q.numero,
       q.tipo,
       q.preco_diaria,
       CASE WHEN EXISTS (SELECT 1
                           FROM reserva r
                          WHERE r.id_quarto = q.id_quarto
                            AND r.status IN ('CONFIRMADA','EM_ANDAMENTO','PENDENTE')
                            AND '2026-07-15' >= r.data_checkin
                            AND '2026-07-15' <  r.data_checkout)
            THEN 'COMPROMETIDO' ELSE 'LIVRE' END AS situacao_na_data
FROM quarto q
ORDER BY situacao_na_data, q.numero;

-- -----------------------------------------------------------------------------
-- C15. Pergunta nao trivial do dominio: quais produtos tem estoque insuficiente
--      diante do proprio consumo medio mensal em manutencoes? Serve de base
--      para a reposicao junto ao fornecedor.
-- -----------------------------------------------------------------------------
SELECT p.id_produto,
       p.nome_produto,
       f.razao_social                                   AS fornecedor,
       p.qtd_estoque,
       SUM(im.quantidade)                               AS consumo_total,
       ROUND(SUM(im.quantidade) /
             GREATEST(COUNT(DISTINCT DATE_FORMAT(m.data_manutencao, '%Y-%m')), 1), 2)
                                                        AS consumo_medio_mensal,
       ROUND(p.qtd_estoque /
             NULLIF(SUM(im.quantidade) /
                    GREATEST(COUNT(DISTINCT DATE_FORMAT(m.data_manutencao, '%Y-%m')), 1), 0), 1)
                                                        AS meses_de_cobertura
FROM produto p
INNER JOIN fornecedor      f  ON f.id_fornecedor = p.id_fornecedor
INNER JOIN item_manutencao im ON im.id_produto   = p.id_produto
INNER JOIN manutencao      m  ON m.id_manutencao = im.id_manutencao
GROUP BY p.id_produto, p.nome_produto, f.razao_social, p.qtd_estoque
HAVING p.qtd_estoque < SUM(im.quantidade)
ORDER BY meses_de_cobertura ASC, p.nome_produto;
