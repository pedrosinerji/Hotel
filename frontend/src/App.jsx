// Raiz da aplicação: busca os dados na API, controla o login e escolhe entre site e área do funcionário.
import { useState, useEffect, useCallback } from 'react'
import { Site } from './pages/site/Site.jsx'
import { Staff } from './pages/staff/Staff.jsx'
import { StaffLogin } from './pages/staff/StaffLogin.jsx'
import { api, setToken } from './services/api.js'

const lerUsuario = () => JSON.parse(sessionStorage.getItem('user') || 'null')

export default function App() {
  const [d, setD] = useState(null)
  const [erro, setErro] = useState('')
  const [area, setArea] = useState('pub')
  const [me, setMe] = useState(lerUsuario)

  const limpar = useCallback(() => {
    setToken(null)
    sessionStorage.removeItem('user')
    setD(null)
    setMe(null)
    setArea('pub')
  }, [])

  // Busca os dados certos para quem está usando: funcionário (completo) ou hóspede (só quartos).
  const atualizar = useCallback(async () => {
    try {
      setD(me ? await api.staffDados() : await api.publicoDados())
      setErro('')
    } catch (e) {
      if (e.status === 401) return limpar() // sessão expirada
      setErro(e.message)
    }
  }, [me, limpar])

  useEffect(() => {
    atualizar()
  }, [atualizar])

  const login = async (l, s) => {
    try {
      const r = await api.login({ login: l.trim(), senha: s })
      setToken(r.token)
      sessionStorage.setItem('user', JSON.stringify(r.user))
      setD(null)
      setMe(r.user)
    } catch (e) {
      return e.message
    }
  }

  const sair = async () => {
    try {
      await api.logout()
    } catch {
      /* mesmo sem resposta, encerra a sessão local */
    }
    limpar()
  }

  if (!d)
    return (
      <div className="pg">
        {erro ? (
          <>
            <div className="err" role="alert">
              {erro}
            </div>
            <button className="btn" onClick={atualizar}>
              Tentar de novo
            </button>
          </>
        ) : (
          'Carregando...'
        )}
      </div>
    )

  const topo = (direita) => (
    <div className="shdr">
      <span className="logo">
        PIBBLES <b>hotel</b>
      </span>
      {direita}
    </div>
  )

  if (me)
    return (
      <div>
        {topo(
          <div>
            <b>{me.nome}</b>{' '}
            <span className="tag" style={{ color: '#fff' }}>
              {me.papel}
            </span>{' '}
            <button className="btn g" onClick={sair}>
              Sair
            </button>
          </div>,
        )}
        <Staff d={d} onChange={atualizar} me={me} />
      </div>
    )
  if (area === 'staff')
    return (
      <div>
        {topo(
          <button className="btn g" onClick={() => setArea('pub')}>
            Voltar ao site
          </button>,
        )}
        <StaffLogin onLogin={login} />
      </div>
    )
  return <Site d={d} onChange={atualizar} onStaff={() => setArea('staff')} />
}
