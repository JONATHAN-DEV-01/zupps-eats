import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, MapPinned } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
};

const center = {
  lat: -23.5505, // São Paulo default
  lng: -46.6333,
};

const LIBRARIES: ("places")[] = ['places'];

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
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>(center);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const advancedMarkerRef = useRef<any>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  // Gerenciamento do AdvancedMarkerElement (Substitui o Marker legado)
  useEffect(() => {
    if (!isLoaded || !map) return;

    let marker: any = null;

    const initMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;
        
        // Remove marker anterior se existir (limpeza extra)
        if (advancedMarkerRef.current) {
          advancedMarkerRef.current.map = null;
        }

        marker = new AdvancedMarkerElement({
          map,
          position: markerPos,
          title: "Localização selecionada",
        });
        
        advancedMarkerRef.current = marker;
      } catch (error) {
        console.error("Erro ao inicializar AdvancedMarkerElement:", error);
      }
    };

    if (!advancedMarkerRef.current) {
      initMarker();
    } else {
       advancedMarkerRef.current.position = markerPos;
    }

    return () => {
      // Cleanup ao desmontar
      if (advancedMarkerRef.current) {
        advancedMarkerRef.current.map = null;
        advancedMarkerRef.current = null;
      }
    };
  }, [isLoaded, map, markerPos]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar sugestões (New Places API)
  useEffect(() => {
    if (!isLoaded || query.trim().length <= 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const { AutocompleteSuggestion } = await google.maps.importLibrary("places") as any;
        
        const request = {
          input: query,
          includedRegionCodes: ["br"],
        };
        
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setSuggestions(response.suggestions || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Erro ao buscar endereços (Places API New):", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query, isLoaded]);

  // Escolher uma sugestão
  const handleSelectSuggestion = async (suggestion: any) => {
    const text = suggestion.placePrediction?.text?.text || "";
    setQuery(text);
    setShowDropdown(false);
    
    try {
      const { Place } = await google.maps.importLibrary("places") as any;
      const place = new Place({ id: suggestion.placePrediction.placeId });
      
      await place.fetchFields({ fields: ['location', 'addressComponents'] });
      
      if (place.location) {
        const location = { lat: place.location.lat(), lng: place.location.lng() };
        setMarkerPos(location);
        map?.panTo(location);
        map?.setZoom(17);
      }
      
      const addressComponents = place.addressComponents || [];
      const address = {
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
        cep: '',
      };

      addressComponents.forEach((component: any) => {
        const types = component.types;
        if (types.includes('route')) address.logradouro = component.longText;
        if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('administrative_area_level_3')) address.bairro = component.longText;
        if (types.includes('administrative_area_level_2')) address.cidade = component.longText;
        if (types.includes('administrative_area_level_1')) address.estado = component.shortText;
        if (types.includes('street_number')) address.numero = component.longText;
        if (types.includes('postal_code')) address.cep = component.longText;
      });

      onLocationSelect(address);

    } catch (error) {
      console.error("Erro ao buscar detalhes do local:", error);
    }
  };

  if (!isLoaded) return (
    <div className="w-full h-[250px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative" ref={dropdownRef}>
        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
        <input
          type="text"
          placeholder="Buscar endereço..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full h-12 pl-11 pr-11 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {loadingSuggestions && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 border-b border-border/40 last:border-0 transition-colors"
              >
                <div className="flex-shrink-0 bg-muted p-2 rounded-full">
                  <MapPinned size={14} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {suggestion.placePrediction?.text?.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={markerPos}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapId: 'DEMO_MAP_ID', // ID GENÉRICO PARA ATIVAR ADVANCED MARKERS
        }}
      />
    </div>
  );
};

export default LocationPicker;
