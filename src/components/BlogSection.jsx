import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BlogCard from './BlogCard'
import { apiGet } from '../lib/api'
import { useInView } from '../hooks/useInView'

function useReveal(from) {
  const [ref, visible] = useInView()
  return { ref, className: `reveal reveal-${from}${visible ? ' is-visible' : ''}` }
}

export default function BlogSection() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    apiGet('/blog_posts.php')
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [])

  const bigReveal = useReveal('in')
  const mediumReveal = useReveal('up')
  const smallAReveal = useReveal('up')
  const smallBReveal = useReveal('up')

  const [big, medium, ...rest] = posts
  const smalls = rest.slice(0, 2)

  if (!big) return null

  return (
    <section className="blog-section" id="noticias" aria-label="Últimas notícias">
      <div className="blog-collage">
        <BlogCard
          post={big}
          size="big"
          ref={bigReveal.ref}
          className={`blog-card-slot-big ${bigReveal.className}`}
        />
        {medium && (
          <BlogCard
            post={medium}
            size="medium"
            ref={mediumReveal.ref}
            className={`blog-card-overlap ${mediumReveal.className}`}
          />
        )}
        {smalls[0] && (
          <BlogCard
            post={smalls[0]}
            size="small"
            ref={smallAReveal.ref}
            className={`blog-card-slot-small-a ${smallAReveal.className}`}
          />
        )}
        {smalls[1] && (
          <BlogCard
            post={smalls[1]}
            size="small"
            ref={smallBReveal.ref}
            className={`blog-card-slot-small-b ${smallBReveal.className}`}
          />
        )}
      </div>

      <Link to="/admin/blog" className="blog-admin-link">
        Painel de notícias
      </Link>
    </section>
  )
}
