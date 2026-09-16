"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const driverIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:50%;
      background:#111111;
      border:4px solid white;
      box-shadow:0 3px 12px rgba(0,0,0,0.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      font-weight:800;
    ">
      D
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:50%;
      background:#ff6a00;
      border:4px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FollowDriver({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.panTo([latitude, longitude], {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

export default function DriverMap({
  driverLat,
  driverLng,
  pickupLat,
  pickupLng,
  driverName,
}: {
  driverLat: number;
  driverLng: number;
  pickupLat: number;
  pickupLng: number;
  driverName?: string;
}) {
  return (
    <div className="h-[300px] w-full overflow-hidden rounded-[20px]">
      <MapContainer
        center={[driverLat, driverLng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[pickupLat, pickupLng]}
          icon={pickupIcon}
        >
          <Popup>Your pickup location</Popup>
        </Marker>

        <Marker
          position={[driverLat, driverLng]}
          icon={driverIcon}
        >
          <Popup>
            {driverName || "Your RouteX driver"}
          </Popup>
        </Marker>

        <FollowDriver
          latitude={driverLat}
          longitude={driverLng}
        />
      </MapContainer>
    </div>
  );
}