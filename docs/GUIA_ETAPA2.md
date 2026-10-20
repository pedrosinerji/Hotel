# Guia de implementação e validação — Etapa 2

Este guia acompanha os novos arquivos `sql/05_etapa2.sql`, `sql/06_testes_etapa2.sql` e a tela administrativa. Ele não substitui evidências reais dos testes.

## Instalação do banco
1. Em uma base de testes, execute `sql/01_ddl.sql`.
2. Execute `sql/02_carga.sql`.
3. Execute `sql/03_consultas.sql` e confira os 15 resultados.
4. Execute `sql/04_api.sql` como usuário administrador.
5. Execute `sql/05_etapa2.sql` como administrador. Ele cria a VIEW, dois gatilhos, roles e índices.
6. Para recriar a base do zero, o DDL original apaga `hotel_brmw`; depois disso todos os demais scripts devem ser executados novamente na ordem.

## Rodar aplicação
- `backend/.env.example` é um modelo; copie para `backend/.env` e preencha com credenciais locais. Nunca versione `.env`.
- Configure `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `DB_ADMIN_USER` e `DB_ADMIN_PASSWORD`. O usuário de conexão precisa das permissões necessárias para os endpoints; em ambiente de demonstração, use conta de aplicação com privilégio mínimo validado.
- No backend: `npm install` e `npm run dev`.
- No frontend: `npm install` e `npm run dev`.
- A interface administrativa aparece para usuário com papel GERENTE. Acesse Cadastros e relatórios.

## O que a aplicação acrescenta
- CRUD de quartos, serviços, produtos e fornecedores (criar, listar, editar, excluir).
- Consulta parametrizada de reservas por período, com junções e agregação.
- Consulta parametrizada de faturamento por tipo de quarto.
- Relatório consolidado alimentado pela `vw_relatorio_hotel`.
- Restrições e erros do banco são apresentados ao usuário em mensagens amigáveis.

## Evidências que a equipe ainda precisa gerar com execução real
1. Testar cada operação dos quatro CRUDs, incluindo tentativa de exclusão de registro referenciado.
2. Testar filtros das duas consultas e anexar capturas.
3. Demonstrar SQL injection como valor literal e anexar entrada e resposta observada.
4. Demonstrar transação concluída e transação revertida após falha.
5. Rodar experimento de concorrência com duas sessões, registrar o que realmente ocorreu e o nível de isolamento.
6. Executar os três `EXPLAIN` antes e depois dos índices; medir tempo e informar volume de dados real. Não inventar tempos ou ganhos.
7. Criar três contas reais associadas às roles `hotel_leitura`, `hotel_recepcao` e `hotel_gerencia`, testar os privilégios e documentar resultados.
8. Confirmar os dois triggers em ação atualizando uma reserva e um quarto; conferir as linhas adicionadas em `auditoria`.
9. Documentar backup, retenção, restauração testada e estimativa de crescimento para dois anos.
10. Incluir a declaração de uso de IA no relatório, indicando que os resultados foram revisados e testados pela equipe.

## Sugestão de plano de backup (adaptar e testar)
- Fazer backup lógico diário (`mysqldump`) do banco e armazená-lo em local protegido; manter 7 backups diários e 4 semanais, conforme capacidade e política da equipe.
- Proteger os arquivos com permissões restritas e não armazenar senhas no repositório.
- Pelo menos uma vez antes da entrega, restaurar o dump em um banco separado e validar contagem de tabelas, registros e consultas principais.
- A estimativa de crescimento deve usar o volume atual medido e uma hipótese de crescimento explícita (ex.: crescimento mensal de reservas), não um número inventado.

## Aviso sobre os perfis
O arquivo SQL cria roles para MySQL 8.0+. O usuário de leitura recebe acesso à visão e quartos; recepção recebe permissões operacionais específicas; gerência recebe permissões administrativas. Revise os privilégios efetivos com `SHOW GRANTS` e teste com sessões reais.
