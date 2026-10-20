// Sessão do funcionário: token JWT e checagem de perfil.
import jwt from 'jsonwebtoken'

export const gerarToken = (u) =>
  jwt.sign({ id: u.id, login: u.login, nome: u.nome, papel: u.papel }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  })

export function exigeLogin(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' })
  }
}

export const exigePapel =
  (...papeis) =>
  (req, res, next) =>
    papeis.includes(req.user.papel)
      ? next()
      : res.status(403).json({ erro: 'Seu perfil não tem permissão para esta ação.' })
