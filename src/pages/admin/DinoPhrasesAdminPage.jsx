import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'

const DEFAULT_HEADING = 'E aí meu parceiro!'

export default function DinoPhrasesAdminPage() {
  const [phrases, setPhrases] = useState([])
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState({})

  function load() {
    apiGet('/dino_phrases.php')
      .then((data) => {
        setPhrases(data)
        setEdits(Object.fromEntries(data.map((p) => [p.id, { heading: p.heading, text: p.text }])))
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    await apiPost('/dino_phrases.php', {
      heading: heading.trim() || DEFAULT_HEADING,
      text,
      sort_order: phrases.length + 1,
      is_active: true,
    })
    setHeading(DEFAULT_HEADING)
    setText('')
    load()
  }

  function editField(id, key) {
    return (e) => {
      setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: e.target.value } }))
    }
  }

  async function handleSave(phrase) {
    const edit = edits[phrase.id]
    await apiPut(`/dino_phrases.php?id=${phrase.id}`, { ...phrase, ...edit })
    load()
  }

  async function toggleActive(phrase) {
    await apiPut(`/dino_phrases.php?id=${phrase.id}`, { ...phrase, is_active: !phrase.is_active })
    load()
  }

  async function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= phrases.length) return
    const a = phrases[index]
    const b = phrases[target]
    await apiPut(`/dino_phrases.php?id=${a.id}`, { ...a, sort_order: b.sort_order })
    await apiPut(`/dino_phrases.php?id=${b.id}`, { ...b, sort_order: a.sort_order })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir essa frase?')) return
    await apiDelete(`/dino_phrases.php?id=${id}`)
    load()
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="blog-admin-list">
      <h2>Frases do dino (balão da home)</h2>
      <p className="blog-admin-note">
        Só as frases marcadas como ativas aparecem no balão de fala do dino, na ordem mostrada abaixo. Cada
        frase tem a linha rosa de destaque e a linha de texto abaixo.
      </p>

      <form className="admin-dino-form" onSubmit={handleAdd}>
        <label>
          Linha em destaque (rosa)
          <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="E aí meu parceiro!" />
        </label>
        <label>
          Texto da frase
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nova frase do dino" />
        </label>
        <button type="submit">Adicionar</button>
      </form>

      {phrases.map((phrase, index) => (
        <div className="blog-admin-item admin-dino-item" key={phrase.id}>
          <div className="blog-admin-item-info admin-dino-item-fields">
            <input
              value={edits[phrase.id]?.heading ?? ''}
              onChange={editField(phrase.id, 'heading')}
              placeholder="Linha em destaque (rosa)"
              className="admin-dino-heading-input"
            />
            <input
              value={edits[phrase.id]?.text ?? ''}
              onChange={editField(phrase.id, 'text')}
              placeholder="Texto da frase"
            />
          </div>
          <div className="blog-admin-item-actions">
            <button type="button" onClick={() => handleSave(phrase)}>
              Salvar
            </button>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>
              ↑
            </button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === phrases.length - 1}>
              ↓
            </button>
            <button type="button" onClick={() => toggleActive(phrase)}>
              {Number(phrase.is_active) ? 'Ativa' : 'Inativa'}
            </button>
            <button type="button" className="is-danger" onClick={() => handleDelete(phrase.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
