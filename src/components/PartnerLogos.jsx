import DriftWall from './DriftWall'
import logo99 from '../assets/logosparceiros/99.svg'
import logoPodpah from '../assets/logosparceiros/PODPAH.svg'
import logoSuperbet from '../assets/logosparceiros/SUPERBET.svg'

const ITEMS = [
  { image: logo99, title: '99', color: '#b3130e' },
  { image: logoSuperbet, title: 'Superbet', color: '#b3130e' },
  { image: logoPodpah, title: 'Podpah', color: '#f5ba00' },
  { image: logoSuperbet, title: 'Superbet', color: '#b3130e' },
  { image: logo99, title: '99', color: '#b3130e' },
]

export default function PartnerLogos() {
  return (
    <section className="partner-logos" aria-label="Parceiros oficiais">
      <h2 className="partner-logos-title">NOSSOS PARCEIROS</h2>
      <div className="partner-logos-wall">
        <DriftWall
          items={ITEMS}
          columns={5}
          tileWidth={180}
          tileHeight={110}
          gap={18}
          tilt={16}
          turn={-14}
          perspective={1200}
          depth={120}
          speed={30}
          direction="up"
          variance={0.45}
          parallax={0.5}
          lift={54}
          fade={0.6}
          dim={0.92}
          overlayColor="#3c1361"
          radius={14}
          roll={0}
          pauseOnHover
          grayscale={false}
        />
      </div>
    </section>
  )
}
