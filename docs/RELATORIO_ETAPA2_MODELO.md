# Relatório da Etapa 2 — Pibbles Hotel

## 1. Evolução desde a Etapa 1

O projeto Pibbles Hotel consiste em um sistema de gerenciamento hoteleiro desenvolvido com frontend web, backend em Node.js e banco de dados relacional MySQL. O objetivo é centralizar o gerenciamento de quartos, serviços, produtos, fornecedores, funcionários, clientes e reservas.

O banco utilizado é o `hotel_brmw`, executado em MySQL 8.0 ou superior.

### Mudanças implementadas

Durante a evolução do projeto, foram desenvolvidos e integrados os seguintes recursos:

- Camada administrativa e API para comunicação entre frontend e banco de dados.
- Operações CRUD para quartos, serviços, produtos e fornecedores.
- Consultas SQL para obtenção de informações sobre reservas e faturamento.
- View `vw_relatorio_hotel` para consolidação de informações do sistema.
- Gatilhos de auditoria `trg_aud_reserva_update` e `trg_aud_quarto_update`.
- Índices destinados a melhorar o desempenho das consultas.
- Mecanismo de autenticação de funcionários com verificação de senhas por bcrypt.
- Controle de acesso por perfil, incluindo `GERENTE` e `RECEPCAO`.
- Uso de transações para operações relacionadas ao processo de reservas.

Os scripts SQL do projeto foram executados no ambiente de desenvolvimento. Entretanto, a existência de cada objeto e o funcionamento de todos os recursos devem ser confirmados por meio das verificações e evidências descritas neste relatório.

### Correções recebidas do professor

As correções específicas recebidas do professor e os arquivos modificados deverão ser relacionados conforme o feedback original.

**Correções incorporadas:** [completar com as observações efetivamente recebidas do professor e os respectivos arquivos].

## 2. Interface e CRUDs (B1)

O sistema possui uma camada de API destinada ao gerenciamento de registros de diferentes entidades. As operações de criação, consulta, edição e exclusão devem ser verificadas individualmente para confirmar a integração entre frontend, backend e banco de dados.

### Quarto

O módulo de quartos permite gerenciar os registros utilizados pelo sistema de reservas.

- Criar: [informar o resultado do teste].
- Consultar: [informar se o registro foi exibido corretamente].
- Editar: [informar se a alteração foi persistida no banco].
- Excluir: [informar o resultado e eventuais restrições de integridade].
- Evidência: [inserir captura da interface e/ou consulta SQL].

### Serviço

O módulo de serviços permite administrar os serviços oferecidos pelo hotel.

- Criar: [resultado].
- Consultar: [resultado].
- Editar: [resultado].
- Excluir: [resultado].
- Evidência: [inserir captura].

### Produto

O módulo de produtos permite manter os registros de produtos utilizados na operação do hotel.

- Criar: [resultado].
- Consultar: [resultado].
- Editar: [resultado].
- Excluir: [resultado].
- Evidência: [inserir captura].

### Fornecedor

O módulo de fornecedores permite administrar os dados dos fornecedores cadastrados.

- Criar: [resultado].
- Consultar: [resultado].
- Editar: [resultado].
- Excluir: [resultado].
- Evidência: [inserir captura].

### Tratamento de erros de integridade

O sistema utiliza restrições relacionais para proteger a consistência dos dados. Operações que violem chaves estrangeiras, campos obrigatórios ou outras restrições devem ser rejeitadas ou tratadas pela aplicação.

- Operação inválida testada: [descrever].
- Resultado observado no banco: [descrever].
- Mensagem apresentada ao usuário: [registrar a mensagem real].
- Evidência: [inserir captura da mensagem e do estado do banco].

## 3. Consultas parametrizadas e VIEW (B1/B2)

A camada de backend inclui consultas destinadas à recuperação de informações de reservas e à consolidação de dados financeiros. A parametrização deve ser utilizada para separar os valores fornecidos pelo usuário do texto da instrução SQL.

### Consulta 1 — Reservas por período

A consulta tem como objetivo recuperar reservas dentro de um intervalo de datas, utilizando os filtros recebidos pela API.

- Data inicial utilizada: [informar].
- Data final utilizada: [informar].
- Quantidade de linhas retornadas: [medir].
- Validação dos dados: [comparar com os registros correspondentes no banco].
- Evidência: [inserir captura do resultado].

### Consulta 2 — Faturamento por tipo

A consulta utiliza operações de agregação e relacionamentos entre tabelas para consolidar informações financeiras por categoria ou tipo.

- Filtros utilizados: [informar].
- Valores retornados: [registrar os valores observados].
- Validação: [comparar com uma consulta manual independente].
- Evidência: [inserir captura].

### View `vw_relatorio_hotel`

A view foi prevista no projeto para consolidar informações relevantes em uma estrutura consultável, reduzindo a necessidade de repetir a mesma composição de consultas em diferentes relatórios.

A validação deve incluir a existência da view no banco, a execução de uma consulta sobre ela e a comparação dos resultados com uma consulta SQL independente sobre as tabelas de origem.

- Existência da view: [confirmar].
- Resultado da consulta: [registrar].
- Comparação com a consulta manual: [registrar as diferenças ou confirmar a equivalência observada].
- Evidência: [inserir captura].

### Teste de SQL injection

O teste deve verificar se entradas contendo caracteres ou expressões SQL são tratadas como valores literais, sem alterar a estrutura da consulta.

- Entrada testada: [registrar a entrada efetivamente utilizada].
- Resultado obtido: [registrar a resposta real da API].
- Alteração indevida de dados: [confirmar por consulta antes/depois].
- Evidência: [inserir captura do teste].

O uso de consultas parametrizadas é uma medida importante de proteção contra SQL injection, mas a eficácia deve ser confirmada no código das rotas e nos testes realizados.

## 4. Transações e concorrência (B3)

As transações são importantes para preservar a consistência de operações que envolvem múltiplas tabelas. No processo de reservas, por exemplo, diferentes registros relacionados precisam permanecer consistentes caso alguma etapa falhe.

### Transação concluída com sucesso

O projeto prevê uma operação transacional relacionada à criação de reservas e ao registro dos dados associados.

- Comandos executados: [listar as operações realmente executadas].
- Registros envolvidos: [identificar as tabelas afetadas].
- Estado final: [descrever o que foi confirmado no banco].
- Evidência: [inserir capturas do antes e depois].

### Falha provocada e rollback

O teste deve provocar uma falha controlada durante uma transação e verificar se as alterações anteriores são revertidas.

- Comando ou etapa que provocou a falha: [informar].
- Erro observado: [registrar a mensagem real].
- Rollback: [confirmar se foi executado].
- Estado das tabelas após a falha: [consultar e registrar].
- Evidência de integridade: [inserir capturas].

Não se deve considerar o rollback validado apenas porque uma mensagem de erro foi exibida. É necessário conferir se os dados foram realmente revertidos.

### Concorrência entre sessões A e B

O teste de concorrência deve utilizar duas sessões independentes do banco para observar o comportamento de transações simultâneas.

- Sequência executada na sessão A: [descrever].
- Sequência executada na sessão B: [descrever].
- Bloqueio, espera ou deadlock: [registrar somente se observado].
- Duração da espera: [medir, caso tenha ocorrido].
- Resultado final: [descrever].
- Evidência: [inserir capturas das duas sessões].

### Nível de isolamento

O nível de isolamento deve ser consultado no ambiente utilizado para os testes.

- Nível observado: [registrar o resultado da consulta ao MySQL].
- Justificativa: [explicar como o nível observado contribui para a consistência e o controle de leituras concorrentes].

## 5. Otimização (B4)

A otimização deve ser avaliada por meio de planos de execução e medições realizadas sobre consultas representativas. Os índices precisam ser justificados pelas colunas utilizadas em filtros, relacionamentos e ordenações.

| Consulta | Volume de dados | Plano antes | Índice e justificativa | Plano depois | Tempo antes/depois | Conclusão |
|---|---|---|---|---|---|---|
| Disponibilidade por quarto/período | [medir] | [EXPLAIN] | [registrar índice avaliado] | [EXPLAIN] | [medir] | [concluir com base nos resultados] |
| Reservas por status e período | [medir] | [EXPLAIN] | [registrar índice avaliado] | [EXPLAIN] | [medir] | [concluir com base nos resultados] |
| Serviços por reserva | [medir] | [EXPLAIN] | [registrar índice avaliado] | [EXPLAIN] | [medir] | [concluir com base nos resultados] |

### Metodologia de avaliação

Para cada consulta, deve-se registrar o volume de dados disponível e executar `EXPLAIN` antes e depois da alteração avaliada. Os tempos devem ser medidos em condições comparáveis.

A análise deve considerar o tipo de acesso, os índices escolhidos pelo otimizador, a estimativa de linhas examinadas e o tempo observado. A criação de um índice não garante, por si só, melhoria de desempenho; a conclusão deve refletir os resultados reais.

## 6. Segurança e auditoria (B5/B6)

O projeto utiliza autenticação de funcionários e diferenciação de perfis. O backend utiliza a biblioteca `bcryptjs` para comparar senhas com hashes armazenados no banco de dados.

### Perfis e permissões

Os perfis previstos incluem `GERENTE` e `RECEPCAO`. A aplicação também possui uma conta de banco de dados denominada `hotel_app`, utilizada pela API.

Durante a verificação do ambiente, foi observado que essa conta possui permissões de leitura, inserção, atualização e exclusão em partes do banco, enquanto a tabela `funcionario` inicialmente permitia somente leitura. Foi concedida posteriormente a permissão de atualização necessária para o procedimento de configuração do usuário.

- Resultado de `SHOW GRANTS`: [anexar os resultados atuais].
- Teste de acesso do perfil GERENTE: [registrar].
- Teste de acesso do perfil RECEPCAO: [registrar].
- Tentativa de acesso a uma funcionalidade não autorizada: [registrar].
- Evidência: [inserir capturas].

### Hash e sal de senhas

O projeto utiliza `bcryptjs` para gerar hashes de senha com fator de custo 10 no script de configuração de funcionários. O sal é incorporado ao hash gerado pela biblioteca.

Durante a autenticação, a aplicação utiliza `bcrypt.compare()` para comparar a senha informada com o hash armazenado. Dessa forma, não é necessário armazenar a senha original em texto claro.

A validação deve confirmar que a senha correta é aceita e que uma senha incorreta é rejeitada. Senhas reais não devem ser incluídas no relatório nem nas capturas de tela.

### Auditoria de reservas

O projeto prevê o gatilho `trg_aud_reserva_update` para registrar alterações em reservas.

- Gatilho presente: [confirmar por consulta ao MySQL].
- Operação testada: [descrever a atualização realizada].
- Registro gerado na auditoria: [informar os valores observados].
- Evidência: [inserir captura].

### Auditoria de quartos

O projeto prevê o gatilho `trg_aud_quarto_update` para registrar alterações em quartos.

- Gatilho presente: [confirmar].
- Operação testada: [descrever].
- Registro gerado na auditoria: [informar].
- Evidência: [inserir captura].

### Proteção de dados pessoais

O sistema trata dados cadastrais de clientes e funcionários, além de informações relacionadas às reservas. As medidas de proteção a documentar incluem controle de acesso, armazenamento de hashes de senha, uso de consultas parametrizadas e limitação de permissões da conta utilizada pela aplicação.

Medidas adicionais, como política de retenção, proteção de backups e restrição de acesso aos registros de auditoria, devem ser descritas conforme estiverem efetivamente configuradas.

## 7. Projeto físico, backup e crescimento (B7)

### Revisão dos tipos de dados

O esquema utiliza tipos relacionais apropriados para diferentes categorias de informação, incluindo identificadores inteiros, textos, datas e valores monetários decimais.

A revisão física deve verificar a adequação dos tipos e das restrições das tabelas, com atenção especial a:

- Chaves primárias e estrangeiras.
- Campos obrigatórios e valores nulos.
- Tipos `DECIMAL` para valores financeiros.
- Tipos de data para reservas, admissões e outros eventos.
- Índices para consultas frequentes.
- Restrições de integridade e valores permitidos.

Decisões específicas de alteração de tipos devem ser documentadas somente após a inspeção do esquema atual.

### Estimativa de crescimento para dois anos

A estimativa deve partir do volume de dados efetivamente medido no banco.

- Volume atual: [medir o número de registros e/ou o tamanho das tabelas].
- Taxa de crescimento adotada: [informar a hipótese].
- Período: 24 meses.

Se for adotada uma taxa mensal constante \(r\), a estimativa de crescimento poderá ser calculada por:

\[
V_{24}=V_0(1+r)^{24}
\]

Em que \(V_0\) representa o volume atual e \(V_{24}\) o volume estimado após 24 meses.

A hipótese e a unidade utilizada devem ser explicitadas, evitando apresentar uma projeção sem dados de referência.

### Backup e restauração

- Conteúdo incluído no backup: [informar].
- Frequência: [informar].
- Retenção: [informar].
- Local de armazenamento protegido: [informar].
- Data do teste de restauração: [informar].
- Ambiente de restauração: [informar].
- Validações realizadas: [descrever].
- Resultado observado: [registrar].

A existência de um arquivo de backup não comprova que a restauração funciona. É necessário realizar uma restauração de teste e verificar a consistência dos dados recuperados.

### Particionamento e arquivamento

A necessidade de particionamento ou arquivamento deve ser avaliada de acordo com o volume atual, a taxa de crescimento e os padrões de consulta.

Caso o volume seja compatível com a estrutura atual, pode-se justificar a manutenção do modelo sem particionamento neste momento, desde que a decisão seja fundamentada em medições. Caso contrário, deve-se apresentar uma proposta baseada nas tabelas com maior crescimento e nos critérios de consulta e retenção.

**Decisão adotada:** [registrar a decisão efetiva e sua justificativa].

## 8. Declaração de uso de IA

Foram utilizados assistentes de inteligência artificial como apoio à análise, à revisão, à documentação e à implementação de partes do projeto.

O uso incluiu apoio na análise de problemas de conexão com o MySQL, na configuração da autenticação de funcionários e na orientação sobre a integração do projeto com o repositório GitHub.

As sugestões relacionadas ao banco de dados, ao backend e ao frontend devem ser verificadas pela equipe antes da entrega. A equipe deve identificar os arquivos e trechos efetivamente assistidos, registrar as alterações incorporadas e apresentar os testes realizados para validar o comportamento do sistema.

- Arquivos assistidos por IA: [listar os arquivos efetivamente modificados com esse apoio].
- Sugestões incorporadas: [descrever].
- Testes executados: [listar os testes reais].
- Ajustes realizados após a validação: [descrever].
- Limitações identificadas: [registrar].

A responsabilidade pela revisão, pela validação e pela entrega final permanece com a equipe do projeto.

## 9. Conclusão

A Etapa 2 do Pibbles Hotel contempla a evolução da aplicação web e da camada de persistência, com recursos de gerenciamento de entidades, consultas SQL, integração com o banco relacional, autenticação de funcionários e mecanismos previstos de auditoria.

A estrutura desenvolvida busca melhorar a organização dos dados, a integridade das operações e a segurança do acesso ao sistema. A utilização de consultas parametrizadas, hashes de senha e permissões específicas são aspectos importantes da implementação.

Entretanto, a conclusão definitiva sobre a qualidade e o desempenho do sistema depende da apresentação das evidências de execução dos CRUDs, da validação da view, dos testes de rollback e concorrência, da confirmação dos gatilhos e das permissões, das medições de desempenho e dos testes de backup e restauração.

Após a conclusão desses testes, os resultados observados deverão ser incorporados ao relatório, permitindo avaliar objetivamente os requisitos atendidos, as limitações encontradas e as melhorias futuras do projeto.
