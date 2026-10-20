# Matriz de rastreabilidade — regras de negócio

A matriz abaixo resume o ponto principal de implementação para revisar em grupo. A equipe deve confirmar cada regra com teste real e preencher a coluna de evidência antes da entrega.

| Regra | Mecanismo principal | Evidência que precisa ser registrada |
|---|---|---|
| RN01 | `cliente.tipo_cliente`, tabelas `pessoa_fisica`/`pessoa_juridica`; validação complementar da especialização total | Consulta de inconsistências entre discriminador e subclasse |
| RN02 | `UNIQUE` em CPF/CNPJ e `CHECK` de formato | Tentativa de CPF/CNPJ duplicado e resultado |
| RN03 | `UNIQUE(cliente.email)`; múltiplos `NULL` são permitidos no MySQL | Inserção de e-mail repetido |
| RN04 | `cliente.telefone` aceita `NULL` | Inserção de cliente sem telefone |
| RN05 | PK composta e FK em `dependente` | Inserção e exclusão de dependente |
| RN06 | `UNIQUE(quarto.numero)` | Tentativa de número duplicado |
| RN07 | `CHECK(quarto.tipo)` | Tentativa de tipo inválido |
| RN08 | `CHECK(preco_diaria > 0)` | Tentativa de diária zero/negativa |
| RN09 | FKs de `reserva` para cliente e quarto | Tentativa de reserva com ID inexistente |
| RN10 | `CHECK(data_checkout > data_checkin)` | Tentativa de período invertido |
| RN11 | `CHECK(reserva.status)` e transições da API | Tentativa de status/transição inválida |
| RN12 | `CHECK(valor_total >= 0)` | Tentativa de total negativo |
| RN13 | `ON DELETE RESTRICT` da reserva para cliente | Tentativa de excluir cliente com reserva |
| RN14 | PK composta de `reserva_servico` | Inserção duplicada do mesmo serviço na reserva |
| RN15 | `CHECK(quantidade >= 1)` | Tentativa de quantidade zero |
| RN16 | Histórico criado pela aplicação e inicializado no CRUD; recomenda-se trigger adicional se todas as fontes de escrita precisarem ser cobertas | Alteração de situação e histórico aberto/encerrado |
| RN17 | `CHECK` de período no histórico | Tentativa de fim anterior ao início |
| RN18 | FKs de `manutencao` | Tentativa com quarto/funcionário inexistente |
| RN19 | FK de supervisor; auto-supervisão requer validação de aplicação/trigger | Tentativa de supervisor igual ao funcionário |
| RN20 | FK de fornecedor e `CHECK` em estoque/custo | Tentativa de produto sem fornecedor/estoque negativo |

## Consulta de inconsistências da especialização (RN01)

```sql
SELECT c.id_cliente, c.tipo_cliente,
       (pf.id_cliente IS NOT NULL) AS tem_pf,
       (pj.id_cliente IS NOT NULL) AS tem_pj
FROM cliente c
LEFT JOIN pessoa_fisica pf ON pf.id_cliente = c.id_cliente
LEFT JOIN pessoa_juridica pj ON pj.id_cliente = c.id_cliente
WHERE (c.tipo_cliente = 'PF' AND (pf.id_cliente IS NULL OR pj.id_cliente IS NOT NULL))
   OR (c.tipo_cliente = 'PJ' AND (pj.id_cliente IS NULL OR pf.id_cliente IS NOT NULL));
```

Resultado esperado após carga válida: zero linhas. Execute a consulta após qualquer mudança no cadastro.
