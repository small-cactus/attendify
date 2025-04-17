import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L, { LatLngExpression, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue with webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  radius: string;
  setLatitude: (lat: string) => void;
  setLongitude: (lng: string) => void;
  setRadius: (radius: string) => void;
  disabled?: boolean;
}

// Component to handle map clicks and centering
const LocationFinder = ({ setPosition, position }: { setPosition: (latlng: LatLng) => void, position: LatLngExpression | null }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom()); // Center map on click
    },
  });

  // Center map on initial load or when position changes externally
  React.useEffect(() => {
    if (position && Array.isArray(position) && position.length === 2) {
      map.flyTo(position, map.getZoom());
    } else if (position && typeof position === 'object' && 'lat' in position && 'lng' in position) {
       map.flyTo([position.lat, position.lng], map.getZoom());
    }
    // Only run when position changes from external source, not on every render
  }, [position, map]); // map dependency is stable

  return position === null ? null : <Marker position={position}></Marker>;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  radius,
  setLatitude,
  setLongitude,
  setRadius,
  disabled,
}) => {
  const [address, setAddress] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const position: LatLngExpression | null = latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null;

  const handlePositionChange = (latlng: LatLng) => {
    setLatitude(latlng.lat.toString());
    setLongitude(latlng.lng.toString());
    setAddress(''); // Clear address if position is set manually
    setSearchError(null);
  };

  const handleAddressSearch = async () => {
    if (!address) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLatitude(lat);
        setLongitude(lon);
      } else {
        setSearchError('Address not found.');
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setSearchError('Failed to search for address.');
    } finally {
      setIsSearching(false);
    }
  };

  // Default center if no position is set yet
  const defaultCenter: LatLngExpression = [40.7128, -74.0060]; // New York City

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="addressSearch" className="block text-xs font-medium text-gray-600 mb-1">Search Address</label>
        <div className="flex gap-2">
          <input
            id="addressSearch"
            type="text"
            placeholder="Enter an address to find on map"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
            disabled={disabled || isSearching}
            onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            className="px-3 py-1.5 text-xs bg-gray-700 text-white font-medium rounded-md hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || isSearching || !address}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
      </div>

      <div className="h-64 w-full border border-gray-300 rounded-md overflow-hidden relative">
        <MapContainer
           center={position || defaultCenter} // Center on position if available, else default
           zoom={position ? 15 : 10} // Zoom in if position is set
           scrollWheelZoom={true} // Enable scroll wheel/trackpad zoom
           style={{ height: '100%', width: '100%' }}
           whenReady={ () => { /* Map is ready */ } }
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationFinder setPosition={handlePositionChange} position={position} />
          {/* Add the Circle for the radius */}          
          {position && !isNaN(parseFloat(radius)) && parseFloat(radius) > 0 && (
            <Circle 
              center={position}
              radius={parseFloat(radius)}
              pathOptions={{ color: 'rgba(0, 100, 255, 0.7)', fillColor: 'rgba(0, 100, 255, 0.2)', weight: 1 }} 
            />
          )}
        </MapContainer>
        <p className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white bg-opacity-70 px-1 py-0.5 rounded z-[1000]">
            Click on the map to set the event location.
        </p>
      </div>

      {position && (
         <div className="text-xs text-gray-600">
            Selected: Lat {parseFloat(latitude).toFixed(5)}, Lng {parseFloat(longitude).toFixed(5)}
         </div>
      )}

      <div>
        <label htmlFor="locationRadius" className="block text-xs font-medium text-gray-600 mb-1">Radius (meters)</label>
        <input
          id="locationRadius"
          type="number"
          step="1"
          min="1"
          placeholder="Required radius in meters"
          value={radius}
          onChange={e => setRadius(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
          disabled={disabled}
          required // Still required if location check-in is enabled
        />
        <div className="text-xs text-gray-500 mt-1">Users must be within this radius of the pinned location to check in.</div>
      </div>
    </div>
  );
};

export default LocationPicker; 