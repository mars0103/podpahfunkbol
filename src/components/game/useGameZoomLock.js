import { useEffect } from 'react'

export default function useGameZoomLock() {
  useEffect(() => {
    if (!window.matchMedia('(any-pointer: coarse)').matches) return
    const viewport = document.querySelector('meta[name="viewport"]')
    const original = viewport?.getAttribute('content')
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    const prevent = event => { if (event.cancelable) event.preventDefault() }
    const preventPinch = event => { if (event.touches.length > 1) prevent(event) }
    // Safari gesture events supplement touch-action without swallowing control presses.
    document.addEventListener('gesturestart', prevent, { passive: false })
    document.addEventListener('gesturechange', prevent, { passive: false })
    document.addEventListener('touchmove', preventPinch, { passive: false })
    document.addEventListener('dblclick', prevent, { passive: false })
    return () => {
      if (viewport) {
        if (original === null) viewport.removeAttribute('content')
        else viewport.setAttribute('content', original)
      }
      document.removeEventListener('gesturestart', prevent)
      document.removeEventListener('gesturechange', prevent)
      document.removeEventListener('touchmove', preventPinch)
      document.removeEventListener('dblclick', prevent)
    }
  }, [])
}
