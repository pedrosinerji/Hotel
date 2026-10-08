// Login do funcionário.
import { useState } from 'react'
import { DEMO } from '../../data/seed.js'

export function StaffLogin({ onLogin }) {
  const [l, setL] = useState('')
  const [p, setP] = useState('')
  const [e, setE] = useState('')
  const go = async () => setE((await onLogin(l, p)) || '')
  return (
    <div className="pg" style={{ maxWidth: 440 }}>
      <h2>Área do funcionário</h2>
      <p style={{ color: 'var(--mut)' }}>Acesso restrito à equipe do hotel.</p>
      <div className="card">
        <div className="form" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <label>Usuário</label>
            <input value={l} onChange={(x) => setL(x.target.value)} autoComplete="username" />
          </div>
          <div>
            <label>Senha</label>
            <input
              type="password"
              value={p}
              onChange={(x) => setP(x.target.value)}
              onKeyDown={(x) => x.key === 'Enter' && go()}
              autoComplete="current-password"
            />
          </div>
        </div>
        {e && (
          <div className="err" role="alert">
            {e}
          </div>
        )}
        <button className="btn" style={{ width: '100%' }} onClick={go}>
          Entrar
        </button>
      </div>
      <div className="demo">
        <b>Contas de demonstração</b>
        <table>
          <tbody>
            {DEMO.map((u) => (
              <tr key={u[0]}>
                <td>{u[0]}</td>
                <td>{u[3]}</td>
                <td>{u[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
