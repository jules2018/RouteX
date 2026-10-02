"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type LocationPickerProps = {
  title: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (location: {
    lat: number;
    lng: number;
  }) => void;
  onClose: () => void;
};

export default function LocationPicker({
  title,
  initialLat = -28.4563,
  initialLng = 21.2419,
  onConfirm,
  onClose,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const selectedLocation = useRef({
    lat: initialLat,
    lng: initialLng,
  });

  useEffect(() => {
  if (!mapContainer.current) return;

  // Clean up any previous MapLibre instance during Next.js Fast Refresh
  if (mapRef.current) {
    mapRef.current.remove();
    mapRef.current = null;
  }

  // Clear any old MapLibre DOM left behind during development refresh
  mapContainer.current.innerHTML = "";

  const map = new maplibregl.Map({
      container: mapContainer.current,

     style: "https://tiles.openfreemap.org/styles/liberty",
      center: [initialLng, initialLat],
      zoom: 15,
    });

    mapRef.current = map;
    console.log("MAP CREATED:", map);

map.on("load", () => {
  console.log("MAP LOAD EVENT FIRED");
  map.resize();
});

map.on("style.load", () => {
  console.log("STYLE LOAD EVENT FIRED");
});

map.on("error", (event) => {
  console.error("MAPLIBRE ERROR:", event.error);
});

    map.on("move", () => {
      const center = map.getCenter();

      selectedLocation.current = {
        lat: center.lat,
        lng: center.lng,
      };
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng]);

  const handleConfirm = () => {
    onConfirm(selectedLocation.current);
  };

  return (
<div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold text-black"
        >
          Cancel
        </button>

        <p className="text-[15px] font-black text-black">
          {title}
        </p>

        <div className="w-[45px]" />
      </div>

{/* Map */}
<div
  ref={mapContainer}
  className="absolute left-0 right-0 top-[65px] bottom-[185px] z-0 bg-[#e8e8e8]"
  style={{
    width: "100%",
    height: "calc(100% - 250px)",
  }}
/>

      {/* Fixed centre pin */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
        <div className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff6846] shadow-xl">
            <div className="h-4 w-4 rounded-full border-[3px] border-white" />
          </div>

          <div className="h-3 w-[3px] bg-[#ff6846]" />
        </div>
      </div>

      {/* Bottom confirmation card */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white px-5 pb-6 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.10)]">
        <p className="text-center text-[13px] font-medium text-black/50">
          Move the map until the pin is at the exact location
        </p>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-4 w-full rounded-2xl bg-[#ff6846] px-5 py-4 text-[15px] font-black text-white"
        >
          Confirm location
        </button>
      </div>
    </div>
  );
}