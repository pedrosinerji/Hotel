// Site público do hotel.
import { useState } from 'react'
import { HeroScene } from '../../components/rooms/HeroScene.jsx'
import { Scene } from '../../components/rooms/Scene.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { IMG, bgImg } from '../../config/images.js'
import { Consultar } from './Consultar.jsx'
import { Reservar } from './Reservar.jsx'
import { money, today, addD } from '../../utils/format.js'

export function Site({ d, setD, onStaff }) {
  const [f, setF] = useState({ ci: addD(today, 1), co: addD(today, 3), tipo: '', q: '' })
  const [pg, setPg] = useState('home')
  const go = (id) => {
    setPg('home')
    setTimeout(() => {
      const e = document.getElementById(id)
      e ? e.scrollIntoView() : window.scrollTo(0, 0)
    }, 40)
  }
  const tipos = ['SIMPLES', 'DUPLO', 'SUITE', 'LUXO'].filter((t) =>
    d.quartos.some((q) => q.tipo === t),
  )
  const nome = {
    SIMPLES: 'Standard Solteiro',
    DUPLO: 'Standard Duplo',
    SUITE: 'Suíte',
    LUXO: 'Suíte Luxo',
  }
  const desc = {
    SIMPLES: 'Cama de solteiro, prática para quem viaja a trabalho.',
    DUPLO: 'Duas camas e conforto para dividir a estadia.',
    SUITE: 'Cama ampla e sofá, com espaço de sobra.',
    LUXO: 'Nosso quarto mais amplo, com acabamento superior.',
  }
  const preco = (t) => Math.min(...d.quartos.filter((q) => q.tipo === t).map((q) => q.preco_diaria))
  const AM = [
    ['wifi', 'Wi-Fi grátis'],
    ['coffee', 'Café da manhã'],
    ['pool', 'Piscina'],
    ['car', 'Estacionamento'],
    ['snow', 'Climatização'],
    ['tv', 'TV'],
    ['fridge', 'Frigobar'],
    ['clock', 'Recepção 24h'],
  ]
  return (
    <div>
      <header className="site-h">
        <div className="in">
          <button className="logo" onClick={() => go('topo')}>
            Pibbles <b>hotel</b>
          </button>
          <nav className="mn" aria-label="Principal">
            <button className="lk" onClick={() => go('topo')}>
              Início
            </button>
            <button className="lk" onClick={() => go('acomodacoes')}>
              Acomodações
            </button>
            <button className="lk" onClick={() => go('comodidades')}>
              Comodidades
            </button>
            <button
              className="lk"
              onClick={() => {
                setPg('con')
                window.scrollTo(0, 0)
              }}
            >
              Consultar reserva
            </button>
            <button className="btn" onClick={() => go('reserva')}>
              Reservar
            </button>
          </nav>
        </div>
      </header>
      {pg === 'con' ? (
        <div className="sec" style={{ minHeight: '60vh' }}>
          <Consultar d={d} />
        </div>
      ) : (
        <>
         <section id="topo" className={'hero' + (IMG.hero ? ' hero-foto' : '')}>
            <HeroScene />
            <div className="in">
              <h1>Conforto de verdade no coração de Brasília</h1>
              <p>
                Quartos bem equipados, café da manhã e reserva online com conferência rápida da
                nossa recepção.
              </p>
            </div>
          </section>
          <div className="bar">
            <div>
              <label>Check-in</label>
              <input
                type="date"
                min={today}
                value={f.ci}
                onChange={(e) => setF({ ...f, ci: e.target.value, q: '' })}
              />
            </div>
            <div>
              <label>Check-out</label>
              <input
                type="date"
                min={f.ci}
                value={f.co}
                onChange={(e) => setF({ ...f, co: e.target.value, q: '' })}
              />
            </div>
            <div>
              <label>Tipo de quarto</label>
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
                <option value="">Todos</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {nome[t]}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" onClick={() => go('reserva')}>
              Ver quartos livres
            </button>
          </div>
          <div className="badges">
            <span>Melhor preço no site</span>
            <span>Wi-Fi grátis</span>
            <span>Estacionamento grátis</span>
            <span>Piscina</span>
          </div>
          <section id="acomodacoes" className="sec">
            <h2 className="tt">Nossas acomodações</h2>
            <p className="sub">
              Quartos confortáveis, com ótimo preço. Escolha o tipo e veja a planta de cada um antes
              de reservar.
            </p>
            <div className="cards">
              {tipos.map((t) => (
                <div className="rt" key={t}>
                  <Scene tipo={t} label={nome[t]} />
                  <div className="bd">
                    <h3>{nome[t]}</h3>
                    <p>{desc[t]}</p>
                    <div className="pr">
                      a partir de
                      <br />
                      <b>{money(preco(t))}</b> / noite
                    </div>
                    <button
                      className="btn"
                      onClick={() => {
                        setF({ ...f, tipo: t, q: '' })
                        go('reserva')
                      }}
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section
            id="comodidades"
            className="band"
            style={bgImg(IMG.comodidades, 'color-mix(in srgb,var(--alt) 88%,transparent)')}
          >
            <div className="sec">
              <h2 className="tt">Tudo para a sua estadia ser tranquila</h2>
              <p className="sub">Comodidades pensadas para quem viaja a trabalho ou a passeio.</p>
              <div className="am">
                {AM.map(([n, l]) => (
                  <div key={n}>
                    <Icon n={n} />
                    <div>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section
            id="reserva"
            style={bgImg(IMG.reserva, 'color-mix(in srgb,var(--bg) 90%,transparent)')}
          >
            <div className="sec">
              <h2 className="tt">Faça sua reserva</h2>
              <p className="sub">
                Escolha o quarto, informe seus dados e pronto: um funcionário confere e confirma o
                seu pedido.
              </p>
              <Reservar d={d} setD={setD} f={f} setF={setF} />
            </div>
          </section>
        </>
      )}
      <footer className="ft" style={bgImg(IMG.rodape, 'rgba(15,61,76,.88)')}>
        <div className="in">
          <div>
            <h3>HOTEL BRMW</h3>
            <p>Brasília, DF</p>
            <p>contato@hotelbrmw.example</p>
            <p>Projeto acadêmico de Laboratório de Banco de Dados.</p>
          </div>
          <button className="fl" onClick={onStaff}>
            Área do funcionário
          </button>
        </div>
      </footer>
    </div>
  )
}
