import texturaUrl from '../assets/textura.svg'

export default function PageIntro({ eyebrow, title, children }) {
  return (
    <section className="page-intro">
      <div
        className="page-intro-texture"
        style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
        aria-hidden="true"
      />
      <div className="page-intro-body">
        {eyebrow && <span className="page-intro-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </section>
  )
}
