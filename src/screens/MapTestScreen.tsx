import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MapView } from '../app/components/map/MapView';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { generateMockMapMarkers, generateClusteredMarkers, getMarkerStats } from '../utils/mockMapData';
import { ArrowLeft, RefreshCw, MapPin, Users, TrendingUp } from 'lucide-react';

export function MapTestScreen() {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState(() => generateMockMapMarkers(50));
  const [markerCount, setMarkerCount] = useState(50);
  const [enableClustering, setEnableClustering] = useState(true);

  const stats = getMarkerStats(markers);

  const regenerateMarkers = () => {
    setMarkers(generateMockMapMarkers(markerCount));
  };

  const addClusteredMarkers = () => {
    const newMarkers = generateClusteredMarkers(
      { lat: 38.5598, lng: 68.7738 }, // Dushanbe
      20,
      5
    );
    setMarkers([...markers, ...newMarkers]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-xl font-bold flex-1">Тест кластеризации карты</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">Всего маркеров</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.drivers}</div>
                  <div className="text-sm text-gray-600">Водители</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.trips}</div>
                  <div className="text-sm text-gray-600">Поездки</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div>
                <div className="text-2xl font-bold">{stats.avgPrice} TJS</div>
                <div className="text-sm text-gray-600">Средняя цена</div>
              </div>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Количество:</label>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={markerCount}
                onChange={(e) => setMarkerCount(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={regenerateMarkers}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить маркеры
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={addClusteredMarkers}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Добавить кластер (Душанбе)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMarkers([])}
            >
              Очистить карту
            </Button>

            <label className="flex items-center gap-2 px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enableClustering}
                onChange={(e) => setEnableClustering(e.target.checked)}
              />
              <span className="text-sm font-medium">Включить кластеризацию</span>
            </label>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-6xl mx-auto p-4">
        <Card className="p-4">
          <MapView
            markers={markers}
            height="calc(100vh - 350px)"
            enableClustering={enableClustering}
            onMarkerClick={(marker) => {
              console.log('Clicked marker:', marker);
            }}
          />
          
          {markers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет маркеров на карте</h3>
                <p className="text-gray-600 mb-4">Нажмите "Обновить маркеры" для генерации</p>
                <Button onClick={regenerateMarkers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Генерировать маркеры
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info */}
        <Card className="mt-4 p-4">
          <h3 className="font-semibold mb-2">О кластеризации</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Маленький кластер (синий):</strong> менее 5 маркеров</li>
            <li>• <strong>Средний кластер (оранжевый):</strong> 5-9 маркеров</li>
            <li>• <strong>Большой кластер (красный):</strong> 10+ маркеров</li>
            <li>• Нажмите на кластер для увеличения и раскрытия маркеров</li>
            <li>• При максимальном зуме маркеры будут показаны в виде "паука"</li>
            <li>• Кластеризация значительно улучшает производительность при большом количестве маркеров</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
