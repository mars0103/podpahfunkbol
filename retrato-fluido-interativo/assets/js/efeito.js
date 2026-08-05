/* Império WEB Codes Store | marsdesigner.com.br/codesstore */

import * as THREE from 'https://esm.sh/three@0.180.0';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

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
        float intensity = smoothstep(0.105, 0.0, dist) * 0.34;
        newValue += intensity;
      }
    }

    gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
  }
`;

const displayFragmentShader = `
  uniform sampler2D uFluid;
  uniform sampler2D uTopTexture;
  uniform sampler2D uBottomTexture;
  uniform vec2 uResolution;
  uniform float uDpr;
  uniform vec2 uPointer;
  uniform vec2 uTopTextureSize;
  uniform vec2 uBottomTextureSize;
  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    if (textureSize.x < 1.0 || textureSize.y < 1.0) return uv;
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  vec2 getParallaxUV(vec2 uv) {
    return uv + (uPointer - 0.5) * 0.026;
  }

  void main() {
    float fluid = texture2D(uFluid, vUv).r;
    float reveal = smoothstep(0.02, 0.02 + 0.004 / uDpr, fluid);

    vec2 parallaxUV = getParallaxUV(vUv);
    vec4 topColor    = texture2D(uTopTexture,    getCoverUV(parallaxUV, uTopTextureSize));
    vec4 bottomColor = texture2D(uBottomTexture, getCoverUV(parallaxUV, uBottomTextureSize));

    vec4 imageColor = mix(topColor, bottomColor, reveal);
    imageColor.rgb = pow(imageColor.rgb, vec3(0.95));
    imageColor.rgb = min(imageColor.rgb * 1.02 + 0.005, vec3(1.0));

    gl_FragColor = imageColor;
  }
`;

function createPlaceholderTexture(hexColor) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

function loadTexture(url, sizeVec, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    sizeVec.set(img.width, img.height);
    const t = new THREE.Texture(img);
    t.needsUpdate = true;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    callback(t);
  };
  img.src = url;
}

export function initPortraitReveal({ canvas, topSrc, bottomSrc }) {
  const dpr = Math.min(window.devicePixelRatio, 2);

  const getW = () => canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
  const getH = () => canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, precision: 'highp', premultipliedAlpha: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(getW(), getH());
  renderer.setPixelRatio(dpr);

  const scene    = new THREE.Scene();
  const simScene = new THREE.Scene();
  const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mouse        = new THREE.Vector2(0.5, 0.5);
  const prevMouse    = new THREE.Vector2(0.5, 0.5);
  const pointer      = new THREE.Vector2(0.5, 0.5);
  const smoothPointer = new THREE.Vector2(0.5, 0.5);
  let isMoving = false;
  let lastMoveTime = 0;
  let currentTarget = 0;
  let frameId = 0;

  const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType };
  const pingPong = [new THREE.WebGLRenderTarget(600, 600, rtOpts), new THREE.WebGLRenderTarget(600, 600, rtOpts)];

  const topTextureSize    = new THREE.Vector2(1, 1);
  const bottomTextureSize = new THREE.Vector2(1, 1);

  const trailsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPrevTrails: { value: null },
      uMouse:      { value: mouse },
      uPrevMouse:  { value: prevMouse },
      uDecay:      { value: 0.97 },
      uIsMoving:   { value: false },
    },
    vertexShader,
    fragmentShader: fluidFragmentShader,
  });

  const displayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uFluid:           { value: null },
      uTopTexture:      { value: createPlaceholderTexture('#111111') },
      uBottomTexture:   { value: createPlaceholderTexture('#333333') },
      uResolution:      { value: new THREE.Vector2(getW(), getH()) },
      uDpr:             { value: dpr },
      uPointer:         { value: smoothPointer },
      uTopTextureSize:  { value: topTextureSize },
      uBottomTextureSize: { value: bottomTextureSize },
    },
    vertexShader,
    fragmentShader: displayFragmentShader,
  });

  loadTexture(topSrc,    topTextureSize,    (t) => { displayMaterial.uniforms.uTopTexture.value = t; });
  loadTexture(bottomSrc, bottomTextureSize, (t) => { displayMaterial.uniforms.uBottomTexture.value = t; });

  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, displayMaterial));
  simScene.add(new THREE.Mesh(geometry, trailsMaterial));

  renderer.setRenderTarget(pingPong[0]); renderer.clear();
  renderer.setRenderTarget(pingPong[1]); renderer.clear();
  renderer.setRenderTarget(null);

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    prevMouse.copy(mouse);
    mouse.x = (clientX - rect.left) / rect.width;
    mouse.y = 1 - (clientY - rect.top) / rect.height;
    pointer.set(mouse.x, mouse.y);
    isMoving = true;
    lastMoveTime = performance.now();
  }

  function onPointerMove(e) { updatePointer(e.clientX, e.clientY); }
  function onTouchMove(e) {
    if (!e.touches.length) return;
    e.preventDefault();
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onResize() {
    const w = getW(), h = getH();
    renderer.setSize(w, h);
    displayMaterial.uniforms.uResolution.value.set(w, h);
    displayMaterial.uniforms.uDpr.value = window.devicePixelRatio;
  }

  function animate() {
    frameId = requestAnimationFrame(animate);
    smoothPointer.lerp(pointer, 0.075);
    if (isMoving && performance.now() - lastMoveTime > 50) isMoving = false;

    const prev = pingPong[currentTarget];
    currentTarget = (currentTarget + 1) % 2;
    const cur = pingPong[currentTarget];

    trailsMaterial.uniforms.uPrevTrails.value = prev.texture;
    trailsMaterial.uniforms.uMouse.value.copy(mouse);
    trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse);
    trailsMaterial.uniforms.uIsMoving.value = isMoving;

    renderer.setRenderTarget(cur);
    renderer.render(simScene, camera);

    displayMaterial.uniforms.uFluid.value = cur.texture;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('resize', onResize);
  animate();

  return function destroy() {
    cancelAnimationFrame(frameId);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', onResize);
    geometry.dispose();
    trailsMaterial.dispose();
    displayMaterial.dispose();
    pingPong.forEach((rt) => rt.dispose());
    renderer.dispose();
  };
}
