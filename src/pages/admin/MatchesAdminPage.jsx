import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'

function maskDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('/')
}

const EMPTY_FORM = {
  id: '',
  home_name: '',
  home_crest_url: '',
  away_name: '',
  away_crest_url: '',
  match_date: '',
  home_score: '',
  away_score: '',
  played: false,
  highlight: false,
  sort_order: 0,
}

export default function MatchesAdminPage() {
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)

  function load() {
    Promise.all([apiGet('/matches.php'), apiGet('/teams.php')])
      .then(([m, t]) => {
        setMatches(m)
        setTeams(t)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function field(key) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [key]: value }))
    }
  }

  function teamField(nameKey, crestKey) {
    return (e) => {
      const team = teams.find((t) => t.name === e.target.value)
      setForm((f) => ({ ...f, [nameKey]: e.target.value, [crestKey]: team?.crest_url || '' }))
    }
  }

  function startNew() {
    setForm({ ...EMPTY_FORM, sort_order: matches.length + 1 })
  }

  function startEdit(match) {
    setForm({ ...match, home_score: match.home_score ?? '', away_score: match.away_score ?? '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.home_name.trim() || !form.away_name.trim()) {
      alert('Escolha os dois times.')
      return
    }
    if (form.id) {
      await apiPut(`/matches.php?id=${form.id}`, form)
    } else {
      await apiPost('/matches.php', form)
    }
    startNew()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir essa partida?')) return
    await apiDelete(`/matches.php?id=${id}`)
    load()
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="blog-admin-layout">
      <form className="blog-admin-form" onSubmit={handleSubmit}>
        <h2>{form.id ? 'Editar partida' : 'Nova partida'}</h2>

        {teams.length === 0 && (
          <p className="blog-admin-note">
            Nenhum time cadastrado ainda. <Link to="/admin/times">Cadastre os times primeiro</Link>.
          </p>
        )}

        <label>
          Time da casa
          <select value={form.home_name} onChange={teamField('home_name', 'home_crest_url')}>
            <option value="">Selecione...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {form.home_crest_url && (
          <div className="blog-admin-preview">
            <img src={form.home_crest_url} alt="" />
          </div>
        )}

        <label>
          Time visitante
          <select value={form.away_name} onChange={teamField('away_name', 'away_crest_url')}>
            <option value="">Selecione...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {form.away_crest_url && (
          <div className="blog-admin-preview">
            <img src={form.away_crest_url} alt="" />
          </div>
        )}

        <label>
          Data
          <input
            value={form.match_date}
            onChange={(e) => setForm((f) => ({ ...f, match_date: maskDate(e.target.value) }))}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            maxLength={10}
          />
        </label>

        <label>
          Placar casa
          <input type="number" value={form.home_score} onChange={field('home_score')} />
        </label>
        <label>
          Placar visitante
          <input type="number" value={form.away_score} onChange={field('away_score')} />
        </label>

        <label className="admin-checkbox-label">
          <input type="checkbox" checked={form.played} onChange={field('played')} />
          Jogo já aconteceu (mostra o placar)
        </label>
        <label className="admin-checkbox-label">
          <input type="checkbox" checked={form.highlight} onChange={field('highlight')} />
          É o próximo jogo (destaque)
        </label>

        <label>
          Ordem
          <input type="number" value={form.sort_order} onChange={field('sort_order')} />
        </label>

        <div className="blog-admin-actions">
          <button type="submit">{form.id ? 'Salvar alterações' : 'Adicionar partida'}</button>
          {form.id && (
            <button type="button" className="is-ghost" onClick={startNew}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="blog-admin-list">
        <h2>Partidas cadastradas</h2>
        {matches.map((match) => (
          <div className="blog-admin-item" key={match.id}>
            <div className="blog-admin-item-info">
              <span className="blog-admin-item-tag">
                {match.match_date} {match.highlight ? '· Próximo jogo' : ''}
              </span>
              <strong>
                {match.home_name} {match.played ? `${match.home_score} x ${match.away_score}` : 'x'} {match.away_name}
              </strong>
            </div>
            <div className="blog-admin-item-actions">
              <button type="button" onClick={() => startEdit(match)}>
                Editar
              </button>
              <button type="button" className="is-danger" onClick={() => handleDelete(match.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
