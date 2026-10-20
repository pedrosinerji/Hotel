# Relatório da Etapa 2 — modelo para completar com evidências

> Importante: substituam os campos entre colchetes por resultados observados pela equipe. Não apresentem medições hipotéticas como se fossem resultados reais.

## 1. Evolução desde a Etapa 1
- Modelo/banco: `hotel_brmw`, MySQL 8.0+.
- Mudanças aplicadas: view `vw_relatorio_hotel`, gatilhos `trg_aud_reserva_update` e `trg_aud_quarto_update`, índices de consulta e camada administrativa.
- Correções recebidas do professor e incorporadas: [listar correções e arquivos].

## 2. Interface e CRUDs (B1)
Documentar os testes de criar, consultar, editar e excluir para quarto, serviço, produto e fornecedor.
- Quarto: [resultado + captura]
- Serviço: [resultado + captura]
- Produto: [resultado + captura]
- Fornecedor: [resultado + captura]
- Erro de integridade tratado: [operação inválida, mensagem exibida]

## 3. Consultas parametrizadas e VIEW (B1/B2)
- Consulta 1 — reservas por período: filtros usados [ ], quantidade de linhas [ ], captura [ ].
- Consulta 2 — faturamento por tipo: filtros usados [ ], resultado observado [ ], captura [ ].
- Relatório `vw_relatorio_hotel`: [captura e validação contra consulta manual].
- SQL injection: entrada literal testada [ ]; resposta obtida [ ]; evidência [ ].

## 4. Transações e concorrência (B3)
- Transação com sucesso: comandos executados [ ]; estado final [ ].
- Falha provocada: comando que falhou [ ]; rollback observado [ ]; prova de integridade [ ].
- Sessões A e B: sequência [ ]; bloqueio/espera/deadlock realmente observado [ ]; duração observada [ ].
- Nível de isolamento consultado: [ ]; justificativa [ ].

## 5. Otimização (B4)
Preencher a tabela com dados medidos, para cada uma das três consultas.

| Consulta | Volume de dados | Plano antes | Índice/justificativa | Plano depois | Tempo antes/depois | Conclusão |
|---|---:|---|---|---|---|---|
| Disponibilidade por quarto/período | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Reservas por status e período | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Serviços por reserva | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## 6. Segurança e auditoria (B5/B6)
- Perfis e permissões efetivas (`SHOW GRANTS`): [anexar resultados].
- Visão restrita por perfil: [teste].
- Hash e sal de senhas: [descrever biblioteca e verificação; nunca inserir senhas em texto claro].
- Trigger de reserva: [linha gerada na auditoria].
- Trigger de quarto: [linha gerada na auditoria].
- Dados pessoais tratados e medidas de proteção: [listar].

## 7. Projeto físico, backup e crescimento (B7)
- Revisão de tipos de dados: [decisões].
- Crescimento estimado para dois anos, com hipótese explícita: [volume atual medido, taxa adotada e cálculo].
- Backup: [o que, frequência, retenção, local protegido].
- Restauração testada: [data, ambiente, validações e resultado].
- Particionamento/arquivamento: [proposta justificada ou razão para não aplicar].

## 8. Declaração de uso de IA
Foram utilizados assistentes de IA como apoio à revisão, documentação e implementação de partes do código. A equipe revisou as sugestões e deve registrar aqui quais arquivos/trechos foram assistidos, quais testes foram executados e quais ajustes foram feitos após a validação: [detalhar de acordo com o uso real].

## 9. Conclusão
[Resumo baseado nos testes efetivamente realizados, incluindo limitações encontradas.]
