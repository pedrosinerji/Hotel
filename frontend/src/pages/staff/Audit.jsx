// Tela da trilha de auditoria (gerente).
import { useState } from 'react'
import { sha } from '../../services/auditoria.js'

export function Audit({ d }) {
  const [f, setF] = useState({ u: '', a: '' })
  const [v, setV] = useState(null)
  const rows = [...d.auditoria]
    .reverse()
    .filter((e) => (!f.u || e.usuario === f.u) && (!f.a || e.acao === f.a))
  const acoes = [...new Set(d.auditoria.map((e) => e.acao))]
  const verify = async () => {
    let prev = '0'
    for (const e of d.auditoria) {
      const { hash, ...rest } = e
      if ((await sha(prev + JSON.stringify(rest))) !== hash)
        return setV({ bad: 1, t: 'Adulteração detectada no evento #' + e.id })
      prev = hash
    }
    setV({ t: `Cadeia íntegra: ${d.auditoria.length} eventos verificados.` })
  }
  return (
    <div>
      <div className="top">
        <h2>Trilha de auditoria</h2>
        <button className="btn" onClick={verify}>
          Verificar integridade
        </button>
      </div>
      {v && (
        <div className={v.bad ? 'err' : 'ok'} style={{ marginBottom: 12 }}>
          {v.t}
        </div>
      )}
      <div className="form" style={{ maxWidth: 480 }}>
        <div>
          <label>Usuário</label>
          <select value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })}>
            <option value="">Todos</option>
            {[...new Set(d.auditoria.map((e) => e.usuario))].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Ação</label>
          <select value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })}>
            <option value="">Todas</option>
            {acoes.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Data/hora</th>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Ação</th>
              <th>Tabela</th>
              <th>Registro</th>
              <th>Detalhe</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.data_hora}</td>
                <td>{e.usuario}</td>
                <td>{e.papel}</td>
                <td>
                  <span className={'tag' + (/FALHA|NEGADO|EXCLUIR/.test(e.acao) ? ' bad' : '')}>
                    {e.acao}
                  </span>
                </td>
                <td>{e.tabela}</td>
                <td>{e.registro}</td>
                <td className="w">{e.detalhe || '-'}</td>
                <td>
                  <code>{e.hash.slice(0, 10)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--mut)', fontSize: 13 }}>
        Eventos só podem ser incluídos: não há edição nem exclusão. Cada registro guarda o hash do
        anterior, então qualquer alteração quebra a cadeia.
      </p>
    </div>
  )
}
