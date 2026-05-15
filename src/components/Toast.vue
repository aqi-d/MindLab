<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-container">
      <div class="toast-content">
        <span class="toast-message">{{ displayText }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';

const visible = ref(false);
const message = ref('');
const displayText = ref('');
const typingSpeed = 50; // 每个字符的显示间隔（毫秒）

let timer = null;
let typingTimer = null;

// 计算属性用于获取当前要显示的文本
const currentMessage = computed(() => message.value);

// 打字机效果函数
const typeWriter = (text) => {
  displayText.value = '';
  let index = 0;
  
  const type = () => {
    if (index < text.length) {
      displayText.value += text.charAt(index);
      index++;
      typingTimer = setTimeout(type, typingSpeed);
    }
  };
  
  type();
};

const show = (msg, duration = 2500) => {
  if (timer) clearTimeout(timer);
  if (typingTimer) clearTimeout(typingTimer);
  
  message.value = msg;
  visible.value = true;
  
  // 开始打字机效果
  typeWriter(msg);
  
  // 设置隐藏定时器（考虑打字时间）
  const typingDuration = msg.length * typingSpeed;
  const totalDuration = Math.max(duration, typingDuration + 1000);
  
  timer = setTimeout(() => {
    visible.value = false;
    displayText.value = ''; // 清空显示文本
  }, totalDuration);
};

defineExpose({ show });
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 0, 255, 0.4);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(255, 0, 255, 0.2),
    inset 0 0 20px rgba(255, 0, 255, 0.05);
  animation: glow-pulse 2s ease-in-out infinite;
}

.toast-message {
  font-size: 0.9rem;
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
  min-height: 1.2em; /* 防止高度变化 */
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(255, 0, 255, 0.2),
      inset 0 0 20px rgba(255, 0, 255, 0.05);
  }
  50% {
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 0, 255, 0.35),
      inset 0 0 25px rgba(255, 0, 255, 0.08);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}
</style>