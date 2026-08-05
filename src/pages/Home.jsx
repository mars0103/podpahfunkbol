import Hero from '../components/Hero'
import TapeMarquee from '../components/TapeMarquee'
import MatchTicker from '../components/MatchTicker'
import PartnerBanner from '../components/PartnerBanner'
import PartnerLogos from '../components/PartnerLogos'
import Elenco from '../components/Elenco'
import Shorts from '../components/Shorts'
import News from '../components/News'
import Reveal from '../components/Reveal'

export default function Home() {
  return (
    <>
      <Hero />

      <Reveal from="up">
        <TapeMarquee />
      </Reveal>

      <Reveal from="left">
        <MatchTicker />
      </Reveal>

      <Reveal from="right">
        <PartnerBanner />
      </Reveal>

      <div className="elenco-overlap-wrap">
        <PartnerLogos />
        <Elenco />
      </div>

      <Reveal from="up">
        <Shorts />
      </Reveal>

      <Reveal from="left">
        <News />
      </Reveal>
    </>
  )
}
