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
    
    <!-- 加载动画 -->
    <Loader :hidden="webgpuLoaded" />

    <!-- UI 层 -->
    <div class="ui-layer">
      
      <!-- 🌟 中心卡片 -->
      <CenterCard
        :avatar="config.avatar"
        :greeting="config.greeting"
        :name="config.name"
        :role="config.role"
        :social-links="config.socialLinks"
        :status-text="config.statusText"
      />

      <!-- 🪐 卫星卡片 -->
      <SatCard v-for="card in satCards" :key="card.type"
        :angle="card.angle"
        :radius="card.radius" 
        :type="card.type"
        :icon="card.icon"
        :title="card.title"
        :subtitle="card.subtitle"
        :text="card.text"
        :text2="card.text2"
        :month="currentMonth"
        :clickable="card.clickable"
        @click="handleCardClick(card)"
      />

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

// 导入组件
import CenterCard from '@/components/cards/CenterCard.vue'
import SatCard from '@/components/cards/SatCard.vue'
import Loader from '@/components/Loader.vue'

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

// 配置数据
const config = {
  avatar: 'https://robohash.org/aqi?set=set4&size=200x200&bgset=bg2',
  greeting: 'Hello, I\'m',
  name: 'aqi',
  role: 'Developer & Designer',
  statusText: 'ONLINE',
  socialLinks: [
    { 
      url: 'https://github.com/aqi-d', 
      title: 'GitHub', 
      external: true, 
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' 
    },
    {
      url: 'https://space.bilibili.com/', 
      title: 'Bilibili', 
      external: true, 
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.515 0 2.337.21 2.833.706.496.496.706 1.318.706 2.833v.854c0 .427-.029.815-.086 1.168.358.166.667.395.916.678.635.722.964 1.795.964 3.11 0 1.315-.329 2.388-.964 3.11-.249.283-.558.512-.916.678.057.353.086.741.086 1.168v.854c0 1.515-.21 2.337-.706 2.833-.496.496-1.318.706-2.833.706h-.854c-.427 0-.815-.029-1.168-.086-.166.358-.395.667-.678.916-.722.635-1.795.964-3.11.964-1.315 0-2.388-.329-3.11-.964-.283-.249-.512-.558-.678-.916-.353.057-.741.086-1.168.086h-.854c-1.515 0-2.337-.21-2.833-.706-.496-.496-.706-1.318-.706-2.833v-.854c0-.427.029-.815.086-1.168-.358-.166-.667-.395-.916-.678-.635-.722-.964-1.795-.964-3.11 0-1.315.329-2.388.964-3.11.249-.283.558-.512.916-.678-.057-.353-.086-.741-.086-1.168v-.854c0-1.515.21-2.337.706-2.833.496-.496 1.318-.706 2.833-.706h.854c.427 0 .815.029 1.168.086.166-.358.395-.667.678-.916.722-.635 1.795-.964 3.11-.964 1.315 0 2.388.329 3.11.964.283.249.512.558.678.916.353-.057.741-.086 1.168-.086zm-7.626 6.26c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242zm5.826 0c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242z"/></svg>' 
    },
  ]
}

// 🪐 卫星卡片配置
const satCards = [
  { 
    type: 'ai', 
    angle: -90,
    radius: 260, 
    icon: '🧠', 
    title: 'AI 资源库', 
    subtitle: '探索前沿 AI 工具', 
    clickable: true, 
    onClick: () => router.push('/ai-resources') 
  },
  { 
    type: 'quote', 
    angle: -18,
    radius: 260, 
    text: '好安静', 
    text2: '我是死了吗' 
  },
  { 
    type: 'calendar', 
    angle: 54,
    radius: 260, 
  },
  { 
    type: 'web3', 
    angle: 126,
    radius: 260, 
    icon: '⛓️', 
    title: 'Web3', 
    subtitle: 'Blockchain',
    clickable: true,
    onClick: () => router.push('/web3')
  },
  { 
    type: 'weather', 
    angle: 198,
    radius: 260, 
    icon: '🌤️', 
    title: '24°C', 
    subtitle: 'Shanghai' 
  }
]

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
  // ✅ 检查是否 hover 在卡片上，如果是则不更新背景
  if (event.target.closest('.card')) {
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

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const updateDate = () => {
  const now = new Date()
  currentMonth.value = now.toLocaleDateString('zh-CN', { month: 'long' })
}

const handleCardClick = (card) => {
  if (card.clickable && card.onClick) {
    card.onClick()
  }
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
   ✅ UI 层 - 关键修复：改为 auto
   ======================================== */
.ui-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 900px) {
  .ui-layer {
    transform: scale(0.9);
  }
}

@media (max-width: 700px) {
  .ui-layer {
    transform: scale(0.8);
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
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .card {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
  }
}

@media (max-width: 400px) {
  .card-center {
    width: 240px !important;
    height: 300px !important;
  }
}
</style>