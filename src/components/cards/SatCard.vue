<template>
  <div
    class="card card-sat"
    :class="['card-' + type, `theme-${theme}`, { 'card-clickable': clickable }]"
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
  theme: {
    type: String,
    default: "cyberpunk",
    validator: (v) => ["cyberpunk", "medieval", "minimal"].includes(v),
  },
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
          console.log('Using cached location:', cityName);
        } else {
          console.log('Cache expired or invalid');
        }
      } catch (e) {
        console.log('Cache parse error:', e);
      }
    }

    // 如果没有有效缓存，尝试获取位置
    if (!latitude || !longitude) {
      console.log('Fetching location...');
      
      // API 1: ipapi.co (支持中文，更准确)
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
          console.log('ipapi.co response:', data);
          if (!data.error && data.latitude) {
            latitude = data.latitude;
            longitude = data.longitude;
            cityName = data.city || data.region || "未知位置";
            console.log('Location from ipapi.co:', cityName);
          }
        }
      } catch (e) {
        console.log('ipapi.co failed:', e.message);
      }
      
      // API 2: geolocation-db.com (备用)
      if (!latitude || !longitude) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const res = await fetch("https://geolocation-db.com/json/", {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            console.log('geolocation-db response:', data);
            if (data.latitude && data.longitude) {
              latitude = data.latitude;
              longitude = data.longitude;
              cityName = data.city || data.state || data.country_name || "未知位置";
              console.log('Location from geolocation-db:', cityName);
            }
          }
        } catch (e) {
          console.log('geolocation-db failed:', e.message);
        }
      }
      
      // 如果所有API都失败，使用默认位置
      if (!latitude || !longitude) {
        console.warn('All location APIs failed, using default location (Beijing)');
        latitude = 39.9042;
        longitude = 116.4074;
        cityName = "北京";
      } else if (!cityName || cityName === "Unknown") {
        cityName = "当前位置";
      }
      
      // 尝试获取中文地名（使用 OpenStreetMap 反向地理编码）
      if (cityName && (cityName === "未知位置" || cityName === "当前位置" || !cityName.includes('市') && !cityName.includes('省'))) {
        try {
          const geoController = new AbortController();
          const geoTimeout = setTimeout(() => geoController.abort(), 3000);
          
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-CN`,
            { signal: geoController.signal }
          );
          
          clearTimeout(geoTimeout);
          
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            console.log('Nominatim reverse geocoding:', geoData);
            
            // 提取中文地址：优先城市，其次区县，再其次省份
            const address = geoData.address;
            if (address) {
              const city = address.city || address.town || address.county;
              const state = address.state || address.province;
              
              if (city) {
                cityName = city;
              } else if (state) {
                cityName = state;
              }
              
              console.log('Chinese location name:', cityName);
            }
          }
        } catch (e) {
          console.log('Reverse geocoding failed:', e.message);
        }
      }
      
      // 缓存位置数据
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          latitude,
          longitude,
          city: cityName,
          timestamp: Date.now()
        }));
        console.log('Location cached:', cityName);
      } catch (e) {
        console.log('Cache save error:', e);
      }
    }

    city.value = cityName || "未知位置";

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
   卡片基础样式 - Cyberpunk 主题（默认）
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
   Medieval 主题 - 中世纪黄色风格
   ======================================== */
.card-sat.theme-medieval {
  background: linear-gradient(
    135deg,
    rgba(139, 119, 70, 0.8) 0%,
    rgba(160, 130, 80, 0.7) 50%,
    rgba(139, 119, 70, 0.8) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  border: 2px solid rgba(218, 165, 32, 0.5);
  border-radius: 14px;

  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 25px rgba(218, 165, 32, 0.1),
    0 0 20px rgba(218, 165, 32, 0.15);
}

.card-sat.theme-medieval:hover {
  border-color: rgba(255, 215, 0, 0.7);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.5),
    inset 0 0 35px rgba(255, 215, 0, 0.15),
    0 0 30px rgba(218, 165, 32, 0.3);
}

.card-sat.theme-medieval .card-info h3 {
  color: #ffd700;
  text-shadow: 0 0 12px rgba(218, 165, 32, 0.6);
  font-family: Georgia, 'Times New Roman', serif;
}

.card-sat.theme-medieval .card-info p {
  color: #f4e4c1;
  font-family: Georgia, 'Times New Roman', serif;
}

.card-sat.theme-medieval .card-glow {
  background: radial-gradient(circle, rgba(218, 165, 32, 0.15) 0%, transparent 60%);
}

.card-sat.theme-medieval .card-border {
  background: linear-gradient(
      135deg,
      rgba(218, 165, 32, 0.5),
      transparent 40%,
      transparent 60%,
      rgba(255, 215, 0, 0.5)
    )
    border-box;
}

.card-sat.theme-medieval .card-corner {
  border: 2px solid rgba(218, 165, 32, 0.6);
}

.card-sat.theme-medieval:hover .card-corner {
  border-color: rgba(255, 215, 0, 0.9);
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.6),
    inset 0 0 10px rgba(218, 165, 32, 0.3);
}

/* Medieval 主题的语录卡片 */
.card-sat.theme-medieval.card-quote .quote-text {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(218, 165, 32, 0.4);
}

.card-sat.theme-medieval.card-quote .quote-icon {
  color: rgba(255, 215, 0, 0.9);
}

.card-sat.theme-medieval.card-quote .quote-line-1,
.card-sat.theme-medieval.card-quote .quote-line-2 {
  color: #f4e4c1;
  text-shadow: 0 0 12px rgba(218, 165, 32, 0.5);
  font-family: Georgia, 'Times New Roman', serif;
}

/* Medieval 主题的日历卡片 */
.card-sat.theme-medieval.card-calendar .cal-header {
  border-bottom: 1px solid rgba(218, 165, 32, 0.3);
}

.card-sat.theme-medieval.card-calendar .cal-month {
  color: #ffd700;
  font-family: Georgia, 'Times New Roman', serif;
}

.card-sat.theme-medieval.card-calendar .cal-weekday {
  color: rgba(218, 165, 32, 0.7);
}

.card-sat.theme-medieval.card-calendar .cal-day {
  color: #f4e4c1;
  background: rgba(218, 165, 32, 0.08);
  border: 1px solid rgba(218, 165, 32, 0.2);
}

.card-sat.theme-medieval.card-calendar .cal-day.active {
  background: linear-gradient(135deg, #daa520, #ffd700);
  color: #fff;
  border-color: #ffd700;
  box-shadow: 0 0 15px rgba(218, 165, 32, 0.7);
}

/* Medieval 主题的天气卡片 */
.card-sat.theme-medieval.card-weather .weather-icon {
  filter: drop-shadow(0 0 20px rgba(218, 165, 32, 0.8));
}

.card-sat.theme-medieval.card-weather .weather-temp {
  color: #ffd700;
  text-shadow: 0 0 15px rgba(218, 165, 32, 0.7);
}

.card-sat.theme-medieval.card-weather .weather-city {
  color: #f4e4c1;
}

.card-sat.theme-medieval.card-weather .weather-details {
  background: rgba(139, 119, 70, 0.3);
  border: 1px solid rgba(218, 165, 32, 0.2);
  color: #f4e4c1;
}

/* ========================================
   Minimal 主题 - 简约毛玻璃效果
   ======================================== */
.card-sat.theme-minimal {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;

  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 0 25px rgba(255, 255, 255, 0.08);
}

.card-sat.theme-minimal:hover {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.2),
    inset 0 0 35px rgba(255, 255, 255, 0.12);
}

.card-sat.theme-minimal .card-info h3 {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.card-sat.theme-minimal .card-info p {
  color: rgba(255, 255, 255, 0.7);
}

.card-sat.theme-minimal .card-glow {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
}

.card-sat.theme-minimal .card-border {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.3),
      transparent 40%,
      transparent 60%,
      rgba(255, 255, 255, 0.3)
    )
    border-box;
}

.card-sat.theme-minimal .card-corner {
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-sat.theme-minimal:hover .card-corner {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.4),
    inset 0 0 10px rgba(255, 255, 255, 0.15);
}

/* Minimal 主题的语录卡片 */
.card-sat.theme-minimal.card-quote .quote-text {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-sat.theme-minimal.card-quote .quote-icon {
  color: rgba(255, 255, 255, 0.7);
}

.card-sat.theme-minimal.card-quote .quote-line-1,
.card-sat.theme-minimal.card-quote .quote-line-2 {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Minimal 主题的日历卡片 */
.card-sat.theme-minimal.card-calendar .cal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.card-sat.theme-minimal.card-calendar .cal-month {
  color: rgba(255, 255, 255, 0.9);
}

.card-sat.theme-minimal.card-calendar .cal-weekday {
  color: rgba(255, 255, 255, 0.6);
}

.card-sat.theme-minimal.card-calendar .cal-day {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.card-sat.theme-minimal.card-calendar .cal-day.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

/* Minimal 主题的天气卡片 */
.card-sat.theme-minimal.card-weather .weather-icon {
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2));
}

.card-sat.theme-minimal.card-weather .weather-temp {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.card-sat.theme-minimal.card-weather .weather-city {
  color: rgba(255, 255, 255, 0.8);
}

.card-sat.theme-minimal.card-weather .weather-details {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
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
  margin-bottom: 4px
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