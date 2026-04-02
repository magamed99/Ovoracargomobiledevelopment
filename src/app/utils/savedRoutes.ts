/**
 * 🗺️ СОХРАНЕНИЕ МАРШРУТОВ
 * Водители могут сохранять часто используемые маршруты
 */

export interface SavedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  fromCoords?: { lat: number; lon: number };
  toCoords?: { lat: number; lon: number };
  distance?: number;
  duration?: number;
  price?: number;
  notes?: string;
  useCount: number;
  createdAt: number;
  lastUsedAt: number;
}

const STORAGE_KEY = 'savedRoutes';

/**
 * Получить все сохранённые маршруты
 */
export function getSavedRoutes(): SavedRoute[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[SavedRoutes] Error loading routes:', error);
    return [];
  }
}

/**
 * Сохранить новый маршрут
 */
export function saveRoute(route: Omit<SavedRoute, 'id' | 'useCount' | 'createdAt' | 'lastUsedAt'>): SavedRoute {
  const routes = getSavedRoutes();
  
  // Проверяем, не существует ли уже такой маршрут
  const existing = routes.find(r => 
    r.from === route.from && r.to === route.to
  );
  
  if (existing) {
    console.log('[SavedRoutes] Route already exists:', existing.id);
    return existing;
  }
  
  const newRoute: SavedRoute = {
    ...route,
    id: generateId(),
    useCount: 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };
  
  routes.push(newRoute);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  
  console.log('[SavedRoutes] ✅ Route saved:', newRoute.name);
  return newRoute;
}

/**
 * Обновить существующий маршрут
 */
export function updateRoute(id: string, updates: Partial<SavedRoute>): boolean {
  const routes = getSavedRoutes();
  const index = routes.findIndex(r => r.id === id);
  
  if (index === -1) {
    console.error('[SavedRoutes] Route not found:', id);
    return false;
  }
  
  routes[index] = { ...routes[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  
  console.log('[SavedRoutes] ✅ Route updated:', id);
  return true;
}

/**
 * Удалить маршрут
 */
export function deleteRoute(id: string): boolean {
  const routes = getSavedRoutes();
  const filtered = routes.filter(r => r.id !== id);
  
  if (filtered.length === routes.length) {
    console.error('[SavedRoutes] Route not found:', id);
    return false;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  console.log('[SavedRoutes] ✅ Route deleted:', id);
  return true;
}

/**
 * Использовать маршрут (увеличить счётчик)
 */
export function useRoute(id: string): SavedRoute | null {
  const routes = getSavedRoutes();
  const route = routes.find(r => r.id === id);
  
  if (!route) {
    console.error('[SavedRoutes] Route not found:', id);
    return null;
  }
  
  route.useCount++;
  route.lastUsedAt = Date.now();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  console.log('[SavedRoutes] ✅ Route used:', route.name, `(${route.useCount} times)`);
  
  return route;
}

/**
 * Получить самые популярные маршруты
 */
export function getPopularRoutes(limit: number = 5): SavedRoute[] {
  const routes = getSavedRoutes();
  return routes
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit);
}

/**
 * Получить недавно использованные маршруты
 */
export function getRecentRoutes(limit: number = 5): SavedRoute[] {
  const routes = getSavedRoutes();
  return routes
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit);
}

/**
 * Поиск маршрутов
 */
export function searchRoutes(query: string): SavedRoute[] {
  const routes = getSavedRoutes();
  const lowerQuery = query.toLowerCase();
  
  return routes.filter(route =>
    route.name.toLowerCase().includes(lowerQuery) ||
    route.from.toLowerCase().includes(lowerQuery) ||
    route.to.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Экспортировать маршруты
 */
export function exportRoutes(): string {
  const routes = getSavedRoutes();
  return JSON.stringify(routes, null, 2);
}

/**
 * Импортировать маршруты
 */
export function importRoutes(json: string): boolean {
  try {
    const routes = JSON.parse(json);
    
    // Валидация
    if (!Array.isArray(routes)) {
      throw new Error('Invalid format');
    }
    
    // Объединяем с существующими
    const existing = getSavedRoutes();
    const merged = [...existing];
    
    routes.forEach((newRoute: SavedRoute) => {
      const exists = merged.find(r => 
        r.from === newRoute.from && r.to === newRoute.to
      );
      
      if (!exists) {
        merged.push(newRoute);
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    console.log('[SavedRoutes] ✅ Routes imported:', routes.length);
    return true;
  } catch (error) {
    console.error('[SavedRoutes] Import failed:', error);
    return false;
  }
}

/**
 * Очистить все маршруты
 */
export function clearAllRoutes(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[SavedRoutes] ✅ All routes cleared');
}

/**
 * Генерация ID
 */
function generateId(): string {
  return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Хук для использования в React компонентах
 */
export function useSavedRoutes() {
  const routes = getSavedRoutes();
  
  return {
    routes,
    save: saveRoute,
    update: updateRoute,
    delete: deleteRoute,
    use: useRoute,
    popular: getPopularRoutes(),
    recent: getRecentRoutes(),
    search: searchRoutes,
    export: exportRoutes,
    import: importRoutes,
    clear: clearAllRoutes,
  };
}

/**
 * Создать быструю поездку из сохранённого маршрута
 */
export function createTripFromRoute(route: SavedRoute): any {
  return {
    from: route.from,
    to: route.to,
    fromCoords: route.fromCoords,
    toCoords: route.toCoords,
    distance: route.distance,
    duration: route.duration,
    price: route.price,
    // Остальные поля заполнит пользователь
    date: '',
    time: '',
    availableSeats: 0,
    cargoType: '',
    description: route.notes || '',
  };
}

export default {
  getSavedRoutes,
  saveRoute,
  updateRoute,
  deleteRoute,
  useRoute,
  getPopularRoutes,
  getRecentRoutes,
  searchRoutes,
  exportRoutes,
  importRoutes,
  clearAllRoutes,
  createTripFromRoute,
};
