// Dados iniciais de demonstração (substituídos pelo MySQL via API na etapa de backend).

export const DEMO = [
  ['helena', 'Helena Prado', 'GERENTE', 'gerente123'],
  ['camila', 'Camila Souza', 'RECEPCAO', 'recepcao123'],
]

export const GUEST = { login: 'hospede', papel: 'PUBLICO' }

export const seed = {
  clientes: [
    {
      id: 1,
      nome: 'Marina Duarte',
      email: 'marina@email.com',
      telefone: '61999990001',
      tipo: 'PF',
      doc: '12345678901',
      data_cadastro: '2026-01-10',
    },
  ],
  funcionarios: [],
  quartos: [
    { id: 1, numero: 101, tipo: 'SIMPLES', preco_diaria: 180, situacao_atual: 'DISPONIVEL' },
    { id: 2, numero: 102, tipo: 'DUPLO', preco_diaria: 260, situacao_atual: 'OCUPADO' },
    { id: 3, numero: 201, tipo: 'SUITE', preco_diaria: 420, situacao_atual: 'LIMPEZA' },
    { id: 4, numero: 202, tipo: 'LUXO', preco_diaria: 690, situacao_atual: 'MANUTENCAO' },
    { id: 5, numero: 103, tipo: 'DUPLO', preco_diaria: 260, situacao_atual: 'DISPONIVEL' },
  ],
  historico: [1, 2, 3, 4, 5].map((i) => ({
    id: i,
    id_quarto: i,
    status_anterior: '',
    novo_status: ['DISPONIVEL', 'OCUPADO', 'LIMPEZA', 'MANUTENCAO', 'DISPONIVEL'][i - 1],
    data_hora_inicio: '2026-01-01 08:00',
    data_hora_fim: '',
    motivo_alteracao: 'Cadastro',
  })),
  reservas: [
    {
      id: 1,
      id_cliente: 1,
      id_quarto: 2,
      data_checkin: '2026-10-05',
      data_checkout: '2026-10-09',
      status: 'EM_ANDAMENTO',
      valor_total: 1040,
    },
    {
      id: 2,
      id_cliente: 1,
      id_quarto: 3,
      data_checkin: '2026-10-20',
      data_checkout: '2026-10-23',
      status: 'PENDENTE',
      valor_total: 1260,
    },
  ],
  auditoria: [],
}
