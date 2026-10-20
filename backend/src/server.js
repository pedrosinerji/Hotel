// Ponto de entrada da API.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import { ah, traduzir } from './erros.js'
import { publico } from './rotas/publico.js'
import { authRouter } from './rotas/auth.js'
import { staff } from './rotas/staff.js'

if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no arquivo .env')
  process.exit(1)
}

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50kb' }))

// Teste rápido de conexão com o banco: http://localhost:3001/api/saude
app.get(
  '/api/saude',
  ah(async (req, res) => {
    await pool.query('SELECT 1')
    res.json({ ok: true, banco: process.env.DB_NAME })
  }),
)
app.use('/api/publico', publico)
app.use('/api/auth', authRouter)
app.use('/api/staff', staff)

// Qualquer erro vira uma mensagem amigável (nunca a exceção bruta do driver).
app.use((err, req, res, next) => {
  const { status, msg } = traduzir(err)
  res.status(status).json({ erro: msg })
})

const porta = Number(process.env.PORT || 3001)
app.listen(porta, () => console.log(`API do hotel em http://localhost:${porta}`))
