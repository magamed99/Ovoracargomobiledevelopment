// Единый список городов для всей системы Ovora Cargo
// Используется водителями при создании объявлений и отправителями при поиске

export interface City {
  name: string;
  country: string;
  region?: string;
  lat?: number;
  lng?: number;
}

// Базовый список городов
const baseCities: City[] = [
  // Таджикистан (с координатами)
  { name: 'Душанбе', country: 'Таджикистан', region: 'Душанбе', lat: 38.5598, lng: 68.7738 },
  { name: 'Худжанд', country: 'Таджикистан', region: 'Согдийская область', lat: 40.2833, lng: 69.6333 },
  { name: 'Куляб', country: 'Таджикистан', region: 'Хатлонская область', lat: 37.9144, lng: 69.7850 },
  { name: 'Курган-Тюбе', country: 'Таджикистан', region: 'Хатлонская область', lat: 37.8354, lng: 68.7791 },
  { name: 'Истаравшан', country: 'Таджикистан', region: 'Согдийская область', lat: 39.9142, lng: 69.0014 },
  { name: 'Турсунзаде', country: 'Таджикистан', region: 'Районы республиканского подчинения', lat: 38.5097, lng: 68.2314 },
  { name: 'Вахдат', country: 'Таджикистан', region: 'Районы республиканского подчинения', lat: 38.5560, lng: 69.0445 },
  { name: 'Хорог', country: 'Таджикистан', region: 'Горно-Бадахшанская АО', lat: 37.4896, lng: 71.5533 },
  { name: 'Пенджикент', country: 'Таджикистан', region: 'Согдийская область', lat: 39.4969, lng: 67.5744 },
  { name: 'Канибадам', country: 'Таджикистан', region: 'Согдийская область', lat: 40.3056, lng: 70.4222 },
  { name: 'Исфара', country: 'Таджикистан', region: 'Согдийская область', lat: 40.1236, lng: 70.6250 },
  { name: 'Нурек', country: 'Таджикистан', region: 'Хатлонская область', lat: 38.3814, lng: 69.3267 },
  { name: 'Файзабад', country: 'Таджикистан', region: 'Согдийская область', lat: 40.2000, lng: 69.5000 },
  { name: 'Рогун', country: 'Таджикистан', region: 'Районы республиканского подчинения', lat: 38.6931, lng: 69.7442 },
  { name: 'Гиссар', country: 'Таджикистан', region: 'Районы республиканского подчинения', lat: 38.5275, lng: 68.5442 },
  { name: 'Бохтар', country: 'Таджикистан', region: 'Хатлонская область', lat: 37.8333, lng: 68.7667 },
  { name: 'Кангурт', country: 'Таджикистан', region: 'Согдийская область', lat: 39.8333, lng: 69.7167 },
  { name: 'Чкаловск', country: 'Таджикистан', region: 'Согдийская область', lat: 40.2644, lng: 69.6961 },
  { name: 'Вахш', country: 'Таджикистан', region: 'Хатлонская область' },
  { name: 'Сарбанд', country: 'Таджикистан', region: 'Хатлонская область' },

  // Рос��ия - Москва и Московская область
  { name: 'Москва', country: 'Россия', region: 'Москва', lat: 55.7558, lng: 37.6173 },
  { name: 'Подольск', country: 'Россия', region: 'Московская область' },
  { name: 'Балашиха', country: 'Россия', region: 'Московская область' },
  { name: 'Химки', country: 'Россия', region: 'Московская область' },
  { name: 'Королёв', country: 'Россия', region: 'Московская область' },
  { name: 'Мытищи', country: 'Россия', region: 'Московская область' },
  { name: 'Люберцы', country: 'Россия', region: 'Московская область' },
  { name: 'Красногорск', country: 'Россия', region: 'Московская область' },
  { name: 'Электросталь', country: 'Россия', region: 'Московская область' },
  { name: 'Коломна', country: 'Россия', region: 'Московская область' },
  { name: 'Одинцово', country: 'Россия', region: 'Московская область' },
  { name: 'Домодедово', country: 'Россия', region: 'Московская область' },
  { name: 'Серпухов', country: 'Россия', region: 'Московская область' },
  { name: 'Щёлково', country: 'Россия', region: 'Московская область' },
  { name: 'Орехово-Зуево', country: 'Россия', region: 'Московская область' },

  // Санкт-Петербург и Ленинградская область
  { name: 'Санкт-Петербург', country: 'Россия', region: 'Санкт-Петербург', lat: 59.9343, lng: 30.3351 },
  { name: 'Гатчина', country: 'Россия', region: 'Ленинградская область' },
  { name: 'Выборг', country: 'Россия', region: 'Ленинградская область' },
  { name: 'Колпино', country: 'Россия', region: 'Санкт-Петербург' },
  { name: 'Пушкин', country: 'Россия', region: 'Санкт-Петербург' },
  { name: 'Кронштадт', country: 'Россия', region: 'Санкт-Петербург' },

  // Крупные города России
  { name: 'Новосибирск', country: 'Россия', region: 'Новосибирская область', lat: 55.0084, lng: 82.9357 },
  { name: 'Екатеринбург', country: 'Россия', region: 'Свердловская область', lat: 56.8389, lng: 60.6057 },
  { name: 'Казань', country: 'Россия', region: 'Республика Татарстан' },
  { name: 'Нижний Новгород', country: 'Россия', region: 'Нижегородская область' },
  { name: 'Челя��инск', country: 'Россия', region: 'Челябинская область' },
  { name: 'Самара', country: 'Россия', region: 'Самарская область' },
  { name: 'Омск', country: 'Россия', region: 'Омская область' },
  { name: 'Ростов-на-Дону', country: 'Россия', region: 'Ростовская область' },
  { name: 'Уфа', country: 'Россия', region: 'Республика Башкортостан' },
  { name: 'Красноярск', country: 'Россия', region: 'Красноярский край' },
  { name: 'Воронеж', country: 'Россия', region: 'Воронежская область' },
  { name: 'Пермь', country: 'Россия', region: 'Пермский край' },
  { name: 'Волгоград', country: 'Россия', region: 'Волгоградская область' },
  { name: 'Краснодар', country: 'Россия', region: 'Краснодарский край' },
  { name: 'Саратов', country: 'Россия', region: 'Саратовская область' },
  { name: 'Тюмень', country: 'Россия', region: 'Тюменская область' },
  { name: 'Тольятти', country: 'Россия', region: 'Самарская область' },
  { name: 'Ижевск', country: 'Россия', region: 'Удмуртская Республика' },
  { name: 'Барнаул', country: 'Россия', region: 'Алтайский край' },
  { name: 'Ульяновск', country: 'Россия', region: 'Ульяновская область' },
  { name: 'Иркутск', country: 'Россия', region: 'Иркутская область' },
  { name: 'Хабаровск', country: 'Россия', region: 'Хабаровский край' },
  { name: 'Ярославль', country: 'Россия', region: 'Ярославская область' },
  { name: 'Владивосток', country: 'Россия', region: 'Приморский край' },
  { name: 'Махачкала', country: 'Россия', region: 'Республика Дагестан' },
  { name: 'Томск', country: 'Россия', region: 'Томская область' },
  { name: 'Оренбург', country: 'Россия', region: 'Оренбургская область' },
  { name: 'Кемерово', country: 'Россия', region: 'Кемеровская область' },
  { name: 'Новокузнецк', country: 'Россия', region: 'Кемеровская область' },
  { name: 'Рязань', country: 'Россия', region: 'Рязанская область' },
  { name: 'Астрахань', country: 'Россия', region: 'Астраханская область' },
  { name: 'Набережные Челны', country: 'Россия', region: 'Республика Татарстан' },
  { name: 'Пенза', country: 'Россия', region: 'Пензенская область' },
  { name: 'Липецк', country: 'Россия', region: 'Липецкая область' },
  { name: 'Киров', country: 'Россия', region: 'Кировская область' },
  { name: 'Чебоксары', country: 'Россия', region: 'Чувашская Республика' },
  { name: 'Тула', country: 'Россия', region: 'Тульская область' },
  { name: 'Калининград', country: 'Россия', region: 'Калининградская область' },
  { name: 'Брянск', country: 'Россия', region: 'Брянская область' },
  { name: 'Курск', country: 'Россия', region: 'Курская область' },
  { name: 'Иваново', country: 'Россия', region: 'Ивановская область' },
  { name: 'Магнитогорск', country: 'Россия', region: 'Челябинская область' },
  { name: 'Сочи', country: 'Россия', region: 'Краснодарский край' },
  { name: 'Курган', country: 'Россия', region: 'Курганская область' },
  { name: 'Ставрополь', country: 'Россия', region: 'Ставропольский край' },
  { name: 'Улан-Удэ', country: 'Россия', region: 'Республика Бурятия' },
  { name: 'Тверь', country: 'Россия', region: 'Тверская область' },
  { name: 'Смоленск', country: 'Россия', region: 'Смоленская область' },
  { name: 'Владимир', country: 'Россия', region: 'Владимирская область' },
  { name: 'Калуга', country: 'Россия', region: 'Калужская область' },
  { name: 'Чита', country: 'Россия', region: 'Забайкальский край' },
  { name: 'Сургут', country: 'Россия', region: 'Тюменская область' },
  { name: 'Владикавказ', country: 'Россия', region: 'Республика Северная Осетия' },
  { name: 'Белгород', country: 'Россия', region: 'Белгородская область' },
  { name: 'Архангельск', country: 'Россия', region: 'Архангельская область' },
  { name: 'Сыктывкар', country: 'Россия', region: 'Республика Коми' },
  { name: 'Мурманск', country: 'Россия', region: 'Мурманская область' },
  { name: 'Якутск', country: 'Россия', region: 'Республика Саха' },
  { name: 'Вологда', country: 'Россия', region: 'Вологодская область' },
  { name: 'Череповец', country: 'Россия', region: 'Вологодская область' },
  { name: 'Петрозаводск', country: 'Россия', region: 'Республика Карелия' },
  { name: 'Псков', country: 'Россия', region: 'Псковская область' },
  { name: 'Орёл', country: 'Россия', region: 'Орловская область' },
  { name: 'Тамбов', country: 'Россия', region: 'Тамбовская область' },
  { name: 'Кострома', country: 'Россия', region: 'Костромская область' },

  // Челябинская область (по запросу пользователя)
  { name: 'Чебаркуль', country: 'Россия', region: 'Челябинская область' },
  { name: 'Миасс', country: 'Россия', region: 'Челябинская область' },
  { name: 'Златоуст', country: 'Россия', region: 'Челябинская область' },
  { name: 'Копейск', country: 'Россия', region: 'Челябинская область' },
  { name: 'Озёрск', country: 'Россия', region: 'Челябинская область' },
  { name: 'Троицк', country: 'Россия', region: 'Челябинская область' },
  { name: 'Снежинск', country: 'Россия', region: 'Челябинская область' },

  // Дополнительные города
  { name: 'Южно-Сахалинск', country: 'Россия', region: 'Сахалинская область' },
  { name: 'Петропавловск-Камчатский', country: 'Россия', region: 'Камчатский край' },
  { name: 'Благовещенск', country: 'Россия', region: 'Амурская область' },
  { name: 'Нижневартовск', country: 'Россия', region: 'Тюменская область' },
  { name: 'Нижний Тагил', country: 'Россия', region: 'Свердловская область' },
  { name: 'Стерлитамак', country: 'Россия', region: 'Республика Башкортостан' },
  { name: 'Новороссийск', country: 'Россия', region: 'Краснодарский край' },
  { name: 'Йошкар-Ола', country: 'Россия', region: 'Республика Марий Эл' },
  { name: 'Каменск-Уральский', country: 'Россия', region: 'Свердловская область' },
  { name: 'Старый Оскол', country: 'Россия', region: 'Белгородская область' },
  { name: 'Бийск', country: 'Россия', region: 'Алтайский край' },
  { name: 'Прокопьевск', country: 'Россия', region: 'Кемеровская область' },
  { name: 'Таганрог', country: 'Россия', region: 'Ростовская область' },
  { name: 'Рыбинск', country: 'Россия', region: 'Ярославская область' },
  { name: 'Армавир', country: 'Россия', region: 'Краснодарский край' },
  { name: 'Норильск', country: 'Россия', region: 'Красноярский край' },
  { name: 'Абакан', country: 'Россия', region: 'Республика Хакасия' },
  { name: 'Братск', country: 'Россия', region: 'Иркутская область' },
  { name: 'Грозный', country: 'Россия', region: 'Чеченская Республика' },
];

// LocalStorage ключ для хранения городов, добавленных водителями
const CUSTOM_CITIES_KEY = 'ovora_custom_cities';

// Загрузить города, добавленные водителями из localStorage
export function getCustomCities(): City[] {
  try {
    const stored = localStorage.getItem(CUSTOM_CITIES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as City[];
  } catch (error) {
    console.error('Error loading custom cities:', error);
    return [];
  }
}

// Сохранить новый город (только для водителей)
export function addCustomCity(city: City, userRole: string): boolean {
  if (userRole !== 'driver') {
    console.warn('Only drivers can add new cities');
    return false;
  }

  try {
    const customCities = getCustomCities();
    
    // Проверка: город уже существует?
    const allCities = [...baseCities, ...customCities];
    const exists = allCities.some(
      c => c.name.toLowerCase() === city.name.toLowerCase() && 
           c.country.toLowerCase() === city.country.toLowerCase()
    );
    
    if (exists) {
      console.warn('City already exists');
      return false;
    }

    // Добавить новый город
    customCities.push(city);
    localStorage.setItem(CUSTOM_CITIES_KEY, JSON.stringify(customCities));
    return true;
  } catch (error) {
    console.error('Error adding custom city:', error);
    return false;
  }
}

// Получить все города (базовые + добавленные водителями)
export function getAllCities(): City[] {
  const customCities = getCustomCities();
  return [...baseCities, ...customCities];
}

// Функция поиска городов по введённому тексту
export function searchCities(query: string): City[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const allCities = getAllCities();
  
  return allCities.filter(city => 
    city.name.toLowerCase().startsWith(searchTerm) ||
    city.name.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Ограничиваем до 10 результатов
}

// Получить название города с указанием страны
export function getCityWithCountry(city: City): string {
  return `${city.name}, ${city.country}`;
}