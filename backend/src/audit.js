// Registro na tabela auditoria. `conn` pode ser o pool ou uma conexão de transação.
export async function registrar(conn, usuario, acao, tabela, registro, detalhe = '') {
  await conn.execute(
    'INSERT INTO auditoria (usuario, papel, acao, tabela, registro, detalhe) VALUES (?, ?, ?, ?, ?, ?)',
    [usuario.login, usuario.papel, acao, tabela, String(registro), String(detalhe).slice(0, 500)],
  )
}
