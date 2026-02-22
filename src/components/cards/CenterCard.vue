<template>
  <div class="card card-center">
    <!-- 背景光晕 -->
    <div class="card-glow"></div>
    
    <!-- 扫描线效果 -->
    <div class="scan-line"></div>
    
    <!-- 故障纹理 -->
    <div class="card-glitch"></div>
    
    <!-- 边框装饰 -->
    <div class="card-border"></div>
    
    <div class="card-content">
      <!-- 头像区域 -->
      <div class="avatar-frame">
        <div class="avatar-ring ring-1"></div>
        <div class="avatar-ring ring-2"></div>
        <div class="avatar-ring ring-3"></div>
        <img :src="avatar" alt="Avatar" class="avatar" />
        <div class="avatar-glow"></div>
      </div>
      
      <!-- 文字信息 -->
      <div class="info-section">
        <p class="greeting">{{ greeting }}</p>
        <h1 class="name">{{ name }}</h1>
        <p class="role">
          <span class="role-icon">⚡</span>
          <span>{{ role }}</span>
        </p>
      </div>

      <!-- 社交链接 -->
      <div class="social-section">
        <a v-for="(link, index) in socialLinks" :key="index"
          :href="link.url" 
          :target="link.external ? '_blank' : '_self'"
          class="social-link" 
          :title="link.title"
        >
          <span v-html="link.icon"></span>
          <div class="link-glow"></div>
        </a>
      </div>

      <!-- 状态栏 -->
      <div class="status-bar">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
        <div class="status-wave"></div>
      </div>
    </div>

    <!-- 四角装饰 -->
    <div class="card-corner corner-tl"></div>
    <div class="card-corner corner-tr"></div>
    <div class="card-corner corner-bl"></div>
    <div class="card-corner corner-br"></div>
  </div>
</template>

<script setup>
defineProps({
  avatar: {
    type: String,
    default: 'https://robohash.org/aqi?set=set4&size=200x200&bgset=bg2'
  },
  greeting: {
    type: String,
    default: 'Hello, I\'m'
  },
  name: {
    type: String,
    default: 'aqi'
  },
  role: {
    type: String,
    default: 'Developer & Designer'
  },
  socialLinks: {
    type: Array,
    default: () => []
  },
  statusText: {
    type: String,
    default: 'ONLINE'
  }
})
</script>

<style scoped>
/* ========================================
   中心卡片基础样式
   ======================================== */
.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 320px;
  z-index: 100;
  
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(30, 15, 50, 0.6) 50%,
    rgba(15, 23, 42, 0.75) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  
  border: 1px solid rgba(255, 0, 255, 0.4);
  border-radius: 24px;
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 40px rgba(255, 0, 255, 0.08),
    0 0 40px rgba(255, 0, 255, 0.15),
    0 0 80px rgba(0, 255, 255, 0.1);
  
  overflow: visible;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-center:hover {
  transform: translate(-50%, -50%) scale(1.02);
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.5),
    inset 0 0 50px rgba(0, 255, 255, 0.12),
    0 0 60px rgba(255, 0, 255, 0.25),
    0 0 100px rgba(0, 255, 255, 0.2);
}

/* ========================================
   背景光晕与特效
   ======================================== */
.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 255, 0.15) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 0;
}

.card-center:hover .card-glow {
  opacity: 1;
}

.card-glitch {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    0deg,
    transparent 50%,
    rgba(255, 0, 255, 0.03) 50%
  );
  background-size: 100% 4px;
  animation: glitch-bg 0.5s steps(2) infinite;
  pointer-events: none;
  opacity: 0.3;
  z-index: 1;
  border-radius: 24px;
}

@keyframes glitch-bg {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.8),
    transparent
  );
  animation: scan 5s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes scan {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

.card-border {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  border: 1px solid transparent;
  background: linear-gradient(
    135deg,
    rgba(255, 0, 255, 0.5),
    transparent 40%,
    transparent 60%,
    rgba(0, 255, 255, 0.5)
  ) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 3;
}

/* ========================================
   卡片内容区
   ======================================== */
.card-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 24px 20px;
  z-index: 10;
  box-sizing: border-box;
}

/* ========================================
   头像区域
   ======================================== */
.avatar-frame {
  position: relative;
  width: 70px;
  height: 70px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  object-fit: cover;
  position: relative;
  z-index: 2;
  background: #0f172a;
}

.avatar-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  z-index: 1;
}

.ring-1 {
  inset: -4px;
  border-top-color: rgba(255, 0, 255, 0.8);
  border-right-color: rgba(255, 0, 255, 0.8);
  animation: spin 4s linear infinite;
}

.ring-2 {
  inset: -8px;
  border-bottom-color: rgba(0, 255, 255, 0.8);
  border-left-color: rgba(0, 255, 255, 0.8);
  animation: spin-reverse 5s linear infinite;
}

.ring-3 {
  inset: -12px;
  border-top-color: rgba(255, 0, 255, 0.4);
  border-bottom-color: rgba(0, 255, 255, 0.4);
  animation: spin 6s linear infinite;
  opacity: 0.6;
}

.avatar-glow {
  position: absolute;
  inset: -15px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 0, 255, 0.3) 0%,
    transparent 70%
  );
  animation: pulse-glow 3s ease-in-out infinite;
  z-index: 0;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  100% { transform: rotate(-360deg); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* ========================================
   文字信息
   ======================================== */
.info-section {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.greeting {
  font-size: 0.75rem;
  color: #94a3b8;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
  font-weight: 600;
}

.name {
  font-size: 2.4rem;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s ease infinite;
  letter-spacing: 2px;
  line-height: 1.1;
  filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0.3));
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.role {
  font-size: 0.75rem;
  color: #cbd5e1;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
}

.role-icon {
  animation: pulse 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 5px rgba(255, 255, 0, 0.6));
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

/* ========================================
   社交链接
   ======================================== */
.social-section {
  display: flex;
  gap: 12px;
  margin: 5px 0;
  width: 100%;
  justify-content: center;
}

.social-link {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  z-index: 1;
}

.social-link :deep(svg) {
  width: 18px;
  height: 18px;
  fill: currentColor;
  z-index: 2;
  transition: transform 0.3s ease;
  pointer-events: none;
}

.link-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.4), rgba(0, 255, 255, 0.4));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
  pointer-events: none;
}

.social-link:hover {
  border-color: rgba(255, 0, 255, 0.6);
  color: #fff;
  transform: translateY(-4px) scale(1.1);
  box-shadow: 
    0 10px 20px rgba(255, 0, 255, 0.3),
    0 0 15px rgba(0, 255, 255, 0.2);
}

.social-link:hover .link-glow {
  opacity: 1;
}

.social-link:hover :deep(svg) {
  transform: scale(1.1);
}

/* ========================================
   状态栏
   ======================================== */
.status-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 20px;
  margin-bottom: 5px;
  overflow: hidden;
  z-index: 1;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  animation: blink 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px #00ff88;
  z-index: 2;
}

@keyframes blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #00ff88; }
  50% { opacity: 0.4; box-shadow: 0 0 2px #00ff88; }
}

.status-text {
  font-size: 0.65rem;
  color: #00ff88;
  letter-spacing: 1.5px;
  font-weight: 700;
  z-index: 2;
}

.status-wave {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 136, 0.2),
    transparent
  );
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* ========================================
   四角装饰
   ======================================== */
.card-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 0, 255, 0.6);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
}

.corner-tl {
  top: 12px;
  left: 12px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 12px;
  right: 12px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 12px;
  left: 12px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 12px;
  right: 12px;
  border-left: none;
  border-top: none;
}

.card-center:hover .card-corner {
  width: 20px;
  height: 20px;
  border-color: rgba(0, 255, 255, 0.8);
  box-shadow: 
    0 0 12px rgba(0, 255, 255, 0.6),
    inset 0 0 12px rgba(0, 255, 255, 0.2);
}
</style>