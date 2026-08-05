import { useRef, useState } from 'react'
import gsap from 'gsap'

export function useRevealBubble() {
  const crestRef = useRef(null)
  const [activePlayer, setActivePlayer] = useState(null)

  function handleReveal(player) {
    setActivePlayer(player)
    if (crestRef.current) {
      gsap
        .timeline()
        .to(crestRef.current, { scale: 1.22, rotate: 10, duration: 0.28, ease: 'back.out(3)' })
        .to(crestRef.current, { scale: 1, rotate: 0, duration: 0.45, ease: 'elastic.out(1, 0.55)' })
    }
  }

  function handleClose() {
    setActivePlayer(null)
  }

  return { crestRef, activePlayer, handleReveal, handleClose }
}
