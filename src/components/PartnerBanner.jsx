import partnerBanner from '../assets/banner-partner.png'

export default function PartnerBanner() {
  return (
    <section className="partner-banner" id="parcerias" aria-label="Parceria oficial">
      <div className="partner-banner-frame">
        <img src={partnerBanner} alt="Parceria oficial 99 — Quem corre junto soma" />
      </div>
      <div className="partner-banner-dots" aria-hidden="true">
        <span className="is-active" />
        <span />
      </div>
    </section>
  )
}
