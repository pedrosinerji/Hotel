# Análise de normalização — modelo relacional do Hotel BRMW

Esta análise deve ser conferida contra a versão final do modelo lógico. As dependências abaixo descrevem as dependências funcionais esperadas com base nas chaves e atributos dos scripts SQL.

## Critério utilizado

Uma relação está na 1FN quando cada atributo contém um valor atômico. Está na 2FN quando está na 1FN e nenhum atributo não-chave depende apenas de parte de uma chave candidata composta. Está na 3FN quando está na 2FN e não há dependência transitiva de atributo não-chave em relação a uma chave candidata. As chaves primárias e restrições `UNIQUE` identificam as dependências principais listadas abaixo.

## Dependências funcionais principais

| Relação | Dependência funcional principal | Análise resumida |
|---|---|---|
| `cliente` | `id_cliente → nome, email, telefone, tipo_cliente, data_cadastro`; `email → id_cliente` quando não nulo | Atributos cadastrais dependem da PK. E-mail é único quando informado. |
| `pessoa_fisica` | `id_cliente → cpf, rg`; `cpf → id_cliente` | Dados específicos de pessoa física separados da superclasse. |
| `pessoa_juridica` | `id_cliente → cnpj, razao_social`; `cnpj → id_cliente` | Dados específicos de pessoa jurídica separados da superclasse. |
| `dependente` | `(id_cliente, num_sequencial) → nome, data_nascimento` | A chave é composta; os atributos dependem da chave completa. |
| `funcionario` | `id_funcionario → id_supervisor, nome, cargo, salario, data_admissao` | Dados do funcionário dependem da PK; supervisor é uma referência à própria relação. |
| `quarto` | `id_quarto → numero, tipo, preco_diaria, situacao_atual`; `numero → id_quarto` | A situação atual é mantida deliberadamente desnormalizada em relação ao histórico, para leitura rápida; deve ser sincronizada em toda alteração. |
| `historico_status_quarto` | `id_historico → id_quarto, status_anterior, novo_status, data_hora_inicio, data_hora_fim, motivo_alteracao` | Cada evento temporal possui identidade própria. `uq_historico_quarto_inicio` evita duplicação do instante de início para o mesmo quarto. |
| `reserva` | `id_reserva → id_cliente, id_quarto, data_checkin, data_checkout, status, valor_total` | Os dados da reserva dependem da PK. Cliente e quarto são referências por FK. |
| `servico` | `id_servico → nome_servico, preco_base`; `nome_servico → id_servico` | Catálogo independente do consumo feito em cada reserva. |
| `reserva_servico` | `(id_reserva, id_servico) → data_hora_solicitacao, quantidade, preco` | Tabela associativa N:N. Os atributos dependem da chave composta completa; `preco` registra o preço histórico praticado. |
| `fornecedor` | `id_fornecedor → razao_social, cnpj, telefone`; `cnpj → id_fornecedor` | Dados do fornecedor ficam em uma relação própria. |
| `produto` | `id_produto → id_fornecedor, nome_produto, qtd_estoque, preco_custo` | Cada produto referencia um fornecedor; dados do fornecedor não são repetidos na tabela produto. |
| `manutencao` | `id_manutencao → id_quarto, id_funcionario, data_manutencao, descricao` | Cada manutenção referencia um quarto e um funcionário. |
| `item_manutencao` | `(id_manutencao, id_produto) → quantidade, custo` | Tabela associativa N:N; custo registra o valor unitário usado naquela manutenção. |
| `auditoria` | `id_auditoria → data_hora, usuario, papel, acao, tabela, registro, detalhe` | Cada evento de auditoria tem chave própria. |

## Conclusão por forma normal

- **1FN:** as colunas são atômicas; listas de serviços e produtos não são armazenadas como campos repetidos, mas nas tabelas associativas.
- **2FN:** nas tabelas com chave simples, a 2FN é satisfeita diretamente. Nas tabelas `dependente`, `reserva_servico` e `item_manutencao`, os atributos não-chave dependem da chave composta completa.
- **3FN:** dados de cliente, pessoa física, pessoa jurídica, funcionário, quarto, reserva, serviço, fornecedor, produto e manutenção são separados em relações próprias para evitar dependências transitivas típicas (por exemplo, a razão social do fornecedor não é repetida em `produto`). A equipe deve verificar a ausência de outras dependências no domínio final.
- **Desnormalização deliberada:** `quarto.situacao_atual` duplica informação que pode ser derivada do último registro em `historico_status_quarto`. A justificativa é simplificar listagens operacionais; a aplicação atualiza a situação e o histórico na mesma transação. O risco é divergência se alguém alterar diretamente o banco fora do fluxo da aplicação, portanto o relatório deve registrar essa limitação e os controles adotados.
- **BCNF:** as relações com as dependências funcionais listadas parecem atingir BCNF quando todos os determinantes candidatos estão cobertos pelas PKs/UNIQUE. A conclusão deve ser revisada se novas regras de unicidade forem adicionadas.

## Limitações que precisam ser explicitadas

1. A especialização total e disjunta de `cliente` não é garantida integralmente apenas por `CHECK` entre tabelas diferentes. A consulta da matriz de rastreabilidade deve retornar zero inconsistências; se o professor exigir garantia estrutural absoluta, implementar estratégia adicional de trigger/controle transacional.
2. A regra de funcionário não supervisionar a si mesmo depende de validação adicional, pois uma FK simples não impede `id_supervisor = id_funcionario`.
3. A situação atual do quarto deve sempre ser alterada junto ao histórico. O CRUD administrativo incluído foi preparado para registrar esse histórico; outras ferramentas de administração direta também precisam respeitar a regra.
