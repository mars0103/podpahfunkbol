import { useEffect, useState } from 'react'

export default function useGameOrientation() {
  const query = '(any-pointer: coarse) and (orientation: portrait)'
  const [portrait, setPortrait] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setPortrait(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return portrait
}
