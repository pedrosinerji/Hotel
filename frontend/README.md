# Sistema de Gestão de Hotel
 
Modelo lógico de banco de dados para a **gestão de um hotel**, desenvolvido no BRModelo Web. Cobre a operação: cadastro de clientes, reservas de quartos, serviços extras, manutenção dos quartos e controle de estoque e fornecedores.
 
## Integrantes
 
- Samuel Ribeiro Braga
- Pedro Fernandes Benvindo
- Kauã Eyke
- Murilo Tales
- Yan Gabriel
## Visão geral
 
O modelo é composto por **12 tabelas**, organizadas em quatro blocos.
 
### 1. Clientes
 
| Tabela | Descrição |
|---|---|
| `CLIENTE` | Dados comuns a todos os clientes (telefone, nome, e-mail). |
| `PESSOA_FISICA` | Especialização de cliente com CPF e RG. Usa `id_cliente` como PK e FK. |
| `PESSOA_JURIDICA` | Especialização de cliente com CNPJ e razão social. Usa `id_cliente` como PK e FK. |
| `DEPENDENTE` | Acompanhantes ligados a um cliente. Entidade fraca, com PK `num_sequencial`. |
 
### 2. Reservas e serviços
 
| Tabela | Descrição |
|---|---|
| `RESERVA` | Liga um cliente a um quarto. Guarda check-in, check-out, status e valor total. |
| `QUARTO` | Número, tipo e preço da diária. |
| `SERVICO` | Catálogo de serviços extras, com nome e preço base. |
| `reserva_servico` | Tabela associativa (N:N) entre reserva e serviço. Guarda data/hora da solicitação e quantidade. |
| `HISTORICO_STATUS_QUARTO` | Registra as mudanças de status de cada quarto: status anterior, novo status, período e motivo. |
 
### 3. Manutenção
 
| Tabela | Descrição |
|---|---|
| `MANUTENCAO` | Manutenção de um quarto, feita por um funcionário, com data e descrição. |
| `item_manutencao` | Tabela associativa entre manutenção e produto. Guarda quantidade e custo dos materiais usados. |
 
### 4. Estoque e equipe
 
| Tabela | Descrição |
|---|---|
| `PRODUTO` | Nome, quantidade em estoque e preço de custo. |
| `FORNECEDOR` | Razão social, CNPJ e telefone. Fornece os produtos. |
| `FUNCIONARIO` | Nome, cargo e salário. Possui autorrelacionamento (FK para si mesmo), sugerindo hierarquia ou supervisão. |
 
