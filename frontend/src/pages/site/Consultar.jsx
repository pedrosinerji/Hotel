// Consulta de reserva por protocolo e documento.
import { useState } from 'react'
import { RoomSVG } from '../../components/rooms/RoomPlan.jsx'
import { STT, esOf } from '../../domain/reservas.js'
import { api } from '../../services/api.js'
import { money, dig } from '../../utils/format.js'

export function Consultar() {
  const [p, setP] = useState('')
  const [doc, setDoc] = useState('')
  const [res, setRes] = useState(undefined)
  const [erro, setErro] = useState('')
  const busca = async () => {
    try {
      setRes(await api.consultar({ protocolo: Number(p), doc: dig(doc) }))
      setErro('')
    } catch (e) {
      setRes(null)
      setErro(e.message)
    }
  }
  const q = res && res.q
  return (
    <div>
      <h2>Consultar reserva</h2>
      <div className="card" style={{ maxWidth: 520, margin: '14px 0' }}>
        <div className="form">
          <div>
            <label>Protocolo</label>
            <input value={p} onChange={(e) => setP(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label>CPF ou CNPJ usado na reserva</label>
            <input value={doc} onChange={(e) => setDoc(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <button className="btn" onClick={busca}>
          Consultar
        </button>
      </div>
      {res === null && <div className="err">{erro || 'Nenhuma reserva encontrada com esses dados.'}</div>}
      {res && (
        <div className="split">
          <div className="card">
            <RoomSVG q={q} es={esOf(res.r.status)} />
          </div>
          <div className="card">
            <b>Reserva nº {res.r.id}</b> <span className="tag">{res.r.status}</span>
            <br />
            {STT[res.r.status]}
            <br />
            <br />
            Quarto {q.numero} ({q.tipo})<br />
            De {res.r.data_checkin} a {res.r.data_checkout}
            <br />
            Total: <b>{money(res.r.valor_total)}</b>
          </div>
        </div>
      )}
    </div>
  )
}
