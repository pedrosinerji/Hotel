// Login do funcionário.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { pool } from '../db.js'
import { ah } from '../erros.js'
import { registrar } from '../audit.js'
import { gerarToken } from '../auth.js'

export const authRouter = Router()

const limite = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Aguarde alguns minutos.' },
})

authRouter.post(
  '/login',
  limite,
  ah(async (req, res) => {
    const login = String(req.body?.login || '').trim()
    const senha = String(req.body?.senha || '')
    const [rows] = await pool.execute(
      'SELECT id_funcionario AS id, nome, login, senha_hash, papel, ativo FROM funcionario WHERE login = ?',
      [login],
    )
    const f = rows[0]
    const ok = f && f.senha_hash && Number(f.ativo) === 1 && (await bcrypt.compare(senha, f.senha_hash))
    if (!ok) {
      await registrar(pool, { login: login || '-', papel: '-' }, 'LOGIN_FALHA', 'sessao', '-', 'credenciais inválidas')
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' })
    }
    await registrar(pool, f, 'LOGIN', 'sessao', '-')
    res.json({ token: gerarToken(f), user: { id: f.id, nome: f.nome, login: f.login, papel: f.papel } })
  }),
)
