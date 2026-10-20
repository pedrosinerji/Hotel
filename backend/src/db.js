// Conexão com o MySQL (pool) e helper de transação.
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE e DATETIME chegam como texto ('2026-10-08'), sem fuso horário
})

// Executa `fn` dentro de uma transação: COMMIT se terminar bem, ROLLBACK se der erro.
export async function transacao(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const resultado = await fn(conn)
    await conn.commit()
    return resultado
  } catch (erro) {
    await conn.rollback()
    throw erro
  } finally {
    conn.release()
  }
}
