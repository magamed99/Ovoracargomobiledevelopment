import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Initialize marker cluster group if enabled
    if (enableClustering) {
      markerClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 10) size = 'large';
          else if (count >= 5) size = 'medium';

          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40),
          });
        },
      });
      map.addLayer(markerClusterGroupRef.current);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerClusterGroupRef.current = null;
    };
  }, [center, zoom, enableClustering]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const clusterGroup = markerClusterGroupRef.current;

    // Clear existing markers
    if (clusterGroup) {
      clusterGroup.clearLayers();
    }

    // Add new markers
    markers.forEach((marker) => {
      const icon = createCustomIcon(marker.type);
      
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(createPopupContent(marker));

      if (marker.onClick || onMarkerClick) {
        leafletMarker.on('click', () => {
          if (marker.onClick) marker.onClick();
          if (onMarkerClick) onMarkerClick(marker);
        });
      }

      if (clusterGroup && enableClustering) {
        clusterGroup.addLayer(leafletMarker);
      } else {
        leafletMarker.addTo(map);
      }
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, enableClustering, onMarkerClick]);

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg shadow-md" />
      <style>{`
        .marker-cluster-small {
          background-color: rgba(59, 130, 246, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(59, 130, 246, 0.8);
        }
        .marker-cluster-medium {
          background-color: rgba(249, 115, 22, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(249, 115, 22, 0.8);
        }
        .marker-cluster-large {
          background-color: rgba(239, 68, 68, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(239, 68, 68, 0.8);
        }
        .marker-cluster {
          border-radius: 50%;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-cluster span {
          line-height: 30px;
        }
      `}</style>
    </div>
  );
}

function createCustomIcon(type: 'driver' | 'trip' | 'user'): L.DivIcon {
  const colors = {
    driver: '#3b82f6', // blue
    trip: '#10b981', // green
    user: '#ef4444', // red
  };

  const icons = {
    driver: '🚗',
    trip: '📦',
    user: '👤',
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors[type]};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${icons[type]}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function createPopupContent(marker: MapMarker): string {
  let content = `<div style="min-width: 200px;">`;
  content += `<h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${marker.title}</h3>`;
  
  if (marker.description) {
    content += `<p style="margin-bottom: 8px; color: #666;">${marker.description}</p>`;
  }
  
  if (marker.price && marker.currency) {
    content += `<p style="font-weight: bold; color: #3b82f6; font-size: 18px;">${marker.price} ${marker.currency}</p>`;
  }
  
  if (marker.availableSeats) {
    content += `<p style="color: #666;">Свободных мест: ${marker.availableSeats}</p>`;
  }
  
  content += `</div>`;
  return content;
}
