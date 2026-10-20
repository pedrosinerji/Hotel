// Cliente da API: todas as chamadas ao backend passam por aqui.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let token = sessionStorage.getItem('token')
export function setToken(t) {
  token = t
  if (t) sessionStorage.setItem('token', t)
  else sessionStorage.removeItem('token')
}

async function req(caminho, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(BASE + caminho, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Não foi possível falar com o servidor. Confira se a API está rodando.')
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const erro = new Error(json.erro || 'Erro inesperado.')
    erro.status = res.status
    throw erro
  }
  return json
}

export const api = {
  publicoDados: () => req('/publico/dados'),
  reservar: (dados) => req('/publico/reservas', { method: 'POST', body: dados }),
  consultar: (dados) => req('/publico/reservas/consulta', { method: 'POST', body: dados }),
  login: (dados) => req('/auth/login', { method: 'POST', body: dados }),
  logout: () => req('/staff/logout', { method: 'POST' }),
  staffDados: () => req('/staff/dados'),
  mudarStatus: (id, status, motivo) =>
    req(`/staff/reservas/${id}/status`, { method: 'PATCH', body: { status, motivo } }),
  catalogo: (tipo) => req(`/staff/catalogos/${tipo}`),
  criarCatalogo: (tipo, dados) => req(`/staff/catalogos/${tipo}`, { method: 'POST', body: dados }),
  atualizarCatalogo: (tipo, id, dados) =>
    req(`/staff/catalogos/${tipo}/${id}`, { method: 'PUT', body: dados }),
  excluirCatalogo: (tipo, id) => req(`/staff/catalogos/${tipo}/${id}`, { method: 'DELETE' }),
  relatorioReservas: (filtros) => req(`/staff/relatorios/reservas?${new URLSearchParams(filtros)}`),
  relatorioFaturamento: (filtros) =>
    req(`/staff/relatorios/faturamento?${new URLSearchParams(filtros)}`),
  relatorioConsolidado: () => req('/staff/relatorios/consolidado'),
}
