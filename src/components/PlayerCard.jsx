import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CARD_BACK } from '../data/elenco'

const BRUSH_RADIUS = 46
const REVEAL_THRESHOLD = 0.48
const SAMPLE_W = 50
const SAMPLE_H = 66
const CANVAS_W = 480
const CANVAS_H = 637

let backImagePromise = null
function getBackImage() {
  if (!backImagePromise) {
    backImagePromise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = CARD_BACK
    })
  }
  return backImagePromise
}

export default function PlayerCard({ player, layout, index = 0, onReveal }) {
  const canvasRef = useRef(null)
  const sampleRef = useRef(null)
  const scratchingRef = useRef(false)
  const lastPointRef = useRef(null)
  const revealedRef = useRef(false)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    getBackImage().then((img) => {
      if (cancelled || !canvasRef.current) return
      canvasRef.current.getContext('2d').drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
    })

    const sample = document.createElement('canvas')
    sample.width = SAMPLE_W
    sample.height = SAMPLE_H
    sampleRef.current = sample

    return () => {
      cancelled = true
    }
  }, [])

  function getPoint(e) {
    const canvas = canvasRef.current
    // getBoundingClientRect() on a rotated element (the card is rotated via
    // CSS `--rotate`) returns the axis-aligned box around the rotated shape,
    // not the shape itself — so we un-rotate the pointer around the box
    // center (which rotation doesn't move) using the known angle instead.
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = clientX - centerX
    const dy = clientY - centerY

    const theta = ((layout?.rotate ?? 0) * Math.PI) / 180
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    const localDx = dx * cosT + dy * sinT
    const localDy = -dx * sinT + dy * cosT

    const localWidth = canvas.clientWidth || rect.width
    const localHeight = canvas.clientHeight || rect.height

    return {
      x: ((localDx + localWidth / 2) / localWidth) * canvas.width,
      y: ((localDy + localHeight / 2) / localHeight) * canvas.height,
    }
  }

  function scratchAt(point) {
    const ctx = canvasRef.current.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = BRUSH_RADIUS * 2
    ctx.beginPath()
    const last = lastPointRef.current
    if (last) {
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(point.x, point.y)
    } else {
      ctx.arc(point.x, point.y, BRUSH_RADIUS, 0, Math.PI * 2)
    }
    ctx.stroke()
    ctx.fill()
    lastPointRef.current = point
  }

  function checkProgress() {
    if (revealedRef.current) return
    const canvas = canvasRef.current
    const sample = sampleRef.current
    const sctx = sample.getContext('2d')
    sctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H)
    sctx.drawImage(canvas, 0, 0, SAMPLE_W, SAMPLE_H)
    const data = sctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data

    let cleared = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 40) cleared += 1
    }

    if (cleared / (SAMPLE_W * SAMPLE_H) > REVEAL_THRESHOLD) {
      revealedRef.current = true
      gsap.to(canvasRef.current, {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        onComplete: () => {
          setIsRevealed(true)
          onReveal?.(player)
        },
      })
    }
  }

  function handleDown(e) {
    if (revealedRef.current) return
    e.preventDefault()
    scratchingRef.current = true
    lastPointRef.current = null
    scratchAt(getPoint(e))
  }
  function handleMove(e) {
    if (!scratchingRef.current || revealedRef.current) return
    e.preventDefault()
    scratchAt(getPoint(e))
  }
  function handleUp() {
    if (!scratchingRef.current) return
    scratchingRef.current = false
    lastPointRef.current = null
    checkProgress()
  }

  const style = layout
    ? {
        top: `${layout.top}%`,
        left: `${layout.left}%`,
        '--rotate': `${layout.rotate}deg`,
        '--float-delay': `${(index % 5) * 0.35}s`,
      }
    : undefined

  return (
    <div className={`player-card${isRevealed ? ' is-revealed' : ''}`} style={style}>
      <div className="player-card-face player-card-front">
        <img src={player.front} alt={player.name} />
        {isRevealed && <span className="player-card-holo" aria-hidden="true" />}
      </div>

      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="player-card-canvas"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      )}
    </div>
  )
}
