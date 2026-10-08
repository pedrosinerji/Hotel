// Formatação e cálculos de data e dinheiro.

export const money = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5)

export const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

export const today = new Date().toISOString().slice(0, 10)

export const addD = (a, n) => new Date(Date.parse(a) + n * 864e5).toISOString().slice(0, 10)

export const fmt = (x) => x.slice(8) + '/' + x.slice(5, 7)

export const dig = (x) => x.replace(/\D/g, '')
