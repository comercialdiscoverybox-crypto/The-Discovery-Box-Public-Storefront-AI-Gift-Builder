import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trapModalFocus } from './focusTrap';

export type MapAddress = {
  placeName: string;
  road: string;
  houseNumber: string;
  neighbourhood: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  osmType: string;
  osmId: string;
  placeCategory: string;
  placeType: string;
  addressType: string;
};

type MapAddressPickerProps = {
  language: 'en' | 'pt';
  onUseAddress: (address: MapAddress) => void;
  onClose: () => void;
  initialLocation: { latitude: number; longitude: number } | null;
};

const labels = {
  en: {
    title: 'Choose a delivery location',
    close: 'Close map',
    cancel: 'Cancel',
    instructions: 'Move around the map, then click the exact delivery spot or drag the pin. Address results can be incomplete; review and edit them before sending.',
    lookingUp: 'Looking up address details…',
    lookupError: 'We could not retrieve address details for this pin. Try another spot or enter the address below.',
    noAddress: 'The map provider returned no address details for this pin. You can still use the coordinates.',
    confirmAddress: 'Is this the correct address?',
    feeNote: 'Use this location so our team can calculate the delivery fee. The team will confirm the final fee.',
    useAddress: 'Yes, use this address',
    coordinates: 'Pin coordinates',
    mapFeature: 'Map feature metadata',
    attribution: 'Address lookup by OpenStreetMap Nominatim',
  },
  pt: {
    title: 'Escolher o local de entrega',
    close: 'Fechar mapa',
    cancel: 'Cancelar',
    instructions: 'Navegue pelo mapa e toque no local exato de entrega ou arraste o marcador. Os resultados do endereço podem estar incompletos; reveja-os e edite-os antes de enviar.',
    lookingUp: 'A procurar os detalhes do endereço…',
    lookupError: 'Não foi possível obter os detalhes do endereço deste marcador. Experimente outro local ou introduza o endereço abaixo.',
    noAddress: 'O fornecedor do mapa não encontrou detalhes para este marcador. Ainda pode utilizar as coordenadas.',
    confirmAddress: 'Este é o endereço correto?',
    feeNote: 'Utilize este local para que a nossa equipa possa calcular o custo de entrega. A equipa confirmará o valor final.',
    useAddress: 'Sim, utilizar este endereço',
    coordinates: 'Coordenadas do marcador',
    mapFeature: 'Metadados do elemento no mapa',
    attribution: 'Pesquisa de endereço por OpenStreetMap Nominatim',
  },
} as const;

function readAddressValue(address: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function formatAddressDetails(address: Pick<MapAddress, 'road' | 'houseNumber' | 'neighbourhood' | 'district' | 'city' | 'province' | 'postalCode' | 'country'>): string {
  const street = [address.houseNumber, address.road].filter(Boolean).join(' ');
  const seen = new Set<string>();
  return [
    street,
    address.neighbourhood,
    address.district,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ].filter((part) => {
    const normalized = part.trim().toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).join(', ');
}

export default function MapAddressPicker({ language, onUseAddress, onClose, initialLocation }: MapAddressPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lookupTimerRef = useRef<number | null>(null);
  const lastLookupAtRef = useRef(0);
  const [candidate, setCandidate] = useState<MapAddress | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const copy = labels[language];

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element) return;

    const startLocation: L.LatLngExpression = initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : [-25.9692, 32.5732];
    const map = L.map(element).setView(startLocation, initialLocation ? 18 : 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    let marker: L.Marker | null = null;

    const reverseLookup = (location: L.LatLng) => {
      abortControllerRef.current?.abort();
      if (lookupTimerRef.current !== null) window.clearTimeout(lookupTimerRef.current);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setCandidate(null);
      setLookupError('');
      setLookupPending(true);

      const delay = Math.max(0, 1000 - (Date.now() - lastLookupAtRef.current));
      lookupTimerRef.current = window.setTimeout(() => {
        lookupTimerRef.current = null;
        lastLookupAtRef.current = Date.now();
        const parameters = new URLSearchParams({
          format: 'jsonv2',
          lat: String(location.lat),
          lon: String(location.lng),
          zoom: '18',
          'accept-language': language,
          addressdetails: '1',
          namedetails: '1',
        });
        void fetch(`https://nominatim.openstreetmap.org/reverse?${parameters}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }).then(async (response) => {
          if (!response.ok) throw new Error(`Address lookup failed with status ${response.status}`);
          const result = await response.json() as {
            address?: unknown;
            display_name?: unknown;
            name?: unknown;
            namedetails?: unknown;
            osm_type?: unknown;
            osm_id?: unknown;
            category?: unknown;
            class?: unknown;
            type?: unknown;
            addresstype?: unknown;
          };
          const address = result.address && typeof result.address === 'object'
            ? result.address as Record<string, unknown>
            : {};
          const namedetails = result.namedetails && typeof result.namedetails === 'object'
            ? result.namedetails as Record<string, unknown>
            : {};
          const placeName = readAddressValue(namedetails, 'name') ||
            (typeof result.name === 'string' ? result.name : '') ||
            readAddressValue(address, 'amenity', 'tourism', 'shop', 'building');
          const addressDetails = {
            placeName,
            road: readAddressValue(address, 'road', 'pedestrian', 'residential', 'street'),
            houseNumber: readAddressValue(address, 'house_number'),
            neighbourhood: readAddressValue(address, 'neighbourhood', 'suburb', 'quarter', 'hamlet'),
            district: readAddressValue(address, 'city_district', 'district', 'state_district', 'county'),
            city: readAddressValue(address, 'city', 'town', 'village', 'municipality'),
            province: readAddressValue(address, 'state', 'province', 'region'),
            postalCode: readAddressValue(address, 'postcode'),
            country: readAddressValue(address, 'country'),
          };
          const formattedAddress = formatAddressDetails(addressDetails) ||
            (typeof result.display_name === 'string' ? result.display_name : '');
          if (!formattedAddress && Object.keys(address).length === 0) {
            throw new Error('No address details were returned');
          }
          setCandidate({
            ...addressDetails,
            formattedAddress,
            latitude: location.lat,
            longitude: location.lng,
            osmType: typeof result.osm_type === 'string' ? result.osm_type : '',
            osmId: typeof result.osm_id === 'number' || typeof result.osm_id === 'string' ? String(result.osm_id) : '',
            placeCategory: typeof result.category === 'string'
              ? result.category
              : typeof result.class === 'string'
                ? result.class
                : '',
            placeType: typeof result.type === 'string' ? result.type : '',
            addressType: typeof result.addresstype === 'string' ? result.addresstype : '',
          });
        }).catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setLookupError(cause instanceof Error && cause.message === 'No address details were returned'
            ? copy.noAddress
            : copy.lookupError);
        }).finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
            setLookupPending(false);
          }
        });
      }, delay);
    };

    const createMarker = (location: L.LatLng) => {
      const createdMarker = L.marker(location, {
          draggable: true,
          icon: L.divIcon({
            className: 'address-map-marker',
            html: '<span></span>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
        }).addTo(map);
      createdMarker.on('dragend', () => reverseLookup(createdMarker.getLatLng()));
      return createdMarker;
    };

    const placePin = (location: L.LatLng) => {
      if (!marker) {
        marker = createMarker(location);
      } else {
        marker.setLatLng(location);
      }
      reverseLookup(location);
    };

    if (initialLocation) {
      marker = createMarker(L.latLng(initialLocation.latitude, initialLocation.longitude));
    }
    map.on('click', (event: L.LeafletMouseEvent) => placePin(event.latlng));
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      abortControllerRef.current?.abort();
      if (lookupTimerRef.current !== null) window.clearTimeout(lookupTimerRef.current);
      map.remove();
    };
  }, [copy.lookupError, copy.noAddress, initialLocation]);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleDialogKeydown = (event: KeyboardEvent) => {
      trapModalFocus(event, dialogRef.current);
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleDialogKeydown);
    return () => window.removeEventListener('keydown', handleDialogKeydown);
  }, [onClose]);

  return (
    <div className="address-map-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="address-map-dialog" role="dialog" aria-modal="true" aria-labelledby="address-map-title" tabIndex={-1}>
        <header className="address-map-header">
          <h2 id="address-map-title">{copy.title}</h2>
          <button ref={closeButtonRef} className="address-map-close" type="button" aria-label={copy.close} onClick={onClose}>×</button>
        </header>
        <div className="address-map-picker">
          <p>{copy.instructions}</p>
          <div className="address-map" ref={mapElementRef} role="region" aria-label={copy.instructions} />
          {lookupPending && <p className="address-map-status" role="status">{copy.lookingUp}</p>}
          {lookupError && <p className="address-map-status address-map-error" role="status">{lookupError}</p>}
          {candidate && (
            <div className="address-map-candidate" aria-live="polite">
              <strong>{copy.confirmAddress}</strong>
              <span>{candidate.placeName || candidate.formattedAddress || copy.noAddress}</span>
              {candidate.formattedAddress && <p>{candidate.formattedAddress}</p>}
              <p>{copy.coordinates}: {candidate.latitude.toFixed(6)}, {candidate.longitude.toFixed(6)}</p>
              {(candidate.osmType || candidate.osmId || candidate.placeCategory || candidate.placeType || candidate.addressType) && (
                <p>{copy.mapFeature}: {[candidate.osmType && `${candidate.osmType}/${candidate.osmId}`, candidate.placeCategory, candidate.placeType, candidate.addressType].filter(Boolean).join(' · ')}</p>
              )}
              <p>{copy.feeNote}</p>
              <button type="button" className="button button-primary" onClick={() => {
                onUseAddress(candidate);
                onClose();
              }}>{copy.useAddress}</button>
            </div>
          )}
          <a className="address-map-attribution" href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer">{copy.attribution}</a>
        </div>
        <footer className="address-map-footer">
          <button className="button button-outline" type="button" onClick={onClose}>{copy.cancel}</button>
        </footer>
      </section>
    </div>
  );
}
