import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import crest from '../assets/vetorescudo.png'

const BlogCard = forwardRef(function BlogCard({ post, size = 'small', className = '' }, ref) {
  return (
    <Link
      ref={ref}
      to={`/blog/${post.slug}`}
      className={`blog-card blog-card-${size}${className ? ` ${className}` : ''}`}
    >
      <div className="blog-card-photo">
        <img src={post.image_url} alt={post.title} />
      </div>
      <img className="blog-card-crest" src={crest} alt="" aria-hidden="true" />
      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span className="blog-card-tag">
            <span className="blog-card-dot" aria-hidden="true" />
            {post.tag}
          </span>
          <span className="blog-card-author">{post.author}</span>
        </div>
        <h3 className="blog-card-title">{post.title}</h3>
        <span className="blog-card-more">Leia mais</span>
      </div>
    </Link>
  )
})

export default BlogCard
