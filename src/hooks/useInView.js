import { useCallback, useEffect, useRef, useState } from 'react'

export function useInView(options = { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) {
  const [el, setEl] = useState(null)
  const [visible, setVisible] = useState(false)
  const optionsRef = useRef(options)

  const setRef = useCallback((node) => setEl(node), [])

  useEffect(() => {
    if (!el) return undefined

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        io.disconnect()
      }
    }, optionsRef.current)

    io.observe(el)
    return () => io.disconnect()
  }, [el])

  return [setRef, visible]
}
