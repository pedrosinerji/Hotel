// Define login, senha (bcrypt, com sal) e perfil de um funcionário já cadastrado.
// Uso: npm run criar-usuario -- <id_funcionario> <login> <senha> <GERENTE|RECEPCAO>
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

const [, , id, login, senha, papel] = process.argv
if (!id || !login || !senha || !['GERENTE', 'RECEPCAO'].includes(papel)) {
  console.log('Uso: npm run criar-usuario -- <id_funcionario> <login> <senha> <GERENTE|RECEPCAO>')
  process.exit(1)
}
if (senha.length < 8) {
  console.log('A senha precisa ter ao menos 8 caracteres.')
  process.exit(1)
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
const hash = await bcrypt.hash(senha, 10) // o sal é gerado e guardado dentro do próprio hash
const [r] = await conn.execute(
  'UPDATE funcionario SET login = ?, senha_hash = ?, papel = ?, ativo = 1 WHERE id_funcionario = ?',
  [login, hash, papel, Number(id)],
)
console.log(r.affectedRows ? `Usuário "${login}" configurado como ${papel}.` : 'Funcionário não encontrado.')
await conn.end()
