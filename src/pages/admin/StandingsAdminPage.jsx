import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'

const EMPTY_FORM = {
  id: '',
  position: '',
  team_name: '',
  crest_url: '',
  wd: '0-0',
  gp: 0,
  gc: 0,
  sg: 0,
}

export default function StandingsAdminPage() {
  const [rows, setRows] = useState([])
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)

  function load() {
    Promise.all([apiGet('/standings.php'), apiGet('/teams.php')])
      .then(([s, t]) => {
        setRows(s)
        setTeams(t)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function handleTeamChange(e) {
    const team = teams.find((t) => t.name === e.target.value)
    setForm((f) => ({ ...f, team_name: e.target.value, crest_url: team?.crest_url || '' }))
  }

  function startNew() {
    setForm({ ...EMPTY_FORM, position: rows.length + 1 })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.team_name.trim()) {
      alert('Escolha o time.')
      return
    }
    if (form.id) {
      await apiPut(`/standings.php?id=${form.id}`, form)
    } else {
      await apiPost('/standings.php', form)
    }
    startNew()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esse time da tabela?')) return
    await apiDelete(`/standings.php?id=${id}`)
    load()
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="blog-admin-layout">
      <form className="blog-admin-form" onSubmit={handleSubmit}>
        <h2>{form.id ? 'Editar time' : 'Novo time na tabela'}</h2>

        {teams.length === 0 && (
          <p className="blog-admin-note">
            Nenhum time cadastrado ainda. <Link to="/admin/times">Cadastre os times primeiro</Link>.
          </p>
        )}

        <label>
          Posição
          <input type="number" value={form.position} onChange={field('position')} />
        </label>
        <label>
          Time
          <select value={form.team_name} onChange={handleTeamChange}>
            <option value="">Selecione...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {form.crest_url && (
          <div className="blog-admin-preview">
            <img src={form.crest_url} alt="" />
          </div>
        )}
        <label>
          V-D
          <input value={form.wd} onChange={field('wd')} placeholder="7-2" />
        </label>
        <label>
          GP
          <input type="number" value={form.gp} onChange={field('gp')} />
        </label>
        <label>
          GC
          <input type="number" value={form.gc} onChange={field('gc')} />
        </label>
        <label>
          SG
          <input type="number" value={form.sg} onChange={field('sg')} />
        </label>

        <div className="blog-admin-actions">
          <button type="submit">{form.id ? 'Salvar alterações' : 'Adicionar time'}</button>
          {form.id && (
            <button type="button" className="is-ghost" onClick={startNew}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="blog-admin-list">
        <h2>Classificação atual</h2>
        {rows.map((row) => (
          <div className="blog-admin-item" key={row.id}>
            <div className="blog-admin-item-info">
              <span className="blog-admin-item-tag">{row.position}º lugar</span>
              <strong>{row.team_name}</strong>
            </div>
            <div className="blog-admin-item-actions">
              <button type="button" onClick={() => setForm(row)}>
                Editar
              </button>
              <button type="button" className="is-danger" onClick={() => handleDelete(row.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
