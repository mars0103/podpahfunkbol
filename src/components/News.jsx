import { NEWS, INSTAGRAM_URL } from '../data/news'
import { InstagramIcon } from './icons'
import Sticker from './Sticker'
import adesivo99 from '../assets/adesivos/adesivo 99.png'

export default function News() {
  return (
    <section className="news" id="noticias" aria-label="Últimas notícias">
      <div className="news-head">
        <h2>ÚLTIMAS NOTÍCIAS</h2>
        <a className="news-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
          <InstagramIcon className="icon" />
          Seguir @podpahfunkbolclube
        </a>
      </div>

      <div className="news-grid">
        {NEWS.map((item) => (
          <article className="news-card" key={item.id}>
            <div className="news-card-image">
              <img src={item.image} alt="" />
            </div>
            <div className="news-card-body">
              <span className="news-card-tag">
                {item.tag} · {item.date}
              </span>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
            </div>
          </article>
        ))}
      </div>

      <Sticker image={adesivo99} corner="bottom-right" size={120} rotate={10} />
    </section>
  )
}
