// Regras de negócio das reservas: conflito de datas, status e rótulos.

export const STT = {
  PENDENTE: 'Aguardando conferência da recepção',
  CONFIRMADA: 'Reserva confirmada',
  EM_ANDAMENTO: 'Hospedagem em andamento',
  FINALIZADA: 'Hospedagem finalizada',
  CANCELADA: 'Reserva recusada ou cancelada',
}

export const esOf = (s) =>
  ({ PENDENTE: 'RESERVADO', CONFIRMADA: 'RESERVADO', EM_ANDAMENTO: 'OCUPADO' })[s] || 'DISPONIVEL'

export const ocupado = (d, qid, ci, co, ign) =>
  d.reservas.some(
    (r) =>
      r.id !== ign &&
      r.id_quarto === qid &&
      r.status !== 'CANCELADA' &&
      r.data_checkin < co &&
      ci < r.data_checkout,
  )

export const nomeCli = (d, r) =>
  (d.clientes.find((c) => c.id === r.id_cliente) || { nome: '?' }).nome.split(' ')[0]
