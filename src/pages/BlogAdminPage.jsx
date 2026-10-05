import { useEffect, useRef, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../lib/api'

const EMPTY_FORM = {
  id: '',
  tag: 'NOVIDADE',
  title: '',
  slug: '',
  excerpt: '',
  body_html: '',
  author: 'PODPAHFUNKBOL',
  published_at: new Date().toISOString().slice(0, 10),
  image_url: '',
  meta_title: '',
  meta_description: '',
  focus_keyword: '',
  status: 'published',
}

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

function seoChecklist(form) {
  const plainBody = stripHtml(form.body_html)
  const wordCount = plainBody.trim().split(/\s+/).filter(Boolean).length
  const keyword = form.focus_keyword.trim().toLowerCase()

  return [
    {
      label: 'Título entre 40 e 60 caracteres',
      pass: form.title.length >= 40 && form.title.length <= 60,
      detail: `${form.title.length} caracteres`,
    },
    {
      label: 'Meta descrição entre 120 e 160 caracteres',
      pass: form.meta_description.length >= 120 && form.meta_description.length <= 160,
      detail: `${form.meta_description.length} caracteres`,
    },
    {
      label: 'Palavra-chave no título',
      pass: !!keyword && form.title.toLowerCase().includes(keyword),
      detail: keyword ? '' : 'defina uma palavra-chave',
    },
    {
      label: 'Palavra-chave no texto',
      pass: !!keyword && plainBody.toLowerCase().includes(keyword),
      detail: keyword ? '' : 'defina uma palavra-chave',
    },
    {
      label: 'Palavra-chave no slug (URL)',
      pass: !!keyword && form.slug.toLowerCase().includes(keyword.replace(/\s+/g, '-')),
      detail: keyword ? '' : 'defina uma palavra-chave',
    },
    {
      label: 'Texto com pelo menos 300 palavras',
      pass: wordCount >= 300,
      detail: `${wordCount} palavras`,
    },
    {
      label: 'Imagem de destaque definida',
      pass: !!form.image_url,
      detail: '',
    },
  ]
}

function RichTextToolbar({ onCommand }) {
  const buttons = [
    { cmd: 'bold', label: 'B' },
    { cmd: 'italic', label: 'I' },
    { cmd: 'formatBlock:h2', label: 'H2' },
    { cmd: 'formatBlock:h3', label: 'H3' },
    { cmd: 'insertUnorderedList', label: '• Lista' },
    { cmd: 'createLink', label: 'Link' },
    { cmd: 'formatBlock:p', label: 'Parágrafo' },
  ]

  return (
    <div className="admin-richtext-toolbar">
      {buttons.map((btn) => (
        <button key={btn.label} type="button" onClick={() => onCommand(btn.cmd)}>
          {btn.label}
        </button>
      ))}
    </div>
  )
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef(null)

  function load() {
    apiGet('/blog_posts.php')
      .then(setPosts)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function startNew() {
    setForm(EMPTY_FORM)
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  function startEdit(post) {
    setForm({
      ...EMPTY_FORM,
      ...post,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      focus_keyword: post.focus_keyword || '',
    })
    if (editorRef.current) editorRef.current.innerHTML = post.body_html || ''
  }

  function handleEditorInput() {
    setForm((f) => ({ ...f, body_html: editorRef.current.innerHTML }))
  }

  function handleCommand(cmd) {
    editorRef.current.focus()
    if (cmd.startsWith('formatBlock:')) {
      document.execCommand('formatBlock', false, cmd.split(':')[1])
    } else if (cmd === 'createLink') {
      const url = prompt('URL do link:')
      if (url) document.execCommand('createLink', false, url)
    } else {
      document.execCommand(cmd, false, null)
    }
    handleEditorInput()
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await apiUpload(file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.image_url) {
      alert('Preencha ao menos o título e uma imagem.')
      return
    }
    if (form.id) {
      await apiPut(`/blog_posts.php?id=${form.id}`, form)
    } else {
      await apiPost('/blog_posts.php', form)
    }
    startNew()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir essa notícia?')) return
    await apiDelete(`/blog_posts.php?id=${id}`)
    load()
  }

  if (loading) return <p>Carregando...</p>

  const checklist = seoChecklist(form)

  return (
    <div className="blog-admin-layout admin-blog-layout">
      <form className="blog-admin-form" onSubmit={handleSubmit}>
        <h2>{form.id ? 'Editar notícia' : 'Nova notícia'}</h2>

        <label>
          Categoria
          <input value={form.tag} onChange={field('tag')} placeholder="NOVIDADE" />
        </label>

        <label>
          Título
          <input value={form.title} onChange={field('title')} required />
        </label>

        <label>
          Slug (URL) — deixe vazio para gerar a partir do título
          <input value={form.slug} onChange={field('slug')} placeholder="minha-noticia" />
        </label>

        <label>
          Resumo (aparece na página da notícia)
          <textarea value={form.excerpt} onChange={field('excerpt')} rows={2} />
        </label>

        <label>Texto completo</label>
        <RichTextToolbar onCommand={handleCommand} />
        <div
          ref={editorRef}
          className="admin-richtext-editor"
          contentEditable
          onInput={handleEditorInput}
          suppressContentEditableWarning
        />

        <label>
          Autor
          <input value={form.author} onChange={field('author')} />
        </label>

        <label>
          Data
          <input type="date" value={form.published_at} onChange={field('published_at')} />
        </label>

        <label>
          Imagem
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>

        {form.image_url && (
          <div className="blog-admin-preview">
            <img src={form.image_url} alt="Pré-visualização" />
          </div>
        )}

        <h3 className="admin-seo-title">SEO</h3>
        <label>
          Título para o Google (meta title)
          <input value={form.meta_title} onChange={field('meta_title')} />
        </label>
        <label>
          Descrição para o Google (meta description)
          <textarea value={form.meta_description} onChange={field('meta_description')} rows={2} />
        </label>
        <label>
          Palavra-chave principal
          <input value={form.focus_keyword} onChange={field('focus_keyword')} />
        </label>

        <div className="admin-seo-checklist">
          {checklist.map((item) => (
            <div key={item.label} className={`admin-seo-item ${item.pass ? 'is-pass' : 'is-fail'}`}>
              <span>{item.pass ? '✓' : '✕'}</span> {item.label} {item.detail && <em>({item.detail})</em>}
            </div>
          ))}
        </div>

        <div className="blog-admin-actions">
          <button type="submit" disabled={uploading}>
            {form.id ? 'Salvar alterações' : 'Publicar notícia'}
          </button>
          {form.id && (
            <button type="button" className="is-ghost" onClick={startNew}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="blog-admin-list">
        <h2>Notícias publicadas</h2>
        {posts.map((post) => (
          <div className="blog-admin-item" key={post.id}>
            <img src={post.image_url} alt="" />
            <div className="blog-admin-item-info">
              <span className="blog-admin-item-tag">{post.tag}</span>
              <strong>{post.title}</strong>
            </div>
            <div className="blog-admin-item-actions">
              <button type="button" onClick={() => startEdit(post)}>
                Editar
              </button>
              <button type="button" className="is-danger" onClick={() => handleDelete(post.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
