import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with Leaflet and bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface EventLocationMapProps {
  eventLat: number;
  eventLng: number;
  eventRadiusMeters: number;
  userLat?: number | null;
  userLng?: number | null;
}

// Component to adjust map view when props change
const ChangeView: React.FC<{ center: L.LatLngExpression; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const EventLocationMap: React.FC<EventLocationMapProps> = ({ 
  eventLat, 
  eventLng, 
  eventRadiusMeters, 
  userLat, 
  userLng 
}) => {

  const eventPosition: L.LatLngExpression = [eventLat, eventLng];
  const userPosition: L.LatLngExpression | null = (userLat && userLng) ? [userLat, userLng] : null;

  // Determine appropriate zoom level based on radius
  let zoomLevel = 13;
  if (eventRadiusMeters < 100) zoomLevel = 16;
  else if (eventRadiusMeters < 500) zoomLevel = 15;
  else if (eventRadiusMeters < 2000) zoomLevel = 14;

  return (
    <MapContainer 
      center={eventPosition} 
      zoom={zoomLevel} 
      scrollWheelZoom={false} 
      style={{ height: '200px', width: '100%', borderRadius: '8px', marginTop: '8px' }} 
      className="z-0" // Ensure map is behind popups etc.
    >
      <ChangeView center={eventPosition} zoom={zoomLevel} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Event Location Marker */}
      <Marker position={eventPosition}>
        <Popup>
          Event Location
        </Popup>
      </Marker>
      {/* Event Radius Circle */}
      <Circle 
        center={eventPosition} 
        radius={eventRadiusMeters} 
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
      />
      {/* User Location Marker (if available) */}
      {userPosition && (
        <Marker position={userPosition} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [15, 25], iconAnchor: [7, 25] })}>
          <Popup>
            Your Current Location
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default EventLocationMap; 