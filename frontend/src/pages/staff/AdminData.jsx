import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { money } from '../../utils/format.js'

const DEFINICOES = {
  quartos: {
    titulo: 'Quartos',
    campos: [
      { k: 'numero', l: 'Número', tipo: 'number' },
      { k: 'tipo', l: 'Tipo', tipo: 'select', op: ['SIMPLES', 'DUPLO', 'SUITE', 'LUXO'] },
      { k: 'preco_diaria', l: 'Preço da diária', tipo: 'number' },
      {
        k: 'situacao_atual',
        l: 'Situação',
        tipo: 'select',
        op: ['DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'LIMPEZA', 'BLOQUEADO'],
      },
    ],
  },
  servicos: {
    titulo: 'Serviços',
    campos: [
      { k: 'nome_servico', l: 'Nome do serviço' },
      { k: 'preco_base', l: 'Preço base', tipo: 'number' },
    ],
  },
  produtos: {
    titulo: 'Produtos',
    campos: [
      { k: 'id_fornecedor', l: 'ID fornecedor', tipo: 'number' },
      { k: 'nome_produto', l: 'Nome do produto' },
      { k: 'qtd_estoque', l: 'Estoque', tipo: 'number' },
      { k: 'preco_custo', l: 'Preço de custo', tipo: 'number' },
    ],
  },
  fornecedores: {
    titulo: 'Fornecedores',
    campos: [
      { k: 'razao_social', l: 'Razão social' },
      { k: 'cnpj', l: 'CNPJ (14 dígitos)' },
      { k: 'telefone', l: 'Telefone (opcional)' },
    ],
  },
}
const vazio = (tipo) =>
  Object.fromEntries(
    DEFINICOES[tipo].campos.map((c) => [
      c.k,
      c.tipo === 'number' ? '' : c.k === 'situacao_atual' ? 'DISPONIVEL' : '',
    ]),
  )

export function AdminData() {
  const [tipo, setTipo] = useState('quartos'),
    [rows, setRows] = useState([]),
    [form, setForm] = useState(vazio('quartos'))
  const [edit, setEdit] = useState(null),
    [erro, setErro] = useState(''),
    [ok, setOk] = useState('')
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10)),
    [fim, setFim] = useState(new Date().toISOString().slice(0, 10))
  const [reservas, setReservas] = useState([]),
    [faturamento, setFaturamento] = useState([]),
    [consolidado, setConsolidado] = useState([])
  const carregar = async (t = tipo) => {
    try {
      setRows(await api.catalogo(t))
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }
  useEffect(() => {
    carregar(tipo)
    setForm(vazio(tipo))
    setEdit(null)
  }, [tipo])
  const campo = (c) => (
    <label key={c.k}>
      {c.l}
      {c.tipo === 'select' ? (
        <select
          value={form[c.k] ?? ''}
          onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
        >
          {c.op.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          required={c.k !== 'telefone'}
          type={c.tipo || 'text'}
          min={c.tipo === 'number' ? 0 : undefined}
          step={c.k.includes('preco') ? '0.01' : '1'}
          value={form[c.k] ?? ''}
          onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
        />
      )}
    </label>
  )
  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    setOk('')
    try {
      const body = { ...form }
      for (const c of DEFINICOES[tipo].campos)
        if (c.tipo === 'number') body[c.k] = Number(body[c.k])
      if (edit) await api.atualizarCatalogo(tipo, edit, body)
      else await api.criarCatalogo(tipo, body)
      setOk('Registro salvo.')
      setForm(vazio(tipo))
      setEdit(null)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }
  const editar = (r) => {
    setEdit(r.id)
    setForm(Object.fromEntries(DEFINICOES[tipo].campos.map((c) => [c.k, r[c.k] ?? ''])))
  }
  const excluir = async (r) => {
    if (
      !confirm(
        `Excluir o registro #${r.id}? O banco impedirá exclusões que violem relacionamentos.`,
      )
    )
      return
    try {
      await api.excluirCatalogo(tipo, r.id)
      setOk('Registro excluído.')
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }
  const buscarRelatorios = async () => {
    setErro('')
    try {
      const f = { inicio, fim }
      const [a, b, c] = await Promise.all([
        api.relatorioReservas(f),
        api.relatorioFaturamento(f),
        api.relatorioConsolidado(),
      ])
      setReservas(a)
      setFaturamento(b)
      setConsolidado(c)
    } catch (e) {
      setErro(e.message)
    }
  }
  return (
    <div className="pg">
      <h2>Cadastros e relatórios do banco</h2>
      <p>
        CRUDs administrativos e duas consultas filtradas com JOIN/agregação. Acesso restrito ao
        gerente.
      </p>
      <div className="tabs">
        {Object.entries(DEFINICOES).map(([k, v]) => (
          <button key={k} className={tipo === k ? 'on' : ''} onClick={() => setTipo(k)}>
            {v.titulo}
          </button>
        ))}
      </div>
      {erro && (
        <div className="err" role="alert">
          {erro}
        </div>
      )}
      {ok && (
        <div className="card" role="status">
          {ok}
        </div>
      )}
      <form className="card" onSubmit={salvar}>
        <h3>
          {edit
            ? `Editar ${DEFINICOES[tipo].titulo} #${edit}`
            : `Novo cadastro: ${DEFINICOES[tipo].titulo}`}
        </h3>
        <div className="form">{DEFINICOES[tipo].campos.map(campo)}</div>
        <button className="btn" type="submit">
          {edit ? 'Salvar alterações' : 'Cadastrar'}
        </button>
        {edit && (
          <>
            {' '}
            <button
              className="btn g"
              type="button"
              onClick={() => {
                setEdit(null)
                setForm(vazio(tipo))
              }}
            >
              Cancelar edição
            </button>
          </>
        )}
      </form>
      <div className="card wrap">
        <h3>Registros</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {DEFINICOES[tipo].campos.map((c) => (
                <th key={c.k}>{c.l}</th>
              ))}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                {DEFINICOES[tipo].campos.map((c) => (
                  <td key={c.k}>{String(r[c.k] ?? '—')}</td>
                ))}
                <td>
                  <button className="btn g" onClick={() => editar(r)}>
                    Editar
                  </button>{' '}
                  <button className="btn d" onClick={() => excluir(r)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Consulta 1 — Reservas por período</h3>
        <div className="form">
          <label>
            Início
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label>
            Fim
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>
        <button className="btn" onClick={buscarRelatorios}>
          Executar consultas e atualizar relatório
        </button>
        {reservas.length > 0 && (
          <div className="wrap">
            <table>
              <thead>
                <tr>
                  {[
                    'Reserva',
                    'Cliente',
                    'Quarto',
                    'Check-in',
                    'Check-out',
                    'Status',
                    'Noites',
                    'Serviços',
                    'Total',
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.reserva}>
                    <td>{r.reserva}</td>
                    <td>{r.cliente}</td>
                    <td>{r.quarto}</td>
                    <td>{r.data_checkin}</td>
                    <td>{r.data_checkout}</td>
                    <td>{r.status}</td>
                    <td>{r.noites}</td>
                    <td>{r.servicos_lancados}</td>
                    <td>{money(r.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Consulta 2 — Faturamento por tipo de quarto</h3>
        {faturamento.length > 0 && (
          <div className="wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Reservas</th>
                  <th>Faturamento</th>
                  <th>Ticket médio</th>
                </tr>
              </thead>
              <tbody>
                {faturamento.map((r, i) => (
                  <tr key={i}>
                    <td>{r.tipo}</td>
                    <td>{r.quantidade_reservas}</td>
                    <td>{money(r.faturamento)}</td>
                    <td>{r.ticket_medio == null ? '—' : money(r.ticket_medio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Relatório consolidado — VIEW do banco</h3>
        {consolidado.length > 0 ? (
          <div className="wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(consolidado[0]).map((k) => (
                    <th key={k}>{k.replaceAll('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consolidado.map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((v, j) => (
                      <td key={j}>{v == null ? '—' : String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Execute as consultas acima para carregar o relatório consolidado.</p>
        )}
      </div>
    </div>
  )
}
