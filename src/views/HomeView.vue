<template>
  <div class="app-container" :class="{ 'is-mobile': isMobile }">
    
    <!-- 🌌 WebGPU Canvas 背景 -->
    <canvas 
      v-if="!isMobile"
      ref="canvasRef" 
      class="webgpu-canvas"
      tabindex="-1"
    ></canvas>

    <!-- 移动端背景 -->
    <div v-if="isMobile" class="mobile-bg">
      <div class="mobile-bg-gradient"></div>
      <div class="mobile-bg-grid"></div>
    </div>
    
    <!-- 加载遮罩 -->
    <div 
      v-if="!webgpuLoaded && !isMobile" 
      class="loader" 
      :class="{ 'loader-hidden': webgpuLoaded }"
    >
      <div class="loader-content">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <span class="loader-text">SYSTEM INITIALIZING...</span>
      </div>
    </div>

    <!-- UI 层 - 卡片系统 -->
    <div class="ui-layer">
      <div class="orbit-system">
        
        <!-- 🌟 中心个人卡片 -->
        <div class="card card-center">
          <div class="card-glitch"></div>
          <div class="card-content">
            <div class="avatar-frame">
              <div class="avatar-ring"></div>
              <div class="avatar-ring delay"></div>
              <img src="https://robohash.org/aqi?set=set4&size=200x200&bgset=bg2" alt="Avatar" class="avatar" />
            </div>
            
            <div class="info-section">
              <p class="greeting">Hello, I'm</p>
              <h1 class="name">aqi</h1>
              <p class="role">
                <span class="role-icon">⚡</span>
                <span>Developer & Designer</span>
              </p>
            </div>

            <div class="social-section">
              <a href="https://github.com/aqi" target="_blank" class="social-link" title="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://space.bilibili.com/" target="_blank" class="social-link" title="Bilibili">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.515 0 2.337.21 2.833.706.496.496.706 1.318.706 2.833v.854c0 .427-.029.815-.086 1.168.358.166.667.395.916.678.635.722.964 1.795.964 3.11 0 1.315-.329 2.388-.964 3.11-.249.283-.558.512-.916.678.057.353.086.741.086 1.168v.854c0 1.515-.21 2.337-.706 2.833-.496.496-1.318.706-2.833.706h-.854c-.427 0-.815-.029-1.168-.086-.166.358-.395.667-.678.916-.722.635-1.795.964-3.11.964-1.315 0-2.388-.329-3.11-.964-.283-.249-.512-.558-.678-.916-.353.057-.741.086-1.168.086h-.854c-1.515 0-2.337-.21-2.833-.706-.496-.496-.706-1.318-.706-2.833v-.854c0-.427.029-.815.086-1.168-.358-.166-.667-.395-.916-.678-.635-.722-.964-1.795-.964-3.11 0-1.315.329-2.388.964-3.11.249-.283.558-.512.916-.678-.057-.353-.086-.741-.086-1.168v-.854c0-1.515.21-2.337.706-2.833.496-.496 1.318-.706 2.833-.706h.854c.427 0 .815.029 1.168.086.166-.358.395-.667.678-.916.722-.635 1.795-.964 3.11-.964 1.315 0 2.388.329 3.11.964.283.249.512.558.678.916.353-.057.741-.086 1.168-.086zm-7.626 6.26c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242zm5.826 0c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242z"/></svg>
              </a>
              <a href="mailto:your@email.com" class="social-link" title="Email">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/></svg>
              </a>
            </div>

            <div class="status-bar">
              <span class="status-dot"></span>
              <span class="status-text">ONLINE</span>
            </div>
          </div>
        </div>

        <!-- 🪐 卫星卡片 -->
        <div class="card card-sat card-ai" :style="getCardPosition(0, 170)" @click="navigateTo('/ai-resources')" style="cursor: pointer;">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="card-icon">🧠</div>
            <div class="card-info">
              <h3>AI 资源库</h3>
              <p>探索前沿 AI 工具</p>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

        <div class="card card-sat card-quote" :style="getCardPosition(55, 190)">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="quote-text">
              <span>好安静</span>
              <span class="separator">|</span>
              <span>我是死了吗</span>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

        <div class="card card-sat card-calendar" :style="getCardPosition(135, 240)">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="cal-top">
              <span class="cal-icon">📅</span>
              <span class="cal-month">{{ currentMonth }}</span>
            </div>
            <div class="cal-days">
              <span v-for="i in 5" :key="i" class="cal-day" :class="{ active: i === 3 }">{{ 20 + i }}</span>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

        <div class="card card-sat card-web3" :style="getCardPosition(180, 300)">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="card-icon">⛓️</div>
            <div class="card-info">
              <h3>Web3</h3>
              <p>Blockchain</p>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

        <div class="card card-sat card-music" :style="getCardPosition(245, 260)">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="vinyl-disc"></div>
            <div class="music-info">
              <span class="track-name">Neon Nights</span>
              <div class="visualizer">
                <span v-for="i in 5" :key="i" class="bar" :style="`--delay: ${i * 0.1}s`"></span>
              </div>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

        <div class="card card-sat card-weather" :style="getCardPosition(305, 240)">
          <div class="card-border"></div>
          <div class="card-inner">
            <div class="weather-display">
              <span class="weather-icon">🌤️</span>
              <span class="weather-temp">24°C</span>
              <span class="weather-city">Shanghai</span>
            </div>
          </div>
          <div class="card-corner corner-tl"></div>
          <div class="card-corner corner-tr"></div>
          <div class="card-corner corner-bl"></div>
          <div class="card-corner corner-br"></div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three/webgpu'
import {
  abs, blendScreen, oneMinus, smoothstep, sub, texture, uniform, uv, vec3, add,
} from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import gsap from 'gsap'

import rawMapSrc from '@/assets/raw-2.png'
import depthMapSrc from '@/assets/depth-2.png'
import edgeMapSrc from '@/assets/edge-2.png'

const router = useRouter()
const canvasRef = ref(null)
const currentMonth = ref('')
const isMobile = ref(false)
const webgpuLoaded = ref(false)

// WebGPU 变量
let renderer = null
let scene = null
let camera = null
let animationId = null
let mesh = null
let postProcessing = null
const uPointer = uniform(new THREE.Vector2(0))
const uProgress = uniform(0)
const WIDTH = 1600
const HEIGHT = 900

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const getCardPosition = (angle, radius) => {
  return {
    '--angle': `${angle}deg`,
    '--radius': `${radius}px`
  }
}

const updateMeshScale = () => {
  if (!mesh) return
  const windowAspect = window.innerWidth / window.innerHeight
  const baseAspect = WIDTH / HEIGHT
  let scaleW, scaleH
  
  if (windowAspect > baseAspect) {
    scaleW = windowAspect / baseAspect
    scaleH = 1
  } else {
    scaleW = 1
    scaleH = baseAspect / windowAspect
  }
  mesh.scale.set(scaleW, scaleH, 1)
}

const initWebGPU = async () => {
  if (isMobile.value) {
    webgpuLoaded.value = true
    return
  }

  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) throw new Error('WebGPU not supported')
    const device = await adapter.requestDevice()

    renderer = new THREE.WebGPURenderer({
      canvas: canvasRef.value,
      antialias: false,
    })
    await renderer.init()
    
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const textureLoader = new THREE.TextureLoader()
    const [rawMap, depthMap, edgeMap] = await Promise.all([
      textureLoader.loadAsync(rawMapSrc),
      textureLoader.loadAsync(depthMapSrc),
      textureLoader.loadAsync(edgeMapSrc),
    ])
    
    rawMap.flipY = false
    rawMap.colorSpace = THREE.SRGBColorSpace
    depthMap.flipY = false
    edgeMap.flipY = false

    const strength = 0.01
    const tDepthMap = texture(depthMap)
    const tEdgeMap = texture(edgeMap)
    
    const tMap = texture(
      rawMap,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    ).mul(0.5)

    const depth = tDepthMap
    const flow = sub(1, smoothstep(0, 0.02, abs(depth.sub(uProgress))))
    const mask = oneMinus(tEdgeMap).mul(flow).mul(vec3(10, 0.4, 10))
    const sceneColorNode = blendScreen(tMap, mask)

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: sceneColorNode,
    })
    
    const geometry = new THREE.PlaneGeometry(WIDTH / 100, HEIGHT / 100)
    mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    updateMeshScale()

    const scenePassColor = sceneColorNode
    const bloomPass = bloom(scenePassColor, 1, 0.5, 1)
    const finalNode = add(scenePassColor, bloomPass)

    postProcessing = new THREE.PostProcessing(renderer)
    postProcessing.outputNode = finalNode

    gsap.to(uProgress, {
      value: 1,
      repeat: -1,
      duration: 3,
      ease: 'power1.out',
    })

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (postProcessing) {
        postProcessing.render()
      } else {
        renderer.render(scene, camera)
      }
    }
    animate()

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    
    setTimeout(() => {
      webgpuLoaded.value = true
    }, 300)
    
  } catch (error) {
    console.error('❌ WebGPU Init Failed:', error)
    webgpuLoaded.value = true
  }
}

let tick = 0
const onMouseMove = (event) => {
  if (document.querySelector('.card:hover')) {
    return
  }
  tick += 1
  if (tick % 2 !== 0) return 
  const x = (event.clientX / window.innerWidth) * 2 - 1
  const y = -(event.clientY / window.innerHeight) * 2 + 1
  gsap.to(uPointer.value, {
    x: x,
    y: y,
    duration: 0.5,
    ease: 'power2.out'
  })
}

const onResize = () => {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateMeshScale()
}

onMounted(() => {
  checkMobile()
  updateDate()
  initWebGPU()
  
  const timer = setInterval(updateDate, 60000)
  const resizeTimer = setInterval(checkMobile, 500)
  
  onBeforeUnmount(() => {
    clearInterval(timer)
    clearInterval(resizeTimer)
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mousemove', onMouseMove)
    renderer?.dispose()
  })
})

const updateDate = () => {
  const now = new Date()
  currentMonth.value = now.toLocaleDateString('zh-CN', { month: 'long' })
}

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
/* ========================================
   基础设置
   ======================================== */
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050a14;
}

/* ========================================
   🌌 WebGPU Canvas - 固定背景
   ======================================== */
.webgpu-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  outline: none;
  z-index: 0;
  pointer-events: none;
}

/* ========================================
   移动端背景
   ======================================== */
.mobile-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.mobile-bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0a0f1e 0%, #0d1525 50%, #0a0f1e 100%);
}

.mobile-bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% { transform: translateY(0); }
  100% { transform: translateY(40px); }
}

/* ========================================
   加载遮罩
   ======================================== */
.loader {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: linear-gradient(135deg, #050a14, #0a0f1e, #050a14);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
}

.loader-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.loader-content {
  text-align: center;
  position: relative;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #ff00ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-ring:nth-child(2) {
  inset: 10px;
  border-top-color: transparent;
  border-right-color: #00ffff;
  animation-direction: reverse;
  animation-duration: 1.5s;
}

.loader-ring:nth-child(3) {
  inset: 20px;
  border-top-color: transparent;
  border-bottom-color: #ff00ff;
  animation-duration: 2s;
}

.loader-text {
  position: relative;
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 3px;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========================================
   UI 层 - 卡片系统
   ======================================== */
.ui-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: block;
  pointer-events: none;
}

.orbit-system {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ========================================
   通用卡片样式
   ======================================== */
.card {
  position: absolute;
  pointer-events: auto;
  transform-origin: center center;
}

.card-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 300px;
  z-index: 100;
}

.card-sat {
  width: 180px;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: 
    rotate(var(--angle)) 
    translate(var(--radius)) 
    rotate(calc(-1 * var(--angle)));
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), z-index 0.2s;
}

.card-sat:hover {
  z-index: 90;
  transform: 
    rotate(var(--angle)) 
    translate(calc(var(--radius) + 10px)) 
    rotate(calc(-1 * var(--angle)))
    scale(1.05);
}

/* ========================================
   中心卡片 - 极致透明
   ======================================== */
.card-center {
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 20px;
  box-shadow: 0 0 60px rgba(255, 0, 255, 0.1);
  overflow: visible;
}

.card-glitch {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    0deg,
    transparent 50%,
    rgba(255, 0, 255, 0.02) 50%
  );
  background-size: 100% 4px;
  animation: glitch-bg 0.5s steps(2) infinite;
  pointer-events: none;
  opacity: 0.2;
}

@keyframes glitch-bg {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.card-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 22px 18px;
  z-index: 1;
  box-sizing: border-box;
}

.avatar-frame {
  position: relative;
  width: 55px;
  height: 55px;
  margin-top: 5px;
  margin-bottom: 5px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 0, 255, 0.5);
  object-fit: cover;
}

.avatar-ring,
.avatar-ring.delay {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(0, 255, 255, 0.7);
  border-right-color: rgba(255, 0, 255, 0.7);
  animation: spin 3s linear infinite;
}

.avatar-ring.delay {
  animation-direction: reverse;
  animation-duration: 4s;
  inset: -10px;
  border-top-color: rgba(255, 0, 255, 0.5);
  border-left-color: rgba(0, 255, 255, 0.5);
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.info-section {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.greeting {
  font-size: 0.7rem;
  color: #cbd5e1;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
}

.name {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s ease infinite;
  letter-spacing: 3px;
  line-height: 1.1;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.role {
  font-size: 0.7rem;
  color: #cbd5e1;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.role-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.social-section {
  display: flex;
  gap: 10px;
  margin: 5px 0;
}

.social-link {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  transition: all 0.3s ease;
}

.social-link svg {
  width: 17px;
  height: 17px;
}

.social-link:hover {
  background: rgba(255, 0, 255, 0.2);
  border-color: rgba(255, 0, 255, 0.6);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
  transform: translateY(-3px);
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 20px;
  margin-bottom: 5px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #00ff88;
  border-radius: 50%;
  animation: blink 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px #00ff88;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.status-text {
  font-size: 0.6rem;
  color: #00ff88;
  letter-spacing: 1px;
  font-weight: 600;
}

/* ========================================
   卫星卡片 - 极致透明
   ======================================== */
.card-sat {
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 0, 255, 0.25);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.08);
  overflow: hidden;
}

.card-border {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.2), transparent, rgba(0, 255, 255, 0.2)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
  filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0.5));
}

.card-info h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 3px;
  text-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
}

.card-info p {
  font-size: 0.6rem;
  color: #94a3b8;
  margin: 0;
}

.card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 0, 255, 0.5);
  pointer-events: none;
  transition: all 0.3s ease;
}

.corner-tl {
  top: 8px;
  left: 8px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 8px;
  right: 8px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 8px;
  left: 8px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 8px;
  right: 8px;
  border-left: none;
  border-top: none;
}

.card-sat:hover .card-corner {
  width: 16px;
  height: 16px;
  border-color: rgba(0, 255, 255, 0.7);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
}

/* ========================================
   语录卡片
   ======================================== */
.card-quote {
  width: 220px;
}

.card-quote .card-inner {
  justify-content: center;
}

.quote-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
}

.quote-text span {
  animation: neon-flicker 3s ease-in-out infinite;
}

.quote-text .separator {
  color: rgba(255, 0, 255, 0.4);
  animation: none;
}

@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.8; }
  94% { opacity: 1; }
  95% { opacity: 0.9; }
  96% { opacity: 1; }
}

/* ========================================
   日历卡片
   ======================================== */
.card-calendar {
  width: 160px;
}

.card-calendar .card-inner {
  flex-direction: column;
  gap: 10px;
}

.cal-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #94a3b8;
}

.cal-icon {
  font-size: 1rem;
}

.cal-days {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.cal-day {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 5px;
  transition: all 0.3s ease;
}

.cal-day.active {
  background: linear-gradient(135deg, #ff00ff, #ff66ff);
  color: #fff;
  border-color: #ff00ff;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
}

/* ========================================
   音乐卡片
   ======================================== */
.card-music {
  width: 200px;
}

.card-music .card-inner {
  gap: 12px;
}

.vinyl-disc {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(circle, #1a1a2e 25%, #0a0f1e 26%, #0a0f1e 35%, #1a1a2e 36%);
  border: 2px solid rgba(0, 255, 255, 0.3);
  animation: spin 3s linear infinite;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
  flex-shrink: 0;
}

.music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.track-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

.visualizer {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 18px;
}

.visualizer .bar {
  flex: 1;
  height: 40%;
  background: linear-gradient(to top, #ff00ff, #00ffff);
  border-radius: 2px;
  animation: visualize 0.8s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes visualize {
  0%, 100% { height: 40%; }
  50% { height: 100%; }
}

/* ========================================
   天气卡片
   ======================================== */
.card-weather {
  width: 150px;
}

.card-weather .card-inner {
  flex-direction: column;
  text-align: center;
  gap: 6px;
}

.weather-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.weather-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 15px rgba(255, 191, 36, 0.6));
}

.weather-temp {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 15px rgba(255, 191, 36, 0.5);
}

.weather-city {
  font-size: 0.6rem;
  color: #94a3b8;
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 900px) {
  .card-sat {
    --radius: 190px !important;
  }
  .card-center {
    width: 200px;
    height: 270px;
  }
  .name {
    font-size: 1.9rem;
  }
}

@media (max-width: 700px) {
  .card-sat {
    --radius: 160px !important;
  }
  .card-center {
    width: 180px;
    height: 240px;
  }
  .card-sat {
    width: 150px !important;
  }
}

@media (max-width: 768px) {
  .app-container.is-mobile {
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .webgpu-canvas {
    display: none;
  }
  
  .ui-layer {
    position: relative;
    height: auto;
    min-height: 100vh;
    display: block;
    padding: 30px 20px;
  }
  
  .orbit-system {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px 0;
    height: auto;
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    pointer-events: auto;
  }
  
  .card-center {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: 260px !important;
    height: 320px !important;
    order: 0;
    margin-bottom: 10px;
  }
  
  .card-sat {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: 100% !important;
    max-width: 300px;
    margin: 5px 0;
  }
  
  .card-ai { order: 1; }
  .card-quote { order: 2; }
  .card-calendar { order: 3; }
  .card-web3 { order: 4; }
  .card-music { order: 5; }
  .card-weather { order: 6; }
}

@media (max-width: 400px) {
  .card-center {
    width: 240px !important;
    height: 300px !important;
  }
  .name {
    font-size: 1.8rem;
  }
  .greeting {
    font-size: 0.65rem;
  }
  .role {
    font-size: 0.65rem;
  }
}
</style>