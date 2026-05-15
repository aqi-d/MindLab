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
            <span class="quote-line-1">人类...</span>
            <span class="quote-line-2">不感谢AI</span>
          </div>
          <span class="quote-icon end">"</span>
        </div>
      </template>

      <!-- 日历类型 -->
      <template v-else-if="type === 'calendar'">
        <div class="calendar-content">
          <div class="cal-header">
            <span class="cal-month">{{ currentMonthStr }}</span>
          </div>
          <div class="cal-weekdays">
            <span v-for="day in weekDays" :key="day" class="cal-weekday">{{ day }}</span>
          </div>
          <div class="cal-days-grid">
            <span
              v-for="(item, index) in calendarDays"
              :key="index"
              class="cal-day"
              :class="{ 
                active: item.isToday,
                empty: item.isEmpty,
                'other-month': item.isOtherMonth
              }"
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

    // 检查缓存（30分钟内使用缓存数据）
    const cacheKey = 'weather_location_cache';
    const cached = localStorage.getItem(cacheKey);
    
    let latitude, longitude, cityName;
    
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        if (now - cacheData.timestamp < 1800000 && cacheData.latitude && cacheData.longitude) {
          latitude = cacheData.latitude;
          longitude = cacheData.longitude;
          cityName = cacheData.city;
        }
      } catch (e) {
        console.log('Cache parse error:', e);
      }
    }

    // 如果没有有效缓存，尝试获取位置
    if (!latitude || !longitude) {
      console.log('Fetching location...');
      
      // API 1: geolocation-db.com (对CORS更友好)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const res = await fetch("https://geolocation-db.com/json/", {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            latitude = data.latitude;
            longitude = data.longitude;
            cityName = data.city || "Unknown";
            console.log('Location from geolocation-db:', cityName);
          }
        }
      } catch (e) {
        console.log('geolocation-db failed:', e.message);
      }
      
      // API 2: ipapi.co (备用)
      if (!latitude || !longitude) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const res = await fetch("https://ipapi.co/json/", {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (!data.error && data.latitude) {
              latitude = data.latitude;
              longitude = data.longitude;
              cityName = data.city || "Unknown";
              console.log('Location from ipapi.co:', cityName);
            }
          }
        } catch (e) {
          console.log('ipapi.co failed:', e.message);
        }
      }
      
      // 如果所有API都失败，使用默认位置
      if (!latitude || !longitude) {
        console.warn('All location APIs failed, using default location (Beijing)');
        latitude = 39.9042;
        longitude = 116.4074;
        cityName = "北京";
      }
      
      // 缓存位置数据
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          latitude,
          longitude,
          city: cityName || "Unknown",
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('Cache save error:', e);
      }
    }

    city.value = cityName || "Unknown";
    console.log('Fetching weather for:', city.value, latitude, longitude);

    // 获取天气数据（增加超时时间到 15 秒）
    const weatherController = new AbortController();
    const weatherTimeout = setTimeout(() => {
      console.warn('Weather API timeout after 15s');
      weatherController.abort();
    }, 15000); // 增加到 15 秒
    
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`,
        { signal: weatherController.signal }
      );
      
      clearTimeout(weatherTimeout);

      if (!weatherRes.ok) throw new Error("Weather API failed");

      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      temperature.value = Math.round(current.temperature_2m);
      weatherCode.value = current.weather_code;
      windSpeed.value = current.wind_speed_10m;

      loading.value = false;
      console.log('Weather loaded successfully');
    } catch (weatherErr) {
      clearTimeout(weatherTimeout);
      if (weatherErr.name === 'AbortError') {
        console.error('Weather API request timed out');
        throw new Error('Weather API timeout');
      }
      throw weatherErr;
    }
  } catch (err) {
    console.error('Weather fetch error:', err);
    error.value = true;
    loading.value = false;
    city.value = "定位受限";
    temperature.value = "--";
    windSpeed.value = 0;
  } finally { 
    loading.value = false;
  }
};

const calendarDays = ref([]);
const currentMonthStr = ref("");
const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

const initCalendar = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  currentMonthStr.value = `${year}年${month + 1}月`;

  const days = [];
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ day: "", isEmpty: true, isToday: false, isOtherMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day: day,
      isEmpty: false,
      isToday: day === today,
      isOtherMonth: false,
    });
  }

  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
  for (let i = days.length; i < totalCells; i++) {
    days.push({ day: "", isEmpty: true, isToday: false, isOtherMonth: false });
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

.card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
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
  width: 280px; /* 稍微加宽，容纳两行文字 */
}

.card-quote .card-inner {
  justify-content: center;
  align-items: flex-start; /* 顶部对齐 */
}

.quote-content {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  justify-content: center;
  line-height: 1.6; /* 增加行高，更有呼吸感 */
}

.quote-icon {
  font-size: 1.8rem;
  color: rgba(255, 215, 0, 0.8); /* 金色 */
  font-family: Georgia, serif;
  line-height: 1;
  margin-top: 2px;
}

.quote-icon.end {
  transform: rotate(180deg);
  margin-top: 2px;
}

.quote-text {
  display: flex;
  flex-direction: column; /* 关键：垂直排列两行 */
  gap: 4px; /* 两行之间的间距 */
  font-size: 0.75rem;
  font-weight: 500;
  color: #fcd34d; /* 琥珀黄/金黄色 */
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  text-align: left; /* 左对齐，方便第二行缩进 */
  letter-spacing: 0.5px;
}

/* 第一行：正常显示 */
.quote-line-1 {
  display: block;
  opacity: 0.9;
  color: #fff;
  font-style: italic;
  ext-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  animation: fadeInSlide 1s ease-out 0.3s forwards;
  opacity: 0;
  transform: translateX(-10px);
}

/* 第二行：电影感缩进 */
.quote-line-2 {
  display: block;
  margin-left: 3.5em;
  color: #fff;
  font-style: italic;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  position: relative;
  animation: fadeInSlide 1s ease-out 1s forwards;
  opacity: 0;
  transform: translateX(-10px);
}

@keyframes fadeInSlide {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========================================
   日历卡片
   ======================================== */
.card-calendar {
  width: 260px;
}

.card-calendar .card-inner {
  flex-direction: column;
  gap: 10px;
}

.cal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 0, 255, 0.2);
}

.cal-month {
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 1px;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
  margin-bottom: 4px;
}

.cal-weekday {
  text-align: center;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 0, 255, 0.6);
  padding: 2px 0;
}

.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
}

.cal-day {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.cal-day.empty {
  background: transparent;
  border: none;
  pointer-events: none;
}

.cal-day.other-month {
  opacity: 0.3;
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