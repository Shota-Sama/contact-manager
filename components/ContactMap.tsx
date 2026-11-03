"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

function LocationPicker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!lat && !lng) return null;

  return <Marker position={[lat, lng]} />;
}

function MapViewUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat || lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return null;
}

export default function ContactMap({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const center: [number, number] =
    lat || lng ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="h-64 w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 sm:h-80">
      <MapContainer
        center={center}
        zoom={lat || lng ? 13 : 5}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker lat={lat} lng={lng} onLocationChange={onLocationChange} />
        <MapViewUpdater lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
