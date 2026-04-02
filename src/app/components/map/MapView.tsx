import React, { useEffect, useRef, useState } from 'react';
import { YMaps, Map, Placemark, Clusterer } from 'react-yandex-maps';
import { AlertCircle } from 'lucide-react';
import { YANDEX_MAPS_CONFIG } from '../../config/yandex';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'driver' | 'trip' | 'user';
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  availableSeats?: number;
  onClick?: () => void;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  enableClustering?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

export function MapView({
  markers,
  center = [38.5598, 68.7738], // Dushanbe, Tajikistan
  zoom = 13,
  height = '500px',
  enableClustering = true,
  onMarkerClick,
}: MapViewProps) {
  const mapState = {
    center,
    zoom,
  };

  const getMarkerIcon = (type: 'driver' | 'trip' | 'user') => {
    const icons = {
      driver: 'islands#blueCarIcon',
      trip: 'islands#greenDotIcon',
      user: 'islands#redPersonIcon',
    };
    return icons[type];
  };

  const handleMarkerClick = (marker: MapMarker) => {
    if (marker.onClick) {
      marker.onClick();
    }
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  const createBalloonContent = (marker: MapMarker): string => {
    let content = `<div style="padding: 12px; min-width: 200px; font-family: 'Sora', system-ui, sans-serif;">`;
    content += `<h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #0d181c;">${marker.title}</h3>`;
    
    if (marker.description) {
      content += `<p style="margin-bottom: 8px; color: #4b879b; font-size: 14px;">${marker.description}</p>`;
    }
    
    if (marker.price && marker.currency) {
      content += `<p style="font-weight: bold; color: #1978e5; font-size: 18px; margin-top: 8px;">${marker.price} ${marker.currency}</p>`;
    }
    
    if (marker.availableSeats) {
      content += `<p style="color: #4b879b; font-size: 14px; margin-top: 4px;">Свободных мест: ${marker.availableSeats}</p>`;
    }
    
    content += `</div>`;
    return content;
  };

  return (
    <div className="relative rounded-lg overflow-hidden shadow-md" style={{ height }}>
      <YMaps
        query={{
          apikey: YANDEX_MAPS_CONFIG.apiKey,
          lang: YANDEX_MAPS_CONFIG.lang,
          load: 'package.full',
        }}
      >
        <Map
          defaultState={mapState}
          width="100%"
          height="100%"
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
          options={{
            suppressMapOpenBlock: true,
          }}
        >
          {enableClustering ? (
            <Clusterer
              options={{
                preset: 'islands#blueClusterIcons',
                groupByCoordinates: false,
                clusterDisableClickZoom: false,
                clusterHideIconOnBalloonOpen: false,
                geoObjectHideIconOnBalloonOpen: false,
                clusterBalloonContentLayout: 'cluster#balloonCarousel',
                clusterBalloonPanelMaxMapArea: 0,
                clusterBalloonContentLayoutWidth: 200,
                clusterBalloonContentLayoutHeight: 130,
                clusterBalloonPagerSize: 5,
              }}
            >
              {markers.map((marker) => (
                <Placemark
                  key={marker.id}
                  geometry={[marker.lat, marker.lng]}
                  properties={{
                    balloonContent: createBalloonContent(marker),
                    hintContent: marker.title,
                  }}
                  options={{
                    preset: getMarkerIcon(marker.type),
                    iconColor: marker.type === 'driver' ? '#1978e5' : marker.type === 'trip' ? '#10b981' : '#ef4444',
                  }}
                  onClick={() => handleMarkerClick(marker)}
                />
              ))}
            </Clusterer>
          ) : (
            <>
              {markers.map((marker) => (
                <Placemark
                  key={marker.id}
                  geometry={[marker.lat, marker.lng]}
                  properties={{
                    balloonContent: createBalloonContent(marker),
                    hintContent: marker.title,
                  }}
                  options={{
                    preset: getMarkerIcon(marker.type),
                    iconColor: marker.type === 'driver' ? '#1978e5' : marker.type === 'trip' ? '#10b981' : '#ef4444',
                  }}
                  onClick={() => handleMarkerClick(marker)}
                />
              ))}
            </>
          )}
        </Map>
      </YMaps>
    </div>
  );
}