import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
};

const center = {
  lat: -23.5505, // São Paulo default
  lng: -46.6333,
};

interface LocationPickerProps {
  onLocationSelect: (address: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero: string;
    cep: string;
  }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.LatLngLiteral>(center);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocompleteInstance: google.maps.libraries.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMarker(location);
        map?.panTo(location);
        map?.setZoom(17);

        // Extract address components
        const addressComponents = place.address_components || [];
        const address = {
          logradouro: '',
          bairro: '',
          cidade: '',
          estado: '',
          numero: '',
          cep: '',
        };

        addressComponents.forEach((component) => {
          const types = component.types;
          if (types.includes('route')) address.logradouro = component.long_name;
          if (types.includes('sublocality_level_1') || types.includes('administrative_area_level_3')) address.bairro = component.long_name;
          if (types.includes('administrative_area_level_2')) address.cidade = component.long_name;
          if (types.includes('administrative_area_level_1')) address.estado = component.short_name;
          if (types.includes('street_number')) address.numero = component.long_name;
          if (types.includes('postal_code')) address.cep = component.long_name;
        });

        onLocationSelect(address);
      }
    }
  };

  if (!isLoaded) return (
    <div className="w-full h-[250px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Buscar endereço..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </Autocomplete>
      </div>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={marker}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <Marker position={marker} />
      </GoogleMap>
    </div>
  );
};

export default LocationPicker;
