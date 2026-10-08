// Imagens de fundo e fotos do site (opcionais).

// Imagens do site. Coloque os arquivos em public/img e informe o caminho (ex.: '/img/hero.jpg').
// Campo vazio = usa a ilustração padrão.
export const IMG = {
  hero: '/img/pibble_hotel.jpg', // faixa principal do topo (foto larga, 1600px de largura ou mais)
  SIMPLES: '/img/Pibble_quarto_de_solteiro.jpg', // cartão do quarto Standard Solteiro (proporção 8:5)
  DUPLO: '/img/Pibble_quarto_standart_duplo.jpg', // cartão do quarto Standard Duplo
  SUITE: '/img/Pibbles_quarto_suite.jpg', // cartão da Suíte
  LUXO: '/img/Pibbles_suite_de_luxo.jpg', // cartão da Suíte Luxo
  comodidades: '', // fundo da seção de comodidades
  reserva: '', // fundo da seção "Faça sua reserva"
  rodape: '', // fundo do rodapé
}

export const bgImg = (u, veu) =>
  u
    ? {
        backgroundImage: `linear-gradient(${veu},${veu}),url(${u})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined
