# Hotel BRMW — Sistema de gestão hoteleira

Projeto acadêmico de Laboratório de Banco de Dados (UCB, 2026/2). Inclui modelo relacional, scripts SQL, API Node/Express e interface React/Vite.

## Integrantes
- Samuel Ribeiro Braga
- Pedro Fernandes Benvindo
- Kauã Eyke
- Murilo Tales
- Yan Gabriel

## Estrutura
- `sql/01_ddl.sql`: cria banco e tabelas em base limpa.
- `sql/02_carga.sql`: carga fictícia de dados (inclui 130 reservas e casos de contorno).
- `sql/03_consultas.sql`: consultas de verificação da Etapa 1.
- `sql/04_api.sql`: prepara autenticação, auditoria e permissões para a API.
- `sql/05_etapa2.sql`: VIEW, dois triggers de auditoria, roles e índices adicionais.
- `sql/06_testes_etapa2.sql`: roteiro de teste de injeção, transações, concorrência e EXPLAIN.
- `backend/`: API Node.js/Express com MySQL.
- `frontend/`: interface React/Vite; área administrativa disponível para o perfil GERENTE.
- `docs/`: diagramas e documentação, matriz de rastreabilidade, normalização e guias de testes.

## Preparar o banco (MySQL 8.0+)
Execute os scripts como administrador, nessa ordem:
1. `sql/01_ddl.sql`
2. `sql/02_carga.sql`
3. `sql/03_consultas.sql`
4. `sql/04_api.sql`
5. `sql/05_etapa2.sql`

`01_ddl.sql` apaga e recria o banco `hotel_brmw`. Não execute em banco com dados que deseja preservar. `04_api.sql` e `05_etapa2.sql` são scripts de instalação inicial e não foram feitos para rodar repetidamente sem limpar/recriar a base.

Antes de executar `04_api.sql`, troque o placeholder da senha de `hotel_app`; use a mesma senha em `backend/.env`. O script `05_etapa2.sql` cria roles do MySQL 8.0+. Crie contas de teste individuais associadas às roles e valide com `SHOW GRANTS`.

## Executar localmente
1. Copie `backend/.env.example` para `backend/.env` e configure os dados do MySQL e um `JWT_SECRET` longo e aleatório.
2. No terminal, entre em `backend`, rode `npm install` e depois `npm run dev`.
3. Em outro terminal, entre em `frontend`, rode `npm install` e depois `npm run dev`.
4. Abra o endereço que o Vite informar. A API responde em `http://localhost:3001/api/saude`.
5. Crie um usuário de aplicação a partir de funcionário existente usando as instruções de `backend/README.md` e `npm run criar-usuario`.

Não versione `.env`, credenciais ou `node_modules`. O ZIP de entrega não inclui `.git`, `node_modules` ou credenciais locais.

## Complementos implementados para a Etapa 2
- CRUD completo (criar, consultar, alterar e excluir) de quartos, serviços, produtos e fornecedores, protegido para GERENTE.
- Duas consultas parametrizadas com filtros de data: reservas por período e faturamento por tipo de quarto; ambas usam JOIN/agregação.
- Relatório consolidado alimentado por `vw_relatorio_hotel`.
- Atualização administrativa da situação de quarto com registro no histórico dentro de transação.
- Dois triggers para auditar atualizações de reservas e quartos.
- Roles `hotel_leitura`, `hotel_recepcao` e `hotel_gerencia` e índices candidatos a avaliação de desempenho.

## Atenção: evidências de execução ainda necessárias
O projeto inclui os scripts e roteiros para os experimentos pedidos, mas os resultados de `EXPLAIN`, tempos medidos, concorrência em duas sessões, tentativa de injeção, restauração de backup e teste efetivo das permissões devem ser executados pela equipe no próprio MySQL e documentados. Não invente esses resultados. Consulte `docs/GUIA_ETAPA2.md` e `docs/RELATORIO_ETAPA2_MODELO.md`.
