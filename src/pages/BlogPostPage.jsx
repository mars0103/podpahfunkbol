import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet } from '../lib/api'
import { WhatsappIcon, InstagramIcon, FacebookIcon, XIcon } from '../components/icons'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet(`/blog_posts.php?slug=${encodeURIComponent(slug)}`)
      .then((data) => {
        setPost(data)
        return apiGet('/blog_posts.php')
      })
      .then((all) => setRelated(all.filter((p) => p.slug !== slug).slice(0, 3)))
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return null

  if (!post) {
    return (
      <div className="blog-post-notfound">
        <h1>Notícia não encontrada</h1>
        <Link to="/">Voltar para a home</Link>
      </div>
    )
  }

  return (
    <article className="blog-post">
      <div className="blog-post-body">
        <nav className="blog-post-breadcrumb" aria-label="Caminho">
          <Link to="/">Início</Link>
          <span>—</span>
          <span>Notícias</span>
          <span>—</span>
          <span>{post.tag}</span>
        </nav>

        <span className="blog-post-tag">{post.tag}</span>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}

        <div className="blog-post-byline">
          <span>
            Por <strong>{post.author}</strong> em {formatDate(post.published_at)}
          </span>
        </div>

        <div className="blog-post-share">
          <span>COMPARTILHE</span>
          <div className="blog-post-share-icons">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no WhatsApp"
            >
              <WhatsappIcon />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
              <XIcon />
            </a>
          </div>
        </div>

        {post.image_url && (
          <div className="blog-post-image">
            <img src={post.image_url} alt={post.title} />
          </div>
        )}

        <div className="blog-post-text" dangerouslySetInnerHTML={{ __html: post.body_html }} />

        <Link to="/" className="blog-post-back">
          ← Voltar para a home
        </Link>
      </div>

      {related.length > 0 && (
        <div className="blog-post-related">
          <h2>Leia também</h2>
          <div className="blog-post-related-grid">
            {related.map((p) => (
              <Link to={`/blog/${p.slug}`} key={p.id} className="blog-post-related-card">
                <img src={p.image_url} alt={p.title} />
                <span>{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
