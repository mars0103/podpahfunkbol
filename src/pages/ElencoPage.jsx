import PageIntro from '../components/PageIntro'
import ElencoRoster from '../components/ElencoRoster'

export default function ElencoPage() {
  return (
    <>
      <PageIntro eyebrow="Temporada 2026" title="NOSSO ELENCO">
        Conheça quem veste a camisa do Podpah Funkbol Clube.
      </PageIntro>

      <section className="elenco-page-content">
        <ElencoRoster />
      </section>
    </>
  )
}
