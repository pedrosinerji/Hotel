// Tela da trilha de auditoria (gerente). Os eventos vêm da tabela auditoria do MySQL.
import { useState } from 'react'

export function Audit({ d }) {
  const [f, setF] = useState({ u: '', a: '' })
  const rows = [...d.auditoria]
    .reverse()
    .filter((e) => (!f.u || e.usuario === f.u) && (!f.a || e.acao === f.a))
  const acoes = [...new Set(d.auditoria.map((e) => e.acao))]
  return (
    <div>
      <div className="top">
        <h2>Trilha de auditoria</h2>
      </div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--mut)', fontSize: 13 }}>
        Eventos só podem ser incluídos: o usuário do banco usado pela API tem permissão apenas de
        INSERT e SELECT nesta tabela.
      </p>
    </div>
  )
}
