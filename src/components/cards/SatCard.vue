<template>
  <div
    class="card card-sat"
    :class="['card-' + type, { 'card-clickable': clickable }]"
    :style="cardPosition"
  >
    <!-- 发光效果 -->
    <div class="card-glow"></div>
    <div class="card-border"></div>

    <div class="card-inner">
      <!-- AI/Web3 类型 -->
      <template v-if="type === 'ai' || type === 'web3'">
        <div class="card-icon-wrapper">
          <span class="card-icon">{{ icon }}</span>
          <div class="icon-glow"></div>
        </div>
        <div class="card-info">
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
      </template>

      <!-- 语录类型 -->
      <template v-else-if="type === 'quote'">
        <div class="quote-content">
          <span class="quote-icon">"</span>
          <div class="quote-text">
            <span>{{ text }}</span>
          </div>
          <span class="quote-icon end">"</span>
        </div>
      </template>

      <!-- 日历类型 -->
      <template v-else-if="type === 'calendar'">
        <div class="calendar-content">
          <div class="cal-header">
            <span class="cal-icon">📅</span>
            <!-- 使用动态月份 -->
            <span class="cal-month">{{ currentMonthStr }}</span>
          </div>
          <div class="cal-days">
            <!-- 遍历生成的日期数组 -->
            <span
              v-for="(item, index) in calendarDays"
              :key="index"
              class="cal-day"
              :class="{ active: item.isToday }"
            >
              {{ item.day }}
            </span>
          </div>
        </div>
      </template>

      <!-- 🌤️ 天气类型：自动获取 IP 定位天气 -->
      <template v-else-if="type === 'weather'">
        <div class="weather-content" v-if="loading">
          <span class="weather-icon">📡</span>
          <span class="weather-temp">LOADING...</span>
          <span class="weather-city">Locating IP</span>
        </div>

        <div class="weather-content" v-else-if="error">
          <span class="weather-icon">⚠️</span>
          <span class="weather-temp">--°C</span>
          <span class="weather-city">Location Failed</span>
        </div>

        <div class="weather-content" v-else>
          <span class="weather-icon">{{ weatherIcon }}</span>
          <span class="weather-temp">{{ temperature }}°C</span>
          <span class="weather-city">{{ city }}</span>
          <div class="weather-details">
            <span>💨 {{ windSpeed }} km/h</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 四角装饰 -->
    <div class="card-corner corner-tl"></div>
    <div class="card-corner corner-tr"></div>
    <div class="card-corner corner-bl"></div>
    <div class="card-corner corner-br"></div>

    <!-- 扫描线效果 -->
    <div class="scan-line"></div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";

const props = defineProps({
  angle: { type: Number, required: true },
  radius: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    validator: (v) => ["ai", "quote", "calendar", "web3", "weather"].includes(v),
  },
  icon: { type: String, default: "" },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  text: { type: String, default: "" },
  clickable: { type: Boolean, default: false },
});

// 天气相关状态
const loading = ref(true);
const error = ref(false);
const temperature = ref(0);
const city = ref("Unknown");
const windSpeed = ref(0);
const weatherCode = ref(0);

// 天气图标映射 (WMO 代码)
const weatherIcon = computed(() => {
  const code = weatherCode.value;
  if (code === 0) return "☀️"; // 晴朗
  if (code >= 1 && code <= 3) return "⛅"; // 多云
  if (code >= 45 && code <= 48) return "🌫️"; // 雾
  if (code >= 51 && code <= 67) return "🌧️"; // 雨
  if (code >= 71 && code <= 77) return "❄️"; // 雪
  if (code >= 80 && code <= 82) return "🌦️"; // 阵雨
  if (code >= 95) return "⛈️"; // 雷雨
  return "🌤️"; // 默认
});

// 获取天气数据
const fetchWeather = async () => {
  try {
    loading.value = true;

    // 1. 获取 IP 定位
    const locationRes = await fetch("https://ipapi.co/json/");

    // 检查响应状态
    if (!locationRes.ok) {
      throw new Error("Location API blocked or failed");
    }

    const locationData = await locationRes.json();

    // 检查接口是否返回了错误对象 (比如限额)
    if (locationData.error) {
      throw new Error("Location API returned error: " + locationData.reason);
    }

    const { latitude, longitude, city: cityName } = locationData;

    if (!latitude || !longitude) {
      throw new Error("Invalid coordinates received");
    }

    city.value = cityName || "Unknown";

    // 2. 获取天气数据
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`,
    );

    if (!weatherRes.ok) throw new Error("Weather API failed");

    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    temperature.value = Math.round(current.temperature_2m);
    weatherCode.value = current.weather_code;
    windSpeed.value = current.wind_speed_10m;

    loading.value = false;
  } catch (err) {
    console.warn("⚠️ 天气定位失败 (可能是广告拦截插件导致):", err.message);
    error.value = true;
    loading.value = false;
    city.value = "定位受限";
    temperature.value = "--";
    windSpeed.value = 0;
  }
};

// ✅ 新增：获取日期逻辑
const calendarDays = ref([]);
const currentMonthStr = ref("");

const initCalendar = () => {
  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth() + 1; // 月份是 0-11，所以 +1

  // 设置月份显示 (例如 "2月")
  currentMonthStr.value = `${month}月`;

  // 生成日期数组：以今天为中心，前后各取2天，共5天
  // 逻辑：今天 -2, 今天 -1, 今天, 今天 +1, 今天 +2
  const days = [];
  for (let i = -2; i <= 2; i++) {
    let day = today + i;

    // 简单处理跨月逻辑 (如果小于1或大于当月天数，这里简化处理，仅做演示)
    // 如果需要完美的跨月计算，需要更复杂的 Date 操作，但通常视觉上做简单加减即可
    // 为了防止出现 0 或负数，我们可以做个简单判断，或者直接用 Date 对象算
    const targetDate = new Date(now);
    targetDate.setDate(today + i);

    days.push({
      day: targetDate.getDate(),
      isToday: targetDate.getDate() === today,
    });
  }

  calendarDays.value = days;
};

onMounted(() => {
  if (props.type === "weather") {
    fetchWeather();
  }
  if (props.type === "calendar") {
    initCalendar();
  }
});

// 计算卡片位置
const cardPosition = computed(() => {
  const radian = (props.angle * Math.PI) / 180;
  const x = Math.cos(radian) * props.radius;
  const y = Math.sin(radian) * props.radius;

  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    "--angle": `${props.angle}deg`,
  };
});
</script>

<style scoped>
/* ========================================
   卡片基础样式
   ======================================== */
.card-sat {
  position: absolute;
  width: 180px;
  z-index: 50;
  transform: translate(-50%, -50%);
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    z-index 0.3s;

  /* 背景 */
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.6) 0%,
    rgba(30, 15, 50, 0.4) 50%,
    rgba(15, 23, 42, 0.6) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* 边框 */
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 16px;
  padding: 16px;

  /* 阴影 */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 0 30px rgba(255, 0, 255, 0.05),
    0 0 20px rgba(255, 0, 255, 0.1);

  overflow: hidden;
}

/* ✅ 可点击卡片显示手型光标 */
.card-sat.card-clickable {
  cursor: pointer;
}

/* ✅ Hover 效果 */
.card-sat:hover {
  z-index: 90;
  transform: translate(-50%, -50%) scale(1.03);
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 0 40px rgba(0, 255, 255, 0.08),
    0 0 30px rgba(0, 255, 255, 0.2);
}

/* ========================================
   发光效果
   ======================================== */
.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 0, 255, 0.1) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.card-sat:hover .card-glow {
  opacity: 1;
}

.card-border {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 1px solid transparent;
  background: linear-gradient(
      135deg,
      rgba(255, 0, 255, 0.4),
      transparent 40%,
      transparent 60%,
      rgba(0, 255, 255, 0.4)
    )
    border-box;
  -webkit-mask:
    linear-gradient(#fff 0 0) padding-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* ========================================
   扫描线效果
   ======================================== */
.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent);
  animation: scan 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes scan {
  0%,
  100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

/* ========================================
   卡片内容
   ======================================== */
.card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  pointer-events: none;
}

/* ========================================
   AI / Web3 卡片
   ======================================== */
.card-icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0.6));
  transition: transform 0.3s ease;
}

.card-sat:hover .card-icon {
  transform: scale(1.1);
}

.icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 0, 255, 0.4) 0%, transparent 70%);
  opacity: 0.5;
  animation: pulse-glow 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.card-info h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  text-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
  letter-spacing: 0.5px;
}

.card-info p {
  font-size: 0.6rem;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 0.3px;
}

/* ========================================
   语录卡片
   ======================================== */
.card-quote {
  width: 200px;
}

.card-quote .card-inner {
  justify-content: center;
}

.quote-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.quote-icon {
  font-size: 1.5rem;
  color: rgba(255, 0, 255, 0.6);
  font-family: Georgia, serif;
  line-height: 1;
}

.quote-icon.end {
  transform: rotate(180deg);
}

.quote-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
}

.quote-text span {
  animation: neon-flicker 3s ease-in-out infinite;
}

.quote-text .separator {
  color: rgba(255, 0, 255, 0.5);
  animation: none;
  font-weight: 300;
}

@keyframes neon-flicker {
  0%,
  100% {
    opacity: 1;
  }
  92% {
    opacity: 1;
  }
  93% {
    opacity: 0.85;
  }
  94% {
    opacity: 1;
  }
  95% {
    opacity: 0.9;
  }
  96% {
    opacity: 1;
  }
}

/* ========================================
   日历卡片
   ======================================== */
.card-calendar {
  width: 160px;
}

.card-calendar .card-inner {
  flex-direction: column;
  gap: 12px;
}

.cal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 0, 255, 0.2);
}

.cal-icon {
  font-size: 1rem;
}

.cal-month {
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 1px;
}

.cal-days {
  display: flex;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.cal-day {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.cal-day.active {
  background: linear-gradient(135deg, #ff00ff, #ff66ff);
  color: #fff;
  border-color: #ff00ff;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.6);
  transform: scale(1.1);
}

/* ========================================
   天气卡片
   ======================================== */
.card-weather {
  width: 160px; /* 稍微宽一点以容纳更多信息 */
}

.card-weather .card-inner {
  flex-direction: column;
  text-align: center;
  gap: 6px;
}

.weather-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.weather-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 20px rgba(255, 191, 36, 0.7));
  animation: weather-float 3s ease-in-out infinite;
}

@keyframes weather-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.weather-temp {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 15px rgba(255, 191, 36, 0.6);
}

.weather-city {
  font-size: 0.65rem;
  color: #cbd5e1;
  letter-spacing: 1px;
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-details {
  margin-top: 4px;
  font-size: 0.55rem;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* ========================================
   四角装饰
   ======================================== */
.card-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 0, 255, 0.5);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.corner-tl {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 10px;
  right: 10px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 10px;
  left: 10px;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

.card-sat:hover .card-corner {
  width: 18px;
  height: 18px;
  border-color: rgba(0, 255, 255, 0.8);
  box-shadow:
    0 0 10px rgba(0, 255, 255, 0.5),
    inset 0 0 10px rgba(0, 255, 255, 0.2);
}
</style>
