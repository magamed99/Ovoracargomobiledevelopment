/**
 * 🌤️ Weather API - получение погоды по координатам
 * Использует OpenWeatherMap API (бесплатный)
 */

export interface WeatherData {
  condition: 'clear' | 'rain' | 'cloudy' | 'snow' | 'drizzle' | 'fog' | 'unknown';
  temp: number;
  description: string;
  source?: 'gps' | 'city' | 'mock'; // Источник данных (GPS, город или моковые)
  city?: string; // Название города (если используется город)
}

/**
 * Получить погоду по координатам
 * 
 * ⚠️ ИНСТРУКЦИЯ ПО ПОЛУЧЕНИЮ API КЛЮЧА:
 * 1. Зарегистрируйтесь на https://openweathermap.org/api
 * 2. Получите бесплатный API ключ (до 1000 запросов/день бесплатно)
 * 3. Добавьте его в Supabase секреты как OPENWEATHER_API_KEY
 * 4. Пока ключа нет, используется моковая погода
 */
export async function getWeatherByCoords(
  lat: number, 
  lon: number, 
  source: 'gps' | 'city' = 'gps',
  cityName?: string
): Promise<WeatherData> {
  try {
    // Пытаемся получить ключ из переменной окружения (если настроено на сервере)
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
    
    // Если ключа нет, используем фолбэк (без логов в консоль)
    if (!API_KEY || API_KEY === '') {
      return { ...getFallbackWeather(), source: 'mock', city: cityName };
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`;
    
    const response = await fetch(url);
    
    // При ошибке 401 (неверный ключ) - тихо переходим на фолбэк
    if (response.status === 401) {
      return { ...getFallbackWeather(), source: 'mock', city: cityName };
    }
    
    if (!response.ok) {
      return { ...getFallbackWeather(), source: 'mock', city: cityName };
    }
    
    const data = await response.json();
    
    // Преобразуем код погоды OpenWeatherMap в наши условия
    const weatherCode = data.weather[0]?.id || 800;
    const condition = mapWeatherCode(weatherCode);
    
    return {
      condition,
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description || 'Неизвестно',
      source,
      city: cityName || data.name,
    };
  } catch (error) {
    // Тихая обработка ошибок - просто возвращаем фолбэк
    return { ...getFallbackWeather(), source: 'mock', city: cityName };
  }
}

/**
 * Получить текущее местоположение пользователя
 */
export async function getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        resolve(coords);
      },
      (error) => {
        // Это НЕ ошибка - просто используем альтернативный метод (координаты города)
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Кэш на 5 минут
      }
    );
  });
}

/**
 * Преобразовать код погоды OpenWeatherMap в наше условие
 */
function mapWeatherCode(code: number): WeatherData['condition'] {
  // Гроза
  if (code >= 200 && code < 300) return 'rain';
  
  // Морось
  if (code >= 300 && code < 400) return 'drizzle';
  
  // Дождь
  if (code >= 500 && code < 600) return 'rain';
  
  // Снег
  if (code >= 600 && code < 700) return 'snow';
  
  // Туман/дымка
  if (code >= 700 && code < 800) return 'fog';
  
  // Ясно
  if (code === 800) return 'clear';
  
  // Облачно
  if (code > 800 && code < 900) return 'cloudy';
  
  return 'unknown';
}

/**
 * Запасной вариант погоды (если API недоступен)
 * Интеллектуальная моковая погода на основе времени суток и сезона
 */
function getFallbackWeather(): WeatherData {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11
  
  // Определяем сезон (для Таджикистана)
  const isWinter = month >= 11 || month <= 1; // Декабрь-Февраль
  const isSpring = month >= 2 && month <= 4; // Март-Май
  const isSummer = month >= 5 && month <= 8; // Июнь-Сентябрь
  const isAutumn = month >= 9 && month <= 10; // Октябрь-Ноябрь
  
  // Зима (холодно, возможен снег)
  if (isWinter) {
    if (hour >= 6 && hour < 20) {
      return { condition: 'cloudy', temp: 5, description: 'Облачно' };
    }
    return { condition: 'snow', temp: -2, description: 'Снег' };
  }
  
  // Весна (переменчиво)
  if (isSpring) {
    if (hour >= 10 && hour < 16) {
      return { condition: 'clear', temp: 18, description: 'Ясно' };
    }
    return { condition: 'cloudy', temp: 12, description: 'Облачно' };
  }
  
  // Лето (жарко и солнечно)
  if (isSummer) {
    if (hour >= 6 && hour < 20) {
      return { condition: 'clear', temp: 32, description: 'Ясно' };
    }
    return { condition: 'clear', temp: 24, description: 'Ясно' };
  }
  
  // Осень (прохладно, возможен дождь)
  if (isAutumn) {
    if (hour >= 12 && hour < 18) {
      return { condition: 'cloudy', temp: 16, description: 'Облачно' };
    }
    return { condition: 'drizzle', temp: 10, description: 'Морось' };
  }
  
  // По умолчанию
  return { condition: 'clear', temp: 20, description: 'Ясно' };
}

/**
 * Получить примерное местоположение из маршрута поездки
 * (используется как фолбэк, если геолокация недоступна)
 */
export function getApproximateLocation(fromCity: string): { lat: number; lon: number } | null {
  if (!fromCity || fromCity.trim() === '') {
    return { lat: 38.5598, lon: 68.7738 }; // Душанбе
  }
  
  // Координаты основных городов Таджикистана с вариантами написания
  const cities: Record<string, { lat: number; lon: number; aliases: string[] }> = {
    'Душанбе': { 
      lat: 38.5598, 
      lon: 68.7738,
      aliases: ['душанбе', 'dushanbe', 'dušanbe', 'душанбэ']
    },
    'Худжанд': { 
      lat: 40.2828, 
      lon: 69.6229,
      aliases: ['худжанд', 'khujand', 'xujand', 'ходжент', 'khojand']
    },
    'Курган-Тюбе': { 
      lat: 37.8348, 
      lon: 68.7791,
      aliases: ['курган-тюбе', 'курган тюбе', 'qurghonteppa', 'қурғонтеппа', 'курганте́ппа']
    },
    'Куляб': { 
      lat: 37.9144, 
      lon: 69.7850,
      aliases: ['куляб', 'kulob', 'kulyab', 'кӯлоб']
    },
    'Хорог': { 
      lat: 37.4896, 
      lon: 71.5533,
      aliases: ['хорог', 'khorog', 'xoroғ', 'khorugh']
    },
    'Турсунзаде': { 
      lat: 38.5098, 
      lon: 68.2312,
      aliases: ['турсунзаде', 'tursunzoda', 'tursunzade', 'турсунзода']
    },
    'Истаравшан': { 
      lat: 39.9142, 
      lon: 69.0033,
      aliases: ['истаравшан', 'istaravshan', 'истравшан', 'ура-тюбе', 'ура тюбе']
    },
    'Вахдат': { 
      lat: 38.5569, 
      lon: 69.0136,
      aliases: ['вахдат', 'vahdat', 'waḩdat', 'вахдад']
    },
    'Канибадам': { 
      lat: 40.2969, 
      lon: 70.3881,
      aliases: ['канибадам', 'konibodom', 'kanibadam', 'канибодом']
    },
    'Исфара': { 
      lat: 40.1244, 
      lon: 70.6250,
      aliases: ['исфара', 'isfara', 'исфаро']
    },
  };
  
  // Нормализуем строку поиска (убираем лишние пробелы, приводим к нижнему регистру)
  const normalizedSearch = fromCity.toLowerCase().trim();
  
  // Ищем город в строке (с учётом вариантов написания)
  for (const [city, data] of Object.entries(cities)) {
    // Проверяем основное название
    if (normalizedSearch.includes(city.toLowerCase())) {
      return { lat: data.lat, lon: data.lon };
    }
    
    // Проверяем все варианты написания
    for (const alias of data.aliases) {
      if (normalizedSearch.includes(alias.toLowerCase())) {
        return { lat: data.lat, lon: data.lon };
      }
    }
  }
  
  // По умолчанию - Душанбе
  return { lat: 38.5598, lon: 68.7738 };
}