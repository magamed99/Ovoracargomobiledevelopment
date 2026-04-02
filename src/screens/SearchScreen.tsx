import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Search, MapPin, Clock, Filter, Map, List, Locate, Navigation } from 'lucide-react';
import { useTripStore } from '../store/trips';
import { useLocationStore } from '../store/location';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MapView, MapMarker } from '../app/components/map/MapView';
import { getCurrentLocation, filterMarkersInRadius } from '../utils/geolocation';
import { toast } from 'sonner';
import { LiveTrackingMap } from '../app/components/map/LiveTrackingMap';
import { Slider } from '../app/components/ui/slider';

export function SearchScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trips, fetchTrips } = useTripStore();
  const { 
    driverLocations, 
    userLocation,
    searchRadius,
    setSearchRadius,
    fetchNearbyDrivers,
    updateUserLocation
  } = useLocationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'drivers'>('list');
  const [trackingDriverId, setTrackingDriverId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    date: '',
  });

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      const result = await getCurrentLocation();
      if (result.success && result.coordinates) {
        updateUserLocation(result.coordinates);
        // Загружаем ближайших водителей
        await fetchNearbyDrivers(result.coordinates.lat, result.coordinates.lng, searchRadius);
        toast.success('Местоположение определено');
      } else {
        toast.error(result.error || 'Не удалось определить местоположение');
      }
    };
    
    getLocation();
  }, []); // Empty dependency array - run only once on mount

  const handleGetLocation = async () => {
    const result = await getCurrentLocation();
    if (result.success && result.coordinates) {
      updateUserLocation(result.coordinates);
      // Загружаем ближайших водителей
      await fetchNearbyDrivers(result.coordinates.lat, result.coordinates.lng, searchRadius);
      toast.success('Местоположение определено');
    } else {
      toast.error(result.error || 'Не удалось определить местоположение');
    }
  };

  // Обновляем список водителей при изменении радиуса
  const handleRadiusChange = async (newRadius: number) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      await fetchNearbyDrivers(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  // Если отслеживается водитель, показываем компонент отслеживания
  if (trackingDriverId) {
    return (
      <LiveTrackingMap
        driverId={trackingDriverId}
        onClose={() => setTrackingDriverId(null)}
      />
    );
  }

  const filteredTrips = trips.filter(trip => {
    const matchesQuery = 
      trip.from.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = 
      (!filters.minPrice || trip.price >= Number(filters.minPrice)) &&
      (!filters.maxPrice || trip.price <= Number(filters.maxPrice));

    return matchesQuery && matchesPrice;
  });

  // Convert trips to map markers - memoized to prevent unnecessary re-renders
  const mapMarkers: MapMarker[] = useMemo(() => 
    filteredTrips.map(trip => ({
      id: trip.id,
      lat: trip.from.lat,
      lng: trip.from.lng,
      type: 'trip' as const,
      title: `${trip.from.address} → ${trip.to.address}`,
      description: trip.description || '',
      price: trip.price,
      currency: trip.currency,
      availableSeats: trip.availableSeats,
    })),
    [filteredTrips]
  );

  // Add user location marker if available - memoized
  const allMarkers = useMemo(() => 
    userLocation
      ? [
          ...mapMarkers,
          {
            id: 'user',
            lat: userLocation.lat,
            lng: userLocation.lng,
            type: 'user' as const,
            title: 'Вы здесь',
          },
        ]
      : mapMarkers,
    [mapMarkers, userLocation]
  );

  // Filter trips by radius if user location is available - memoized
  const tripsInRadius = useMemo(() => 
    userLocation
      ? filterMarkersInRadius(filteredTrips, userLocation, searchRadius)
      : filteredTrips,
    [filteredTrips, userLocation, searchRadius]
  );

  const displayTrips = viewMode === 'map' ? tripsInRadius : filteredTrips;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              ← Назад
            </Button>
            <h1 className="text-xl font-bold flex-1">{t('search.title')}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetLocation}
              title="Определить местоположение"
            >
              <Locate className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t('search.from')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              {t('search.listView')}
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="w-4 h-4 mr-2" />
              {t('search.mapView')}
            </Button>
            <Button
              variant={viewMode === 'drivers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('drivers')}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {t('search.driversView')}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {t('search.filters')}
            </Button>
          </div>

          {viewMode === 'map' && userLocation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Радиус поиска:</span>
              <Slider
                min={5}
                max={200}
                step={5}
                value={searchRadius}
                onChange={handleRadiusChange}
                className="flex-1"
              />
              <span className="text-sm font-semibold">{searchRadius} км</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {viewMode === 'list' ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Найдено: {displayTrips.length} {displayTrips.length === 1 ? 'поездка' : 'поездок'}
            </div>

            {displayTrips.length === 0 ? (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('search.noResults')}</h3>
                <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/trip/${trip.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold">{trip.from.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.to.address}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {trip.price} {trip.currency}
                        </div>
                        {trip.availableSeats && (
                          <div className="text-sm text-gray-600">
                            {trip.availableSeats} мест
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(trip.departureDate), 'd MMM, HH:mm', { locale: ru })}
                        </span>
                      </div>
                      
                      {trip.distance && (
                        <span>{trip.distance} км</span>
                      )}
                    </div>

                    {trip.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                        {trip.description}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'drivers' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {userLocation
                ? `Найдено в радиусе ${searchRadius} км: ${driverLocations.length} водителей`
                : `Показано: ${driverLocations.length} водителей`}
            </div>
            <MapView
              markers={driverLocations.map(driver => ({
                id: driver.driverId,
                lat: driver.lat,
                lng: driver.lng,
                type: 'driver' as const,
                title: driver.driverName,
                description: driver.currentRoute 
                  ? `${driver.currentRoute.from} → ${driver.currentRoute.to}`
                  : driver.vehicleType || '',
                availableSeats: driver.availableSeats,
              }))}
              center={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
              height="calc(100vh - 320px)"
              enableClustering={true}
              onMarkerClick={(marker) => {
                if (marker.id !== 'user') {
                  setTrackingDriverId(marker.id);
                }
              }}
            />
            
            {/* Список водителей */}
            <div className="grid gap-3 mt-4">
              {driverLocations.map((driver) => (
                <Card
                  key={driver.driverId}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setTrackingDriverId(driver.driverId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{driver.driverName}</h3>
                      {driver.currentRoute && (
                        <p className="text-sm text-gray-600">
                          {driver.currentRoute.from} → {driver.currentRoute.to}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        driver.status === 'online' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {driver.status === 'online' ? 'В сети' : 'Занят'}
                      </div>
                      {driver.availableSeats && (
                        <div className="text-xs text-gray-500">
                          {driver.availableSeats} мест
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {userLocation
                ? `Найдено в радиусе ${searchRadius} км: ${tripsInRadius.length} ${tripsInRadius.length === 1 ? 'поездка' : 'поездок'}`
                : `Показано: ${mapMarkers.length} ${mapMarkers.length === 1 ? 'поездка' : 'поездок'}`}
            </div>
            <MapView
              markers={allMarkers}
              center={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
              height="calc(100vh - 320px)"
              enableClustering={true}
              onMarkerClick={(marker) => {
                if (marker.id !== 'user') {
                  navigate(`/trip/${marker.id}`);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}