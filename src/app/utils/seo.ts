/**
 * 🔍 SEO ОПТИМИЗАЦИЯ
 * Утилиты для улучшения индексации в поисковиках
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  author?: string;
}

/**
 * Установить meta теги для страницы
 */
export function setPageMeta(meta: SEOMetadata): void {
  // Title
  document.title = meta.title;
  
  // Description
  updateMetaTag('name', 'description', meta.description);
  
  // Keywords
  if (meta.keywords && meta.keywords.length > 0) {
    updateMetaTag('name', 'keywords', meta.keywords.join(', '));
  }
  
  // Open Graph (Facebook, LinkedIn)
  updateMetaTag('property', 'og:title', meta.title);
  updateMetaTag('property', 'og:description', meta.description);
  updateMetaTag('property', 'og:type', meta.type || 'website');
  
  if (meta.image) {
    updateMetaTag('property', 'og:image', meta.image);
  }
  
  if (meta.url) {
    updateMetaTag('property', 'og:url', meta.url);
  }
  
  if (meta.locale) {
    updateMetaTag('property', 'og:locale', meta.locale);
  }
  
  // Twitter Card
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', meta.title);
  updateMetaTag('name', 'twitter:description', meta.description);
  
  if (meta.image) {
    updateMetaTag('name', 'twitter:image', meta.image);
  }
  
  // Author
  if (meta.author) {
    updateMetaTag('name', 'author', meta.author);
  }
  
  console.log('[SEO] ✅ Meta tags updated');
}

/**
 * Обновить или создать meta тег
 */
function updateMetaTag(attribute: string, name: string, content: string): void {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Установить Canonical URL
 */
export function setCanonicalUrl(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
  console.log('[SEO] ✅ Canonical URL set:', url);
}

/**
 * Добавить Structured Data (JSON-LD)
 */
export function addStructuredData(data: any): void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  
  // Удаляем предыдущий structured data если есть
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(script);
  console.log('[SEO] ✅ Structured data added');
}

/**
 * Structured Data для организации
 */
export function addOrganizationSchema(): void {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ovora Cargo',
    description: 'Бесплатная платформа для поиска попутных грузоперевозок по Таджикистану',
    url: window.location.origin,
    logo: `${window.location.origin}/icon-512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Russian', 'Tajik', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Tajikistan',
    },
    priceRange: 'Бесплатно',
  };
  
  addStructuredData(schema);
}

/**
 * Structured Data для поездки
 */
export function addTripSchema(trip: any): void {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: `Поездка ${trip.from} → ${trip.to}`,
    description: trip.description || `Грузоперевозка из ${trip.from} в ${trip.to}`,
    itinerary: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'City',
          name: trip.from,
        },
        {
          '@type': 'City',
          name: trip.to,
        },
      ],
    },
    offers: {
      '@type': 'Offer',
      price: trip.price || 'Договорная',
      priceCurrency: 'TJS',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Person',
      name: trip.driverName || 'Водитель',
    },
  };
  
  addStructuredData(schema);
}

/**
 * Генерация sitemap.xml (текст)
 */
export function generateSitemap(urls: string[]): string {
  const baseUrl = window.location.origin;
  const date = new Date().toISOString().split('T')[0];
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(url => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}${url}</loc>\n`;
    sitemap += `    <lastmod>${date}</lastmod>\n`;
    sitemap += '    <changefreq>daily</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });
  
  sitemap += '</urlset>';
  
  return sitemap;
}

/**
 * Генерация robots.txt (текст)
 */
export function generateRobotsTxt(): string {
  const baseUrl = window.location.origin;
  
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${baseUrl}/sitemap.xml`;
}

/**
 * Предзаданные meta данные для страниц
 */
export const pageMeta = {
  home: {
    title: 'Ovora Cargo - Грузоперевозки по Таджикистану',
    description: 'Бесплатная платформа для поиска попутных грузоперевозок. Водители публикуют поездки, отправители находят попутный транспорт. Без комиссий!',
    keywords: ['грузоперевозки', 'таджикистан', 'душанбе', 'худжанд', 'попутный груз', 'перевозка товаров'],
  },
  
  search: {
    title: 'Поиск поездок - Ovora Cargo',
    description: 'Найдите попутный транспорт для вашего груза по Таджикистану. Душанбе, Худжанд, Куляб, Хорог и другие города.',
    keywords: ['поиск грузоперевозок', 'найти транспорт', 'попутный груз таджикистан'],
  },
  
  driver: {
    title: 'Для водителей - Ovora Cargo',
    description: 'Создавайте объявления о поездках и находите грузоотправителей. Полностью бесплатно, без комиссий.',
    keywords: ['водитель таджикистан', 'заработок на перевозках', 'попутный груз для водителей'],
  },
  
  about: {
    title: 'О нас - Ovora Cargo',
    description: 'Ovora Cargo - бесплатная платформа-посредник для грузоперевозок по Таджикистану. Все расчёты между водителем и отправителем напрямую.',
    keywords: ['ovora cargo', 'о компании', 'грузоперевозки таджикистан'],
  },
  
  contact: {
    title: 'Контакты - Ovora Cargo',
    description: 'Свяжитесь с нами по вопросам работы платформы Ovora Cargo.',
    keywords: ['контакты ovora cargo', 'связаться'],
  },
};

/**
 * Хук для использования в React компонентах
 */
export function useSEO(meta: SEOMetadata) {
  // Устанавливаем meta при монтировании компонента
  if (typeof window !== 'undefined') {
    setPageMeta(meta);
    
    if (meta.url) {
      setCanonicalUrl(meta.url);
    }
  }
}

export default {
  setPageMeta,
  setCanonicalUrl,
  addStructuredData,
  addOrganizationSchema,
  addTripSchema,
  generateSitemap,
  generateRobotsTxt,
  pageMeta,
  useSEO,
};
