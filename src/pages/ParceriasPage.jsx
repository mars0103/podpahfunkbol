import PageIntro from '../components/PageIntro'
import PartnerBanner from '../components/PartnerBanner'
import PartnerLogos from '../components/PartnerLogos'
import logo99 from '../assets/logosparceiros/99.svg'
import logoPhilips from '../assets/logosparceiros/philips.webp'
import logoAlpha from '../assets/logosparceiros/alphaconsorcio.png'

const PARTNERS = [
  {
    id: '99',
    logo: logo99,
    title: '99',
    description:
      'Parceira oficial de mobilidade e entregas do clube. Quem corre junto soma — a marca do Funkbol estampada nas bolsas térmicas de entregadores por todo o Brasil.',
  },
  {
    id: 'philips',
    logo: logoPhilips,
    title: 'Philips',
    description: 'Parceira oficial de tecnologia e eletrônicos do Podpah Funkbol Clube.',
  },
  {
    id: 'alpha-consorcio',
    logo: logoAlpha,
    title: 'Alpha Consórcio',
    description: 'Parceira oficial de consórcios do Podpah Funkbol Clube.',
  },
]

export default function ParceriasPage() {
  return (
    <>
      <PageIntro eyebrow="Quem corre junto soma" title="PARCERIAS">
        As marcas que impulsionam o Podpah Funkbol Clube dentro e fora de campo.
      </PageIntro>

      <PartnerBanner />
      <PartnerLogos />

      <section className="partners-detail-wrap">
        <div className="partners-detail">
          {PARTNERS.map((partner) => (
            <article className="partner-detail-card" key={partner.id}>
              <img src={partner.logo} alt={partner.title} />
              <p>{partner.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
