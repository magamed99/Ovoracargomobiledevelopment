import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Search, MapPin, Clock, Filter, Map, List, Locate } from 'lucide-react';
import { useTripStore } from '../store/trips';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MapView, MapMarker } from '../app/components/map/MapView';
import { getCurrentLocation, filterMarkersInRadius } from '../utils/geolocation';
import { toast } from 'sonner';

export function SearchScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trips, fetchTrips } = useTripStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    date: '',
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  // Get user location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = async () => {
    const result = await getCurrentLocation();
    if (result.success && result.coordinates) {
      setUserLocation(result.coordinates);
      toast.success('Местоположение определено');
    } else {
      toast.error(result.error || 'Не удалось определить местоположение');
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesQuery = 
      trip.from.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = 
      (!filters.minPrice || trip.price >= Number(filters.minPrice)) &&
      (!filters.maxPrice || trip.price <= Number(filters.maxPrice));

    return matchesQuery && matchesPrice;
  });

  // Convert trips to map markers
  const mapMarkers: MapMarker[] = filteredTrips.map(trip => ({
    id: trip.id,
    lat: trip.from.lat,
    lng: trip.from.lng,
    type: 'trip',
    title: `${trip.from.address} → ${trip.to.address}`,
    description: trip.description || '',
    price: trip.price,
    currency: trip.currency,
    availableSeats: trip.availableSeats,
  }));

  // Add user location marker if available
  const allMarkers = userLocation
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
    : mapMarkers;

  // Filter trips by radius if user location is available
  const tripsInRadius = userLocation
    ? filterMarkersInRadius(filteredTrips, userLocation, searchRadius)
    : filteredTrips;

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
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {t('search.filters')}
            </Button>
          </div>

          {viewMode === 'map' && userLocation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Радиус поиска:</span>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
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