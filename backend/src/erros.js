// Erros da aplicação e tradução dos erros do MySQL para mensagens compreensíveis.
export class ErroApp extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
  }
}

// Permite usar async/await nas rotas do Express 4 sem try/catch em cada uma.
export const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next)

export function traduzir(err) {
  if (err instanceof ErroApp) return { status: err.status, msg: err.message }
  if (err.type === 'entity.parse.failed') return { status: 400, msg: 'Dados enviados em formato inválido.' }
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return { status: 409, msg: 'Já existe um cadastro com esse valor (CPF, CNPJ, e-mail ou número de quarto).' }
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return { status: 400, msg: 'Algum valor informado não é permitido pelas regras do hotel.' }
    case 'ER_ROW_IS_REFERENCED_2':
      return { status: 409, msg: 'Este registro está em uso e não pode ser excluído.' }
    case 'ER_NO_REFERENCED_ROW_2':
      return { status: 400, msg: 'O registro relacionado não existe.' }
    case 'ER_DATA_TOO_LONG':
      return { status: 400, msg: 'Um dos textos informados é longo demais.' }
    case 'ER_LOCK_DEADLOCK':
      return { status: 409, msg: 'Conflito com outra operação simultânea. Tente novamente.' }
  }
  console.error(err) // detalhe técnico fica só no log do servidor
  return { status: 500, msg: 'Erro interno. Tente novamente mais tarde.' }
}
