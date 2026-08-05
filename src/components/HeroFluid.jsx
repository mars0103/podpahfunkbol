import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fluidFragmentShader = `
  uniform sampler2D uPrevTrails;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform float uDecay;
  uniform bool uIsMoving;
  varying vec2 vUv;

  void main() {
    vec4 prevState = texture2D(uPrevTrails, vUv);
    float newValue = prevState.r * uDecay;

    if (uIsMoving) {
      vec2 mouseDirection = uMouse - uPrevMouse;
      float lineLength = length(mouseDirection);

      if (lineLength > 0.001) {
        vec2 mouseDir = mouseDirection / lineLength;
        vec2 toPixel = vUv - uPrevMouse;
        float projAlong = dot(toPixel, mouseDir);
        projAlong = clamp(projAlong, 0.0, lineLength);
        vec2 closestPoint = uPrevMouse + projAlong * mouseDir;
        float dist = length(vUv - closestPoint);
        float intensity = smoothstep(0.16, 0.0, dist) * 0.34;
        newValue += intensity;
      }
    }

    gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
  }
`

const displayFragmentShader = `
  uniform sampler2D uFluid;
  uniform sampler2D uTopTexture;
  uniform sampler2D uBottomTexture;
  uniform vec2 uResolution;
  uniform vec2 uTopSize;
  uniform vec2 uBottomSize;
  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    if (textureSize.x < 1.0 || textureSize.y < 1.0) return uv;
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  void main() {
    float fluid = texture2D(uFluid, vUv).r;
    float reveal = smoothstep(0.02, 0.06, fluid);

    vec4 topColor    = texture2D(uTopTexture,    getCoverUV(vUv, uTopSize));
    vec4 bottomColor = texture2D(uBottomTexture, getCoverUV(vUv, uBottomSize));

    gl_FragColor = mix(topColor, bottomColor, reveal);
  }
`

function loadTexture(url, sizeVec) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      sizeVec.set(img.naturalWidth, img.naturalHeight)
      const tex = new THREE.Texture(img)
      tex.needsUpdate = true
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      resolve(tex)
    }
    img.src = url
  })
}

function initFluid({ canvas, topTex, bottomTex, topSize, bottomSize, getW, getH }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setSize(getW(), getH(), false)
  renderer.setPixelRatio(dpr)

  const scene = new THREE.Scene()
  const simScene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const mouse = new THREE.Vector2(0.5, 0.35)
  const prevMouse = new THREE.Vector2(0.5, 0.35)
  let isMoving = false
  let lastMoveTime = 0
  let currentTarget = 0
  let frameId = 0

  const rtOpts = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  }
  const pingPong = [new THREE.WebGLRenderTarget(900, 900, rtOpts), new THREE.WebGLRenderTarget(900, 900, rtOpts)]

  const trailsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPrevTrails: { value: null },
      uMouse: { value: mouse },
      uPrevMouse: { value: prevMouse },
      uDecay: { value: 0.965 },
      uIsMoving: { value: false },
    },
    vertexShader,
    fragmentShader: fluidFragmentShader,
  })

  const displayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uFluid: { value: null },
      uTopTexture: { value: topTex },
      uBottomTexture: { value: bottomTex },
      uResolution: { value: new THREE.Vector2(getW(), getH()) },
      uTopSize: { value: topSize },
      uBottomSize: { value: bottomSize },
    },
    vertexShader,
    fragmentShader: displayFragmentShader,
  })

  const geometry = new THREE.PlaneGeometry(2, 2)
  scene.add(new THREE.Mesh(geometry, displayMaterial))
  simScene.add(new THREE.Mesh(geometry, trailsMaterial))

  renderer.setRenderTarget(pingPong[0])
  renderer.clear()
  renderer.setRenderTarget(pingPong[1])
  renderer.clear()
  renderer.setRenderTarget(null)

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    prevMouse.copy(mouse)
    mouse.x = (clientX - rect.left) / rect.width
    mouse.y = 1 - (clientY - rect.top) / rect.height
    isMoving = true
    lastMoveTime = performance.now()
  }

  function onPointerMove(e) {
    updatePointer(e.clientX, e.clientY)
  }
  function onTouchMove(e) {
    if (!e.touches.length) return
    updatePointer(e.touches[0].clientX, e.touches[0].clientY)
  }
  function onResize() {
    const w = getW()
    const h = getH()
    renderer.setSize(w, h, false)
    displayMaterial.uniforms.uResolution.value.set(w, h)
  }

  // Intro sweep so the reveal is visible before any pointer interaction.
  let introFrame = 0
  const introDuration = 90
  const introPath = [
    [0.12, 0.75],
    [0.5, 0.42],
    [0.88, 0.72],
    [0.5, 0.28],
  ]

  function runIntro() {
    if (introFrame > introDuration) return
    const t = introFrame / introDuration
    const segment = Math.min(Math.floor(t * (introPath.length - 1)), introPath.length - 2)
    const segT = t * (introPath.length - 1) - segment
    const [x0, y0] = introPath[segment]
    const [x1, y1] = introPath[segment + 1]
    prevMouse.copy(mouse)
    mouse.x = x0 + (x1 - x0) * segT
    mouse.y = y0 + (y1 - y0) * segT
    isMoving = true
    lastMoveTime = performance.now()
    introFrame += 1
  }

  function animate() {
    frameId = requestAnimationFrame(animate)

    if (introFrame <= introDuration) {
      runIntro()
    } else if (isMoving && performance.now() - lastMoveTime > 50) {
      isMoving = false
    }

    const prev = pingPong[currentTarget]
    currentTarget = (currentTarget + 1) % 2
    const cur = pingPong[currentTarget]

    trailsMaterial.uniforms.uPrevTrails.value = prev.texture
    trailsMaterial.uniforms.uMouse.value.copy(mouse)
    trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse)
    trailsMaterial.uniforms.uIsMoving.value = isMoving

    renderer.setRenderTarget(cur)
    renderer.render(simScene, camera)

    displayMaterial.uniforms.uFluid.value = cur.texture
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
  }

  const container = canvas.parentElement || canvas
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('resize', onResize)
  animate()

  return function destroy() {
    cancelAnimationFrame(frameId)
    container.removeEventListener('pointermove', onPointerMove)
    container.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('resize', onResize)
    geometry.dispose()
    trailsMaterial.dispose()
    displayMaterial.dispose()
    topTex.dispose()
    bottomTex.dispose()
    pingPong.forEach((rt) => rt.dispose())
    renderer.dispose()
  }
}

export default function HeroFluid({ topSrc, bottomSrc, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let destroy = () => {}

    const topSize = new THREE.Vector2(1, 1)
    const bottomSize = new THREE.Vector2(1, 1)

    Promise.all([loadTexture(topSrc, topSize), loadTexture(bottomSrc, bottomSize)]).then(([topTex, bottomTex]) => {
      if (cancelled) return
      destroy = initFluid({
        canvas,
        topTex,
        bottomTex,
        topSize,
        bottomSize,
        getW: () => canvas.clientWidth || 1,
        getH: () => canvas.clientHeight || 1,
      })
    })

    return () => {
      cancelled = true
      destroy()
    }
  }, [topSrc, bottomSrc])

  return <canvas ref={canvasRef} className={className} />
}
