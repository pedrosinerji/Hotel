// Raiz da aplicação: carrega dados, controla login e escolhe entre site e área do funcionário.
import { useState, useEffect } from 'react'
import { DEMO, seed } from './data/seed.js'
import { Site } from './pages/site/Site.jsx'
import { Staff } from './pages/staff/Staff.jsx'
import { StaffLogin } from './pages/staff/StaffLogin.jsx'
import { sha, aud } from './services/auditoria.js'

export default function App() {
  const [d, setD] = useState(null)
  const [area, setArea] = useState('pub')
  const [me, setMe] = useState(null)
  useEffect(() => {
    ;(async () => {
      const fs = []
      for (const [i, u] of DEMO.entries())
        fs.push({
          id: i + 1,
          id_supervisor: i ? 1 : '',
          nome: u[1],
          cargo: u[2] === 'GERENTE' ? 'Gerente' : 'Recepcionista',
          salario: i ? 3500 : 9500,
          data_admissao: '2024-01-10',
          login: u[0],
          papel: u[2],
          hash_senha: await sha(u[0] + ':' + u[3]),
        })
      setD({ ...seed, funcionarios: fs })
    })()
  }, [])
  if (!d) return <div className="pg">Carregando...</div>
  const login = async (l, s) => {
    const u = d.funcionarios.find((x) => x.login === l.trim())
    if (!(u && u.hash_senha === (await sha(u.login + ':' + s)))) {
      setD(
        await aud(
          d,
          { login: l || '-', papel: '-' },
          'LOGIN_FALHA',
          'sessao',
          '-',
          'credenciais inválidas',
        ),
      )
      return 'Usuário ou senha inválidos.'
    }
    setD(await aud(d, u, 'LOGIN', 'sessao', '-', ''))
    setMe(u)
  }
  const out = async () => {
    setD(await aud(d, me, 'LOGOUT', 'sessao', '-', ''))
    setMe(null)
    setArea('pub')
  }
  if (me)
    return (
      <div>
        <div className="shdr">
          <span className="logo">
            HOTEL <b>BRMW</b>
          </span>
          <div>
            <b>{me.nome}</b>{' '}
            <span className="tag" style={{ color: '#fff' }}>
              {me.papel}
            </span>{' '}
            <button className="btn g" onClick={out}>
              Sair
            </button>
          </div>
        </div>
        <Staff d={d} setD={setD} me={me} />
      </div>
    )
  if (area === 'staff')
    return (
      <div>
        <div className="shdr">
          <span className="logo">
            HOTEL <b>BRMW</b>
          </span>
          <button className="btn g" onClick={() => setArea('pub')}>
            Voltar ao site
          </button>
        </div>
        <StaffLogin onLogin={login} />
      </div>
    )
  return <Site d={d} setD={setD} onStaff={() => setArea('staff')} />
}
