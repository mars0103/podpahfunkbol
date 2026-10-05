import HeroV2 from '../components/HeroV2'
import TapeMarquee from '../components/TapeMarquee'
import BlogSection from '../components/BlogSection'
import Elenco from '../components/Elenco'
import PartnerBanner from '../components/PartnerBanner'
import PartnerLogos from '../components/PartnerLogos'
import Shorts from '../components/Shorts'

export default function Home() {
  return (
    <>
      <HeroV2 />
      <TapeMarquee />
      <BlogSection />
      <Elenco />
      <PartnerBanner />
      <PartnerLogos />
      <Shorts />
    </>
  )
}
