<template>
  <div class="app-container" :class="{ 'is-mobile': isMobile }">
    <!-- 🌌 WebGPU Canvas 背景 -->
    <canvas v-if="!isMobile" ref="canvasRef" class="webgpu-canvas" tabindex="-1"></canvas>

    <!-- 移动端背景 -->
    <div v-if="isMobile" class="mobile-bg">
      <div class="mobile-bg-gradient"></div>
      <div class="mobile-bg-grid"></div>
    </div>

    <!-- 加载动画 -->
    <Loader :hidden="webgpuLoaded" />

    <!-- Toast 提示 -->
    <Toast ref="toastRef" />

    <!-- UI 层 -->
    <div class="ui-layer" :data-theme="currentTheme">
      <!-- 🌟 中心卡片 -->
      <CenterCard
        :avatar="config.avatar"
        :greeting="config.greeting"
        :name="config.name"
        :role="config.role"
        :social-links="config.socialLinks"
        :status-text="config.statusText"
        :theme="currentTheme"
      />

      <!-- 🪐 卫星卡片 -->
      <SatCard
        v-for="card in satCards"
        :key="card.type"
        :angle="card.angle"
        :radius="card.radius"
        :type="card.type"
        :icon="card.icon"
        :title="card.title"
        :subtitle="card.subtitle"
        :text="card.text"
        :month="currentMonth"
        :clickable="card.clickable"
        :theme="currentTheme"
        @click="handleCardClick(card)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import * as THREE from "three/webgpu";
import {
  abs,
  blendScreen,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
  add,
  float,
  mod,
  mx_cell_noise_float,
  vec2,
  max,
  select,
  sub,
  Fn,
} from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import gsap from "gsap";

import rawMapSrc1 from "@/assets/raw-1.png";
import depthMapSrc1 from "@/assets/depth-1.png";
import rawMapSrc2 from "@/assets/raw-2.png";
import depthMapSrc2 from "@/assets/depth-2.png";
import edgeMapSrc2 from "@/assets/edge-2.png";
import rawMapSrc3 from "@/assets/raw-3.jpg";
import depthMapSrc3 from "@/assets/depth-3.png";

// 导入组件
import CenterCard from "@/components/cards/CenterCard.vue";
import SatCard from "@/components/cards/SatCard.vue";
import Loader from "@/components/Loader.vue";
import Toast from "@/components/Toast.vue";

const router = useRouter();
const canvasRef = ref(null);
const toastRef = ref(null);
const currentMonth = ref("");
const isMobile = ref(false);
const webgpuLoaded = ref(false);
const currentTheme = ref("cyberpunk"); // 默认主题

// WebGPU 变量
let renderer = null;
let scene = null;
let camera = null;
let animationId = null;
let mesh = null;
let renderPipeline = null;
let material = null;
let intervalId = null;
let textureLoader = null;
let currentRawTexture = null;
let currentDepthTexture = null;
let currentEdgeTexture = null;
const uPointer = uniform(new THREE.Vector2(0));
const uProgress = uniform(0);
const WIDTH = 1600;
const HEIGHT = 900;

// sdCross 函数 - 使用 Fn 包装为 TSL 函数节点
const sdCross = Fn(([p_immutable, b_immutable, r_immutable]) => {
  const r = float(r_immutable).toVar();
  const b = vec2(b_immutable).toVar();
  const p = vec2(p_immutable).toVar();
  
  p.assign(abs(p));
  p.assign(select(p.y.greaterThan(p.x), p.yx, p.xy));
  
  const q = vec2(p.sub(b)).toVar();
  const k = float(max(q.y, q.x)).toVar();
  const w = vec2(
    select(k.greaterThan(0.0), q, vec2(b.y.sub(p.x), k.negate()))
  ).toVar();
  const d = float(max(w, 0.0).length()).toVar();
  
  return select(k.greaterThan(0.0), d, d.negate()).add(r);
});

// 图片配置数组 - 每个图片有不同的扫描效果类型和主题
const imageConfigs = [
  {
    name: "Image 1",
    raw: rawMapSrc1,
    depth: depthMapSrc1,
    edge: null,
    effectType: "dots", // 点阵效果
    theme: "medieval", // 中世纪风格
  },
  {
    name: "Image 2",
    raw: rawMapSrc2,
    depth: depthMapSrc2,
    edge: edgeMapSrc2,
    effectType: "edge", // 边缘检测效果
    theme: "cyberpunk", // 赛博朋克风格
  },
  {
    name: "Image 3",
    raw: rawMapSrc3,
    depth: depthMapSrc3,
    edge: null,
    effectType: "cross", // 十字形效果
    theme: "minimal", // 简约风格
  },
];

let currentImageIndex = 0;
const SWITCH_INTERVAL = 8000;

const config = {
  avatar: "https://robohash.org/aqi?set=set4&size=200x200&bgset=bg2",
  greeting: "Hello, I'm",
  name: "aqi",
  role: "Developer & Designer",
  statusText: "ONLINE",
  socialLinks: [
    {
      url: "https://github.com/aqi-d",
      title: "GitHub",
      external: true,
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    },
    // {
    //   url: 'https://space.bilibili.com/',
    //   title: 'Bilibili',
    //   external: true,
    //   icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.515 0 2.337.21 2.833.706.496.496.706 1.318.706 2.833v.854c0 .427-.029.815-.086 1.168.166.358.395.667.678.916.722.635.964 1.795.964 3.11 0 1.315-.329 2.388-.964 3.11-.249.283-.558.512-.916.678-.057.353-.086.741-.086 1.168v.854c0 1.515.21 2.337.706 2.833.496.496 1.318.706 2.833.706h.854c.427 0 .815.029 1.168.086.166-.358.395-.667.678-.916.722-.635 1.795-.964 3.11-.964 1.315 0 2.388.329 3.11.964.283.249.512.558.916.678.353-.057.741-.086 1.168-.086h-.854c-1.515 0-2.337-.21-2.833-.706-.496-.496-.706-1.318-.706-2.833v-.854c0-.427.029-.815.086-1.168-.358-.166-.667-.395-.916-.678-.635-.722-.964-1.795-.964-3.11 0-1.315.329-2.388.964-3.11.249-.283.558-.512.916-.678-.057-.353-.086-.741-.086-1.168v-.854c0-1.515.21-2.337.706-2.833.496-.496 1.318-.706 2.833-.706h.854c.427 0 .815.029 1.168.086.166-.358.395-.667.678-.916.722-.635 1.795-.964 3.11-.964 1.315 0 2.388.329 3.11.964.283.249.512.558.916.678.353-.057.741-.086 1.168-.086zm-7.626 6.26c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242zm5.826 0c-.686 0-1.242.556-1.242 1.242s.556 1.242 1.242 1.242 1.242-.556 1.242-1.242-.556-1.242-1.242-1.242z"/></svg>'
    // },
    {
      url: "aqi_lu@163.com",
      title: "Copy Email",
      external: false,
      action: "copy",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor"></rect><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" fill="none" stroke="currentColor"></path></svg>`
    },
  ],
};

const satCards = [
  {
    type: "ai",
    angle: -90,
    radius: 220,
    title: "AI 资源库",
    subtitle: "探索前沿 AI 工具",
    clickable: true,
    onClick: () => {
    window.open("https://ai-nav-64t.pages.dev/", "_blank");
  },
  },
  {
    type: "quote",
    angle: -22,
    radius: 280,
    clickable: true,
    onClick: () => {
    window.open("https://www.3body.com/", "_blank");
  },
  },
  {
    type: "calendar",
    angle: 24,
    radius: 280,
  },
  {
    type: "web3",
    angle: 90,
    radius: 220,
    title: "Web3",
    subtitle: "Blockchain",
    clickable: true,
    onClick: () => {
      toastRef.value?.show("最近有点忙，未来再做吧。");
    },
  },
  {
    type: "weather",
    angle: 180,
    radius: 210,
  },
];

const updateMeshScale = () => {
  if (!mesh) return;
  const windowAspect = window.innerWidth / window.innerHeight;
  const baseAspect = WIDTH / HEIGHT;
  let scaleW, scaleH;

  if (windowAspect > baseAspect) {
    scaleW = windowAspect / baseAspect;
    scaleH = 1;
  } else {
    scaleW = 1;
    scaleH = baseAspect / windowAspect;
  }
  mesh.scale.set(scaleW, scaleH, 1);
};

const initWebGPU = async () => {
  
  if (isMobile.value) {
    webgpuLoaded.value = true;
    return;
  }


  // 多重超时保护
  const timeouts = [];
  const addTimeout = (ms, label) => {
    const id = setTimeout(() => {
    }, ms);
    timeouts.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    timeouts.forEach(id => clearTimeout(id));
  };

  // 10秒后强制隐藏 Loader（无论如何）
  const forceHideTimeout = setTimeout(() => {
    webgpuLoaded.value = true;
  }, 10000);

  try {
    // Step 1: 检查 WebGPU 支持
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }

    // Step 2: 获取 Adapter
    const adapterTimeout = addTimeout(3000, 'Adapter request');
    const adapter = await navigator.gpu.requestAdapter();
    clearTimeout(adapterTimeout);
    
    if (!adapter) {
      throw new Error("No GPU adapter found");
    }

    // Step 3: 获取 Device
    const deviceTimeout = addTimeout(3000, 'Device request');
    const device = await adapter.requestDevice();
    clearTimeout(deviceTimeout);

    // Step 4: 初始化 Renderer
    renderer = new THREE.WebGPURenderer({
      canvas: canvasRef.value,
      antialias: false,
    });
    
    const rendererTimeout = addTimeout(3000, 'Renderer init');
    await renderer.init();
    clearTimeout(rendererTimeout);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Step 5: 创建 TextureLoader
    textureLoader = new THREE.TextureLoader();

    // 加载第一组纹理
    const firstConfig = imageConfigs[0];
    const textures = await Promise.all([
      textureLoader.loadAsync(firstConfig.raw),
      textureLoader.loadAsync(firstConfig.depth),
      firstConfig.edge ? textureLoader.loadAsync(firstConfig.edge) : Promise.resolve(null),
    ]);

    const [firstRawMap, firstDepthMap, firstEdgeMap] = textures;

    firstRawMap.flipY = false;
    firstRawMap.colorSpace = THREE.SRGBColorSpace;
    firstDepthMap.flipY = false;
    if (firstEdgeMap) firstEdgeMap.flipY = false;

    // 保存当前纹理引用
    currentRawTexture = firstRawMap;
    currentDepthTexture = firstDepthMap;
    currentEdgeTexture = firstEdgeMap;

    // 创建初始场景
    createSceneWithEffect(firstConfig.effectType);

    // 启动扫描动画（只启动一次）
    gsap.to(uProgress, {
      value: 1, // 改回 1，让扫描线完整扫过
      repeat: -1,
      duration: 3,
      ease: "power1.out",
    });

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (renderPipeline) {
        renderPipeline.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    // 成功！清除所有超时
    clearAllTimeouts();
    clearTimeout(forceHideTimeout);
    
    setTimeout(() => {
      webgpuLoaded.value = true;
    }, 300);

    // 启动图片切换定时器
    console.log('Starting image switcher...');
    intervalId = setInterval(async () => {
      currentImageIndex = (currentImageIndex + 1) % imageConfigs.length;
      console.log(`Timer fired! Switching to index: ${currentImageIndex}, Image: ${imageConfigs[currentImageIndex].name}`);
      await switchImage(currentImageIndex);
    }, SWITCH_INTERVAL);
    console.log('intervalId set to:', intervalId);
    
  } catch (error) {
    console.error('WebGPU initialization error:', error);
    clearAllTimeouts();
    clearTimeout(forceHideTimeout);
    webgpuLoaded.value = true;
  }
};

// 根据效果类型创建场景
const createSceneWithEffect = (effectType) => {
  const strength = 0.01;
  const tDepthMap = texture(currentDepthTexture);
  
  let final;

  if (effectType === "dots") {
    // 点阵效果 - Image 1
    const tMap = texture(
      currentRawTexture,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    );

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = tDepthMap;
    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.sub(uProgress))));

    const mask = dot.mul(flow).mul(vec3(10, 0, 0));

    final = blendScreen(tMap, mask);
  } else if (effectType === "edge") {
    // 边缘检测效果 - Image 2（不取反，正常从上到下扫描）
    const tEdgeMap = texture(currentEdgeTexture);
    const tMap = texture(
      currentRawTexture,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    ).mul(0.5);

    const depth = tDepthMap;
    const flow = sub(1, smoothstep(0, 0.02, abs(depth.sub(uProgress))));
    const mask = oneMinus(tEdgeMap).mul(flow).mul(vec3(10, 0.4, 10));

    final = blendScreen(tMap, mask);
  } else if (effectType === "cross") {
    // 十字形效果 - Image 3（深度图取反，uProgress 映射到 0-0.9）
    const tMap = texture(
      currentRawTexture,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    ).mul(0.5);

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(50.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    // 使用 sdCross 函数节点
    const dist = sdCross(tiledUv, vec2(0.3, 0.02), 0.0);
    const cross = vec3(smoothstep(0.0, 0.02, dist));

    // 深度图取反
    const depth = oneMinus(tDepthMap);
    
    // 将 uProgress (0-1) 映射到 (0-0.9)，避免边缘白屏
    const mappedProgress = uProgress.mul(0.9);
    const flow = sub(1, smoothstep(0, 0.02, abs(depth.sub(mappedProgress))));

    const mask = oneMinus(cross).mul(flow).mul(vec3(10, 10, 10));

    final = blendScreen(tMap, mask);
  }

  // 销毁旧材质和 RenderPipeline
  if (material) {
    material.dispose();
  }
  if (renderPipeline) {
    renderPipeline.dispose();
  }

  // 创建新材质
  material = new THREE.MeshBasicNodeMaterial({ colorNode: final });
  
  // 如果 mesh 不存在则创建
  if (!mesh) {
    const geometry = new THREE.PlaneGeometry(WIDTH / 100, HEIGHT / 100);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    updateMeshScale();
  } else {
    mesh.material = material;
  }

  // 创建新的 RenderPipeline
  const scenePassColor = final;
  const bloomPass = bloom(scenePassColor, 1, 0.5, 1);
  const finalNode = add(scenePassColor, bloomPass);
  
  renderPipeline = new THREE.RenderPipeline(renderer);
  renderPipeline.outputNode = finalNode;
};

// 切换图片
const switchImage = async (index) => {
  const config = imageConfigs[index];
  console.log(`Switching to: ${config.name} with effect: ${config.effectType}`);

  try {
    // 更新主题
    currentTheme.value = config.theme;
    console.log(`Theme changed to: ${config.theme}`);

    // 加载新纹理
    const textures = await Promise.all([
      textureLoader.loadAsync(config.raw),
      textureLoader.loadAsync(config.depth),
      config.edge ? textureLoader.loadAsync(config.edge) : Promise.resolve(null),
    ]);

    const [newRawMap, newDepthMap, newEdgeMap] = textures;

    newRawMap.flipY = false;
    newRawMap.colorSpace = THREE.SRGBColorSpace;
    newRawMap.needsUpdate = true;
    newDepthMap.flipY = false;
    newDepthMap.needsUpdate = true;
    if (newEdgeMap) {
      newEdgeMap.flipY = false;
      newEdgeMap.needsUpdate = true;
    }

    // 更新当前纹理引用
    currentRawTexture = newRawMap;
    currentDepthTexture = newDepthMap;
    currentEdgeTexture = newEdgeMap;

    // 根据效果类型重新创建场景
    createSceneWithEffect(config.effectType);

    console.log(`Switched to: ${config.name} successfully`);
  } catch (error) {
    console.error(`Failed to switch to ${config.name}:`, error);
  }
};

// 图片切换功能
const startImageSwitching = () => {
  console.log('Starting image switching with interval:', SWITCH_INTERVAL);
  intervalId = setInterval(async () => {
    // 切换到下一张图片
    currentImageIndex = (currentImageIndex + 1) % imageConfigs.length;
    console.log(`Switching to index: ${currentImageIndex}`);
    await loadImageConfig(currentImageIndex);
  }, SWITCH_INTERVAL);
};

let tick = 0;
const onMouseMove = (event) => {
  // ✅ 检查是否 hover 在卡片上，如果是则不更新背景
  if (event.target.closest(".card")) {
    return;
  }
  tick += 1;
  if (tick % 2 !== 0) return;
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  gsap.to(uPointer.value, {
    x: x,
    y: y,
    duration: 0.5,
    ease: "power2.out",
  });
};

const onResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateMeshScale();
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const updateDate = () => {
  const now = new Date();
  currentMonth.value = now.toLocaleDateString("zh-CN", { month: "long" });
};

const handleCardClick = (card) => {
  if (card.clickable && card.onClick) {
    card.onClick();
  }
};

onMounted(() => {
  checkMobile();
  updateDate();
  initWebGPU();

  const timer = setInterval(updateDate, 60000);
  const resizeTimer = setInterval(checkMobile, 500);

  onBeforeUnmount(() => {
    clearInterval(timer);
    clearInterval(resizeTimer);
    if (intervalId) clearInterval(intervalId); // 清除图片切换定时器
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("mousemove", onMouseMove);
    renderer?.dispose();
  });
});
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
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(40px);
  }
}

/* ========================================
   ✅ UI 层 - 关键修复：改为 auto
   ======
  ================================== */
.ui-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;display: flex;
  align-items: center;
  justify-content: center;
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
