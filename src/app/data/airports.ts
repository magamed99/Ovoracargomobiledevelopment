// ── Статическая база аэропортов для модуля AVIA ─────────────────────────────
// ~350 аэропортов: СНГ + мировые хабы
// Поиск по: city (рус), cityEn (англ), code (IATA), name (аэропорт)

export interface Airport {
  code: string;       // IATA
  name: string;       // Название аэропорта
  city: string;       // Город (рус)
  cityEn: string;     // Город (англ)
  country: string;    // Страна (рус)
  countryCode: string; // ISO 2
}

export const airports: Airport[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ТАДЖИКИСТАН
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'DYU', name: 'Душанбе',         city: 'Душанбе',    cityEn: 'Dushanbe',   country: 'Таджикистан', countryCode: 'TJ' },
  { code: 'LBD', name: 'Худжанд',         city: 'Худжанд',    cityEn: 'Khujand',    country: 'Таджикистан', countryCode: 'TJ' },
  { code: 'TJU', name: 'Куляб',           city: 'Куляб',      cityEn: 'Kulob',      country: 'Таджикистан', countryCode: 'TJ' },
  { code: 'KQT', name: 'Курган-Тюбе',     city: 'Бохтар',     cityEn: 'Bokhtar',    country: 'Таджикистан', countryCode: 'TJ' },

  // ═══════════════════════════════════════════════════════════════════════════
  // УЗБЕКИСТАН
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'TAS', name: 'Ислам Каримов',      city: 'Ташкент',       cityEn: 'Tashkent',     country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'SKD', name: 'Самарканд',           city: 'Самарканд',     cityEn: 'Samarkand',    country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'BHK', name: 'Бухара',              city: 'Бухара',        cityEn: 'Bukhara',      country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'FEG', name: 'Фергана',             city: 'Фергана',       cityEn: 'Fergana',      country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'NMA', name: 'Наманган',             city: 'Наманган',      cityEn: 'Namangan',     country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'AZN', name: 'Андижан',             city: 'Андижан',       cityEn: 'Andijan',      country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'NCU', name: 'Нукус',               city: 'Нукус',         cityEn: 'Nukus',        country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'UGC', name: 'Ургенч',              city: 'Ургенч',        cityEn: 'Urgench',      country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'NVI', name: 'Навои',               city: 'Навои',         cityEn: 'Navoi',        country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'TMJ', name: 'Термез',              city: 'Термез',        cityEn: 'Termez',       country: 'Узбекистан', countryCode: 'UZ' },
  { code: 'KSQ', name: 'Карши',               city: 'Карши',         cityEn: 'Karshi',       country: 'Узбекистан', countryCode: 'UZ' },

  // ═══════════════════════════════════════════════════════════════════════════
  // КАЗАХСТАН
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'ALA', name: 'Алматы',              city: 'Алматы',        cityEn: 'Almaty',       country: 'Казахстан', countryCode: 'KZ' },
  { code: 'NQZ', name: 'Нурсултан Назарбаев', city: 'Астана',        cityEn: 'Astana',       country: 'Казахстан', countryCode: 'KZ' },
  { code: 'CIT', name: 'Шымкент',             city: 'Шымкент',       cityEn: 'Shymkent',     country: 'Казахстан', countryCode: 'KZ' },
  { code: 'GUW', name: 'Атырау',              city: 'Атырау',        cityEn: 'Atyrau',       country: 'Казахстан', countryCode: 'KZ' },
  { code: 'SCO', name: 'Актау',               city: 'Актау',         cityEn: 'Aktau',        country: 'Казахстан', countryCode: 'KZ' },
  { code: 'AKX', name: 'Актобе',              city: 'Актобе',        cityEn: 'Aktobe',       country: 'Казахстан', countryCode: 'KZ' },
  { code: 'KGF', name: 'Караганда',           city: 'Караганда',     cityEn: 'Karaganda',    country: 'Казахстан', countryCode: 'KZ' },
  { code: 'PWQ', name: 'Павлодар',            city: 'Павлодар',      cityEn: 'Pavlodar',     country: 'Казахстан', countryCode: 'KZ' },
  { code: 'URA', name: 'Уральск',             city: 'Уральск',       cityEn: 'Uralsk',       country: 'Казахстан', countryCode: 'KZ' },
  { code: 'DMB', name: 'Тараз',               city: 'Тараз',         cityEn: 'Taraz',        country: 'Казахстан', countryCode: 'KZ' },
  { code: 'KSN', name: 'Костанай',            city: 'Костанай',      cityEn: 'Kostanay',     country: 'Казахстан', countryCode: 'KZ' },
  { code: 'PPK', name: 'Петропавловск',       city: 'Петропавловск', cityEn: 'Petropavlovsk', country: 'Казахстан', countryCode: 'KZ' },
  { code: 'PLX', name: 'Семей',               city: 'Семей',         cityEn: 'Semey',        country: 'Казахстан', countryCode: 'KZ' },
  { code: 'KZO', name: 'Кызылорда',           city: 'Кызылорда',     cityEn: 'Kyzylorda',    country: 'Казахстан', countryCode: 'KZ' },
  { code: 'TDK', name: 'Талдыкорган',         city: 'Талдыкорган',   cityEn: 'Taldykorgan',  country: 'Казахстан', countryCode: 'KZ' },
  { code: 'DZN', name: 'Жезказган',           city: 'Жезказган',     cityEn: 'Zhezkazgan',   country: 'Казахстан', countryCode: 'KZ' },

  // ═══════════════════════════════════════════════════════════════════════════
  // КЫРГЫЗСТАН
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'FRU', name: 'Манас',               city: 'Бишкек',    cityEn: 'Bishkek',  country: 'Кыргызстан', countryCode: 'KG' },
  { code: 'OSS', name: 'Ош',                  city: 'Ош',        cityEn: 'Osh',      country: 'Кыргызстан', countryCode: 'KG' },
  { code: 'IKU', name: 'Тамчы',               city: 'Иссык-Куль', cityEn: 'Issyk-Kul', country: 'Кыргызстан', countryCode: 'KG' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ТУРКМЕНИСТАН
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'ASB', name: 'Ашхабад',             city: 'Ашхабад',      cityEn: 'Ashgabat',    country: 'Туркменистан', countryCode: 'TM' },
  { code: 'CRZ', name: 'Туркменабат',         city: 'Туркменабат',  cityEn: 'Turkmenabat', country: 'Туркменистан', countryCode: 'TM' },
  { code: 'MYP', name: 'Мары',                city: 'Мары',         cityEn: 'Mary',        country: 'Туркменистан', countryCode: 'TM' },
  { code: 'KRW', name: 'Туркменбаши',         city: 'Туркменбаши',  cityEn: 'Turkmenbashi', country: 'Туркменистан', countryCode: 'TM' },
  { code: 'TAZ', name: 'Дашогуз',             city: 'Дашогуз',      cityEn: 'Dashoguz',    country: 'Туркменистан', countryCode: 'TM' },

  // ═══════════════════════════════════════════════════════════════════════════
  // РОССИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  // Москва
  { code: 'SVO', name: 'Шереметьево',         city: 'Москва',           cityEn: 'Moscow',          country: 'Россия', countryCode: 'RU' },
  { code: 'DME', name: 'Домодедово',          city: 'Москва',           cityEn: 'Moscow',          country: 'Россия', countryCode: 'RU' },
  { code: 'VKO', name: 'Внуково',             city: 'Москва',           cityEn: 'Moscow',          country: 'Россия', countryCode: 'RU' },
  { code: 'ZIA', name: 'Жуковский',           city: 'Москва',           cityEn: 'Moscow',          country: 'Россия', countryCode: 'RU' },
  // Санкт-Петербург
  { code: 'LED', name: 'Пулково',             city: 'Санкт-Петербург',  cityEn: 'Saint Petersburg', country: 'Россия', countryCode: 'RU' },
  // Крупные города
  { code: 'OVB', name: 'Толмачёво',           city: 'Новосибирск',      cityEn: 'Novosibirsk',     country: 'Россия', countryCode: 'RU' },
  { code: 'SVX', name: 'Кольцово',            city: 'Екатеринбург',     cityEn: 'Yekaterinburg',   country: 'Россия', countryCode: 'RU' },
  { code: 'KZN', name: 'Казань',              city: 'Казань',           cityEn: 'Kazan',           country: 'Россия', countryCode: 'RU' },
  { code: 'ROV', name: 'Платов',              city: 'Ростов-на-Дону',   cityEn: 'Rostov-on-Don',   country: 'Россия', countryCode: 'RU' },
  { code: 'UFA', name: 'Уфа',                 city: 'Уфа',             cityEn: 'Ufa',             country: 'Россия', countryCode: 'RU' },
  { code: 'KRR', name: 'Пашковский',          city: 'Краснодар',        cityEn: 'Krasnodar',       country: 'Россия', countryCode: 'RU' },
  { code: 'AER', name: 'Сочи',                city: 'Сочи',             cityEn: 'Sochi',           country: 'Россия', countryCode: 'RU' },
  { code: 'KUF', name: 'Курумоч',             city: 'Самара',           cityEn: 'Samara',          country: 'Россия', countryCode: 'RU' },
  { code: 'VOG', name: 'Гумрак',              city: 'Волгоград',        cityEn: 'Volgograd',       country: 'Россия', countryCode: 'RU' },
  { code: 'CEK', name: 'Баландино',           city: 'Челябинск',        cityEn: 'Chelyabinsk',     country: 'Россия', countryCode: 'RU' },
  { code: 'PEE', name: 'Пермь',               city: 'Пермь',            cityEn: 'Perm',            country: 'Россия', countryCode: 'RU' },
  { code: 'GOJ', name: 'Стригино',            city: 'Нижний Новгород',  cityEn: 'Nizhny Novgorod', country: 'Россия', countryCode: 'RU' },
  { code: 'OMS', name: 'Омск',                city: 'Омск',             cityEn: 'Omsk',            country: 'Россия', countryCode: 'RU' },
  { code: 'TJM', name: 'Рощино',              city: 'Тюмень',           cityEn: 'Tyumen',          country: 'Россия', countryCode: 'RU' },
  { code: 'KJA', name: 'Емельяново',          city: 'Красноярск',       cityEn: 'Krasnoyarsk',     country: 'Россия', countryCode: 'RU' },
  { code: 'VRN', name: 'Чертовицкое',         city: 'Воронеж',          cityEn: 'Voronezh',        country: 'Россия', countryCode: 'RU' },
  { code: 'RTW', name: 'Гагарин',             city: 'Саратов',          cityEn: 'Saratov',         country: 'Россия', countryCode: 'RU' },
  { code: 'MCX', name: 'Уйташ',              city: 'Махачкала',        cityEn: 'Makhachkala',     country: 'Россия', countryCode: 'RU' },
  { code: 'MRV', name: 'Минеральные Воды',    city: 'Минеральные Воды', cityEn: 'Mineralnye Vody', country: 'Россия', countryCode: 'RU' },
  { code: 'IKT', name: 'Иркутск',             city: 'Иркутск',          cityEn: 'Irkutsk',         country: 'Россия', countryCode: 'RU' },
  { code: 'KHV', name: 'Хабаровск-Новый',     city: 'Хабаровск',        cityEn: 'Khabarovsk',      country: 'Россия', countryCode: 'RU' },
  { code: 'VVO', name: 'Кневичи',             city: 'Владивосток',      cityEn: 'Vladivostok',     country: 'Россия', countryCode: 'RU' },
  { code: 'SGC', name: 'Сургут',              city: 'Сургут',           cityEn: 'Surgut',          country: 'Россия', countryCode: 'RU' },
  { code: 'YKS', name: 'Якутск',              city: 'Якутск',           cityEn: 'Yakutsk',         country: 'Россия', countryCode: 'RU' },
  { code: 'KGD', name: 'Храброво',            city: 'Калининград',      cityEn: 'Kaliningrad',     country: 'Россия', countryCode: 'RU' },
  { code: 'STW', name: 'Ставрополь',          city: 'Ставрополь',       cityEn: 'Stavropol',       country: 'Россия', countryCode: 'RU' },
  { code: 'GRV', name: 'Грозный',             city: 'Грозный',          cityEn: 'Grozny',          country: 'Россия', countryCode: 'RU' },
  { code: 'NOZ', name: 'Спиченково',          city: 'Новокузнецк',      cityEn: 'Novokuznetsk',    country: 'Россия', countryCode: 'RU' },
  { code: 'BAX', name: 'Барнаул',             city: 'Барнаул',          cityEn: 'Barnaul',         country: 'Россия', countryCode: 'RU' },
  { code: 'UUD', name: 'Мухино',              city: 'Улан-Удэ',         cityEn: 'Ulan-Ude',        country: 'Россия', countryCode: 'RU' },
  { code: 'AAQ', name: 'Витязево',            city: 'Анапа',            cityEn: 'Anapa',           country: 'Россия', countryCode: 'RU' },
  { code: 'ARH', name: 'Талаги',              city: 'Архангельск',      cityEn: 'Arkhangelsk',     country: 'Россия', countryCode: 'RU' },
  { code: 'MMK', name: 'Мурманск',            city: 'Мурманск',         cityEn: 'Murmansk',        country: 'Россия', countryCode: 'RU' },
  { code: 'NBC', name: 'Бегишево',            city: 'Набережные Челны', cityEn: 'Naberezhnye Chelny', country: 'Россия', countryCode: 'RU' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ТУРЦИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'IST', name: 'Стамбул',             city: 'Стамбул',    cityEn: 'Istanbul',  country: 'Турция', countryCode: 'TR' },
  { code: 'SAW', name: 'Сабиха Гёкчен',       city: 'Стамбул',    cityEn: 'Istanbul',  country: 'Турция', countryCode: 'TR' },
  { code: 'AYT', name: 'Анталья',             city: 'Анталья',    cityEn: 'Antalya',   country: 'Турция', countryCode: 'TR' },
  { code: 'ESB', name: 'Эсенбога',            city: 'Анкара',     cityEn: 'Ankara',    country: 'Турция', countryCode: 'TR' },
  { code: 'ADB', name: 'Аднан Мендерес',      city: 'Измир',      cityEn: 'Izmir',     country: 'Турция', countryCode: 'TR' },
  { code: 'DLM', name: 'Даламан',             city: 'Даламан',    cityEn: 'Dalaman',   country: 'Турция', countryCode: 'TR' },
  { code: 'BJV', name: 'Бодрум',              city: 'Бодрум',     cityEn: 'Bodrum',    country: 'Турция', countryCode: 'TR' },
  { code: 'TZX', name: 'Трабзон',             city: 'Трабзон',    cityEn: 'Trabzon',   country: 'Турция', countryCode: 'TR' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ОАЭ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'DXB', name: 'Дубай',               city: 'Дубай',      cityEn: 'Dubai',      country: 'ОАЭ', countryCode: 'AE' },
  { code: 'DWC', name: 'Аль-Мактум',          city: 'Дубай',      cityEn: 'Dubai',      country: 'ОАЭ', countryCode: 'AE' },
  { code: 'AUH', name: 'Абу-Даби',            city: 'Абу-Даби',   cityEn: 'Abu Dhabi',  country: 'ОАЭ', countryCode: 'AE' },
  { code: 'SHJ', name: 'Шарджа',              city: 'Шарджа',     cityEn: 'Sharjah',    country: 'ОАЭ', countryCode: 'AE' },

  // ═══════════════════════════════════════════════════════════════════════════
  // КИТАЙ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'PEK', name: 'Шоуду',               city: 'Пекин',       cityEn: 'Beijing',    country: 'Китай', countryCode: 'CN' },
  { code: 'PKX', name: 'Дасин',               city: 'Пекин',       cityEn: 'Beijing',    country: 'Китай', countryCode: 'CN' },
  { code: 'PVG', name: 'Пудун',               city: 'Шанхай',      cityEn: 'Shanghai',   country: 'Китай', countryCode: 'CN' },
  { code: 'SHA', name: 'Хунцяо',              city: 'Шанхай',      cityEn: 'Shanghai',   country: 'Китай', countryCode: 'CN' },
  { code: 'CAN', name: 'Байюнь',              city: 'Гуанчжоу',    cityEn: 'Guangzhou',  country: 'Китай', countryCode: 'CN' },
  { code: 'SZX', name: 'Баоань',              city: 'Шэньчжэнь',   cityEn: 'Shenzhen',   country: 'Китай', countryCode: 'CN' },
  { code: 'CTU', name: 'Тяньфу',              city: 'Чэнду',       cityEn: 'Chengdu',    country: 'Китай', countryCode: 'CN' },
  { code: 'URC', name: 'Дивопу',              city: 'Урумчи',      cityEn: 'Urumqi',     country: 'Китай', countryCode: 'CN' },
  { code: 'HRB', name: 'Тайпин',              city: 'Харбин',      cityEn: 'Harbin',     country: 'Китай', countryCode: 'CN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ЮЖНАЯ КОРЕЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'ICN', name: 'Инчхон',              city: 'Сеул',        cityEn: 'Seoul',   country: 'Южная Корея', countryCode: 'KR' },
  { code: 'GMP', name: 'Гимпхо',              city: 'Сеул',        cityEn: 'Seoul',   country: 'Южная Корея', countryCode: 'KR' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ЯПОНИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'NRT', name: 'Нарита',              city: 'Токио',       cityEn: 'Tokyo',   country: 'Япония', countryCode: 'JP' },
  { code: 'HND', name: 'Ханеда',              city: 'Токио',       cityEn: 'Tokyo',   country: 'Япония', countryCode: 'JP' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ИНДИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'DEL', name: 'Индира Ганди',        city: 'Дели',        cityEn: 'Delhi',     country: 'Индия', countryCode: 'IN' },
  { code: 'BOM', name: 'Чатрапати Шиваджи',   city: 'Мумбаи',      cityEn: 'Mumbai',    country: 'Индия', countryCode: 'IN' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ЕВРОПА
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'FRA', name: 'Франкфурт',           city: 'Франкфурт',   cityEn: 'Frankfurt', country: 'Германия', countryCode: 'DE' },
  { code: 'MUC', name: 'Мюнхен',              city: 'Мюнхен',      cityEn: 'Munich',    country: 'Германия', countryCode: 'DE' },
  { code: 'BER', name: 'Берлин-Бранденбург',  city: 'Берлин',      cityEn: 'Berlin',    country: 'Германия', countryCode: 'DE' },
  { code: 'LHR', name: 'Хитроу',              city: 'Лондон',      cityEn: 'London',    country: 'Великобритания', countryCode: 'GB' },
  { code: 'CDG', name: 'Шарль де Голль',      city: 'Париж',       cityEn: 'Paris',     country: 'Франция', countryCode: 'FR' },
  { code: 'FCO', name: 'Фьюмичино',           city: 'Рим',         cityEn: 'Rome',      country: 'Италия', countryCode: 'IT' },
  { code: 'MXP', name: 'Мальпенса',           city: 'Милан',       cityEn: 'Milan',     country: 'Италия', countryCode: 'IT' },
  { code: 'BCN', name: 'Эль-Прат',            city: 'Барселона',   cityEn: 'Barcelona', country: 'Испания', countryCode: 'ES' },
  { code: 'MAD', name: 'Барахас',             city: 'Мадрид',      cityEn: 'Madrid',    country: 'Испания', countryCode: 'ES' },
  { code: 'AMS', name: 'Схипхол',             city: 'Амстердам',   cityEn: 'Amsterdam', country: 'Нидерланды', countryCode: 'NL' },
  { code: 'ZRH', name: 'Цюрих',               city: 'Цюрих',       cityEn: 'Zurich',    country: 'Швейцария', countryCode: 'CH' },
  { code: 'VIE', name: 'Вена',                city: 'Вена',        cityEn: 'Vienna',    country: 'Австрия', countryCode: 'AT' },
  { code: 'PRG', name: 'Вацлав Гавел',        city: 'Прага',       cityEn: 'Prague',    country: 'Чехия', countryCode: 'CZ' },
  { code: 'WAW', name: 'Шопен',               city: 'Варшава',     cityEn: 'Warsaw',    country: 'Польша', countryCode: 'PL' },
  { code: 'ATH', name: 'Элефтериос Венизелос', city: 'Афины',       cityEn: 'Athens',    country: 'Греция', countryCode: 'GR' },
  { code: 'HEL', name: 'Хельсинки-Вантаа',    city: 'Хельсинки',   cityEn: 'Helsinki',  country: 'Финляндия', countryCode: 'FI' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ГРУЗИЯ, АЗЕРБАЙДЖАН, АРМЕНИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'TBS', name: 'Тбилиси',             city: 'Тбилиси',     cityEn: 'Tbilisi',   country: 'Грузия', countryCode: 'GE' },
  { code: 'BUS', name: 'Батуми',              city: 'Батуми',      cityEn: 'Batumi',    country: 'Грузия', countryCode: 'GE' },
  { code: 'KUT', name: 'Кутаиси',             city: 'Кутаиси',     cityEn: 'Kutaisi',   country: 'Грузия', countryCode: 'GE' },
  { code: 'GYD', name: 'Гейдар Алиев',        city: 'Баку',        cityEn: 'Baku',      country: 'Азербайджан', countryCode: 'AZ' },
  { code: 'EVN', name: 'Звартноц',            city: 'Ереван',      cityEn: 'Yerevan',   country: 'Армения', countryCode: 'AM' },

  // ═══════════════════════════════════════════════════════════════════════════
  // БЕЛАРУСЬ, УКРАИНА, МОЛДОВА
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'MSQ', name: 'Минск-2',             city: 'Минск',       cityEn: 'Minsk',     country: 'Беларусь', countryCode: 'BY' },

  // ═══════════════════════════════════════════════════════════════════════════
  // БЛИЖНИЙ ВОСТОК
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'DOH', name: 'Хамад',               city: 'Доха',        cityEn: 'Doha',      country: 'Катар', countryCode: 'QA' },
  { code: 'JED', name: 'Джидда',              city: 'Джидда',      cityEn: 'Jeddah',    country: 'Саудовская Аравия', countryCode: 'SA' },
  { code: 'RUH', name: 'Эр-Рияд',            city: 'Эр-Рияд',     cityEn: 'Riyadh',    country: 'Саудовская Аравия', countryCode: 'SA' },
  { code: 'TLV', name: 'Бен-Гурион',          city: 'Тель-Авив',   cityEn: 'Tel Aviv',  country: 'Израиль', countryCode: 'IL' },
  { code: 'IKA', name: 'Имам Хомейни',        city: 'Тегеран',     cityEn: 'Tehran',    country: 'Иран', countryCode: 'IR' },
  { code: 'KBL', name: 'Кабул',               city: 'Кабул',       cityEn: 'Kabul',     country: 'Афганистан', countryCode: 'AF' },
  { code: 'ISB', name: 'Исламабад',           city: 'Исламабад',   cityEn: 'Islamabad', country: 'Пакистан', countryCode: 'PK' },

  // ═══════════════════════════════════════════════════════════════════════════
  // АМЕРИКА
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'JFK', name: 'Кеннеди',             city: 'Нью-Йорк',   cityEn: 'New York',    country: 'США', countryCode: 'US' },
  { code: 'LAX', name: 'Лос-Анджелес',        city: 'Лос-Анджелес', cityEn: 'Los Angeles', country: 'США', countryCode: 'US' },
  { code: 'ORD', name: "О'Хара",              city: 'Чикаго',      cityEn: 'Chicago',     country: 'США', countryCode: 'US' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ЕГИПЕТ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'CAI', name: 'Каир',                city: 'Каир',        cityEn: 'Cairo',      country: 'Египет', countryCode: 'EG' },
  { code: 'HRG', name: 'Хургада',             city: 'Хургада',     cityEn: 'Hurghada',   country: 'Египет', countryCode: 'EG' },
  { code: 'SSH', name: 'Шарм-эль-Шейх',       city: 'Шарм-эль-Шейх', cityEn: 'Sharm El Sheikh', country: 'Египет', countryCode: 'EG' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ТАИЛАНД, МАЛАЙЗИЯ
  // ═══════════════════════════════════════════════════════════════════════════
  { code: 'BKK', name: 'Суварнабхуми',        city: 'Бангкок',     cityEn: 'Bangkok',        country: 'Таиланд', countryCode: 'TH' },
  { code: 'HKT', name: 'Пхукет',              city: 'Пхукет',      cityEn: 'Phuket',         country: 'Таиланд', countryCode: 'TH' },
  { code: 'KUL', name: 'KLIA',                city: 'Куала-Лумпур', cityEn: 'Kuala Lumpur',   country: 'Малайзия', countryCode: 'MY' },
  { code: 'SIN', name: 'Чанги',               city: 'Сингапур',    cityEn: 'Singapore',      country: 'Сингапур', countryCode: 'SG' },
];

// ── Поиск аэропортов ─────────────────────────────────────────────────────────
// Ищет по: city, cityEn, code, name. Возвращает до limit результатов.

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  // Точное совпадение IATA кода — в приоритете
  const exactCode = airports.filter(a => a.code.toLowerCase() === q);
  if (exactCode.length > 0) return exactCode.slice(0, limit);

  // Начинается с / содержит
  const startsWithCity: Airport[] = [];
  const startsWithOther: Airport[] = [];
  const contains: Airport[] = [];

  for (const a of airports) {
    const cityLow = a.city.toLowerCase();
    const cityEnLow = a.cityEn.toLowerCase();
    const codeLow = a.code.toLowerCase();
    const nameLow = a.name.toLowerCase();

    if (cityLow.startsWith(q) || cityEnLow.startsWith(q)) {
      startsWithCity.push(a);
    } else if (codeLow.startsWith(q) || nameLow.startsWith(q)) {
      startsWithOther.push(a);
    } else if (
      cityLow.includes(q) || cityEnLow.includes(q) ||
      codeLow.includes(q) || nameLow.includes(q) ||
      a.country.toLowerCase().includes(q)
    ) {
      contains.push(a);
    }
  }

  return [...startsWithCity, ...startsWithOther, ...contains].slice(0, limit);
}

// Форматирование для отображения в поле: "Москва (SVO)"
export function formatAirport(airport: Airport): string {
  return `${airport.city} (${airport.code})`;
}