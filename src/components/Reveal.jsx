import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, from = 'up', className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const clipsX = from === 'left' || from === 'right'

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={`reveal-clip${clipsX ? ' reveal-clip-x' : ''}`} ref={ref}>
      <div className={`reveal reveal-${from}${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}>
        {children}
      </div>
    </div>
  )
}
