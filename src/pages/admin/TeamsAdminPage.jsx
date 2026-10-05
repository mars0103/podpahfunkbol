import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../../lib/api'

const EMPTY_FORM = { id: '', name: '', crest_url: '' }

export default function TeamsAdminPage() {
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  function load() {
    apiGet('/teams.php')
      .then(setTeams)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCrestUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await apiUpload(file)
      setForm((f) => ({ ...f, crest_url: url }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('Preencha o nome do time.')
      return
    }
    if (form.id) {
      await apiPut(`/teams.php?id=${form.id}`, form)
    } else {
      await apiPost('/teams.php', form)
    }
    setForm(EMPTY_FORM)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esse time? Partidas e a tabela que já usam ele mantêm o nome/escudo salvo.')) return
    await apiDelete(`/teams.php?id=${id}`)
    load()
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="blog-admin-layout">
      <form className="blog-admin-form" onSubmit={handleSubmit}>
        <h2>{form.id ? 'Editar time' : 'Novo time'}</h2>
        <p className="blog-admin-note">
          Cadastre cada time uma vez aqui. Nas telas de Próximos Jogos e Tabela, você só precisa escolher o time
          numa lista — o escudo vem junto automaticamente.
        </p>

        <label>
          Nome do time
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label>
          Escudo
          <input type="file" accept="image/*" onChange={handleCrestUpload} />
        </label>
        {form.crest_url && (
          <div className="blog-admin-preview">
            <img src={form.crest_url} alt="" />
          </div>
        )}

        <div className="blog-admin-actions">
          <button type="submit" disabled={uploading}>
            {form.id ? 'Salvar alterações' : 'Adicionar time'}
          </button>
          {form.id && (
            <button type="button" className="is-ghost" onClick={() => setForm(EMPTY_FORM)}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="blog-admin-list">
        <h2>Times cadastrados</h2>
        {teams.map((team) => (
          <div className="blog-admin-item" key={team.id}>
            {team.crest_url && <img src={team.crest_url} alt="" />}
            <div className="blog-admin-item-info">
              <strong>{team.name}</strong>
            </div>
            <div className="blog-admin-item-actions">
              <button type="button" onClick={() => setForm(team)}>
                Editar
              </button>
              <button type="button" className="is-danger" onClick={() => handleDelete(team.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
