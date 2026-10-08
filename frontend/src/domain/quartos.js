// Regras de negócio dos quartos: situação por data e histórico de status.
import { now, today } from '../utils/format.js'

export const COL = {
  DISPONIVEL: '#4a7d56',
  OCUPADO: '#a8402e',
  MANUTENCAO: '#b9791a',
  LIMPEZA: '#3d6b86',
  BLOQUEADO: '#6b7068',
  RESERVADO: '#8a5a14',
}

export const resOn = (q, d, dt) =>
  d.reservas.find(
    (r) =>
      r.id_quarto === q.id &&
      ['PENDENTE', 'CONFIRMADA'].includes(r.status) &&
      r.data_checkin <= dt &&
      dt < r.data_checkout,
  )

export const estado = (q, d, dt = today) =>
  q.situacao_atual === 'DISPONIVEL' && resOn(q, d, dt) ? 'RESERVADO' : q.situacao_atual

export const mudaQuarto = (d, id, novo, motivo) => {
  const q = d.quartos.find((x) => x.id === id)
  if (q.situacao_atual === novo) return d
  const t = now()
  return {
    ...d,
    quartos: d.quartos.map((x) => (x.id === id ? { ...x, situacao_atual: novo } : x)),
    historico: [
      ...d.historico.map((h) =>
        h.id_quarto === id && !h.data_hora_fim ? { ...h, data_hora_fim: t } : h,
      ),
      {
        id: 1 + Math.max(0, ...d.historico.map((h) => h.id)),
        id_quarto: id,
        status_anterior: q.situacao_atual,
        novo_status: novo,
        data_hora_inicio: t,
        data_hora_fim: '',
        motivo_alteracao: motivo,
      },
    ],
  }
}
