// Hash SHA-256 e trilha de auditoria (somente inclusão, encadeada por hash).

export async function sha(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// trilha de auditoria: somente inclusão, cada evento encadeado ao anterior por hash
export async function aud(d, u, acao, tabela, registro, detalhe) {
  const prev = d.auditoria.length ? d.auditoria[d.auditoria.length - 1].hash : '0'
  const e = {
    id: d.auditoria.length + 1,
    data_hora: new Date().toLocaleString('sv-SE'),
    usuario: u ? u.login : '-',
    papel: u ? u.papel : '-',
    acao,
    tabela,
    registro,
    detalhe,
  }
  return { ...d, auditoria: [...d.auditoria, { ...e, hash: await sha(prev + JSON.stringify(e)) }] }
}
