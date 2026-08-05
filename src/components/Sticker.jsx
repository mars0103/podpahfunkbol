import StickerPeel from './StickerPeel'

export default function Sticker({ image, corner = 'top-right', size = 130, rotate = 8 }) {
  return (
    <div className={`sticker-slot sticker-slot-${corner}`}>
      <StickerPeel
        imageSrc={image}
        width={size}
        rotate={rotate}
        peelBackHoverPct={30}
        peelBackActivePct={40}
        shadowIntensity={0.5}
        lightingIntensity={0.15}
        peelDirection={0}
      />
    </div>
  )
}
