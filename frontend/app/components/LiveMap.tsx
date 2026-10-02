"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";


maplibregl.setWorkerUrl(
  "/maplibre/maplibre-gl-worker.mjs"
);

type PickupLocation = {
  lat: number;
  lng: number;
};
export type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
};

type LiveMapProps = {
  lat: number;
  lng: number;
  heading?: number | null;
  pickup: PickupLocation | null;
  onPickupChange: (pickup: PickupLocation) => void;
  onRouteInfo?: (info: RouteInfo) => void;
};

const ROUTE_SOURCE_ID = "routex-route";
const ROUTE_OUTLINE_LAYER_ID = "routex-route-outline";
const ROUTE_LAYER_ID = "routex-route-line";

export default function LiveMap({
  lat,
  lng,
  heading = null,
  pickup,
  onPickupChange,
  onRouteInfo,
}: LiveMapProps) {
  const mapContainer =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  const driverMarkerRef =
    useRef<maplibregl.Marker | null>(null);

  const pickupMarkerRef =
    useRef<maplibregl.Marker | null>(null);

  const driverElementRef =
    useRef<HTMLDivElement | null>(null);

  const previousPositionRef = useRef({
    lat,
    lng,
  });

  const animationRef =
    useRef<number | null>(null);

  const currentHeadingRef =
    useRef(0);

  const onPickupChangeRef =
    useRef(onPickupChange);

    const onRouteInfoRef =
  useRef(onRouteInfo);

  const routeRequestRef =
    useRef<AbortController | null>(null);

  const lastRouteRequestRef =
    useRef(0);

  const hasFittedRouteRef =
    useRef(false);

  useEffect(() => {
    onPickupChangeRef.current =
      onPickupChange;
  }, [onPickupChange]);

  useEffect(() => {
  onRouteInfoRef.current =
    onRouteInfo;
}, [onRouteInfo]);
  // ============================================================
  // DRIVER CAR
  // ============================================================

  function createDriverCar() {
    const marker =
      document.createElement("div");

    marker.style.width = "36px";
    marker.style.height = "54px";
    marker.style.pointerEvents = "none";
    marker.style.position = "relative";

    marker.innerHTML = `
      <div
        data-driver-car
        style="
          width:36px;
          height:54px;
          transform-origin:50% 50%;
          transition:transform 450ms ease;
        "
      >
        <svg
          width="36"
          height="54"
          viewBox="0 0 42 62"
          xmlns="http://www.w3.org/2000/svg"
          style="
            overflow:visible;
            filter:drop-shadow(0 3px 3px rgba(0,0,0,.28));
          "
        >
          <defs>

            <linearGradient
              id="carBody"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stop-color="#d9442e"/>
              <stop offset="18%" stop-color="#f85a3e"/>
              <stop offset="50%" stop-color="#ff765a"/>
              <stop offset="82%" stop-color="#f85a3e"/>
              <stop offset="100%" stop-color="#c93625"/>
            </linearGradient>

            <linearGradient
              id="glass"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stop-color="#46545d"/>
              <stop offset="45%" stop-color="#1d272d"/>
              <stop offset="100%" stop-color="#080c0f"/>
            </linearGradient>

            <linearGradient
              id="reflection"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stop-color="rgba(255,255,255,.40)"
              />
              <stop
                offset="55%"
                stop-color="rgba(255,255,255,.08)"
              />
              <stop
                offset="100%"
                stop-color="rgba(255,255,255,0)"
              />
            </linearGradient>

          </defs>

          <ellipse
            cx="21"
            cy="33"
            rx="17"
            ry="27"
            fill="rgba(0,0,0,.15)"
          />

          <path
            d="
              M21 2
              C13 2 8 6 6 13
              C4 21 4 41 6 49
              C8 56 13 60 21 60
              C29 60 34 56 36 49
              C38 41 38 21 36 13
              C34 6 29 2 21 2
              Z
            "
            fill="url(#carBody)"
            stroke="#b83324"
            stroke-width="1"
          />

          <path
            d="
              M10 15
              C12 8 15 5 21 5
              C27 5 30 8 32 15
              C27 17 15 17 10 15
              Z
            "
            fill="#ff6b4e"
          />

          <path
            d="
              M12 11
              C15 7 18 6 21 6
              C24 6 27 7 30 11
            "
            fill="none"
            stroke="rgba(255,255,255,.42)"
            stroke-width="1.5"
            stroke-linecap="round"
          />

          <path
            d="
              M10 21
              C11 17 14 15 18 14
              L24 14
              C28 15 31 17 32 21
              L31 41
              C29 45 26 47 21 47
              C16 47 13 45 11 41
              Z
            "
            fill="url(#glass)"
            stroke="#12191d"
            stroke-width="1"
          />

          <path
            d="
              M11 21
              C14 17 17 16 21 16
              C25 16 28 17 31 21
              L29 27
              C24 25 18 25 13 27
              Z
            "
            fill="#253139"
          />

          <path
            d="
              M14 19
              C17 17 20 17 24 17
              L27 18
            "
            fill="none"
            stroke="rgba(255,255,255,.38)"
            stroke-width="1.5"
            stroke-linecap="round"
          />

          <path
            d="
              M13 29
              C18 27 24 27 29 29
              L29 38
              C27 42 24 44 21 44
              C18 44 15 42 13 38
              Z
            "
            fill="url(#reflection)"
            opacity=".45"
          />

          <path
            d="
              M6 25
              C2 24 1 26 2 29
              C3 31 5 31 7 30
              Z
            "
            fill="#d33c29"
          />

          <path
            d="
              M36 25
              C40 24 41 26 40 29
              C39 31 37 31 35 30
              Z
            "
            fill="#d33c29"
          />

          <path
            d="
              M10 45
              C15 48 27 48 32 45
              L33 51
              C30 56 26 58 21 58
              C16 58 12 56 9 51
              Z
            "
            fill="#e64a33"
          />

          <path
            d="M9 12 C11 9 13 8 15 7"
            stroke="#fff8dc"
            stroke-width="2"
            stroke-linecap="round"
          />

          <path
            d="M33 12 C31 9 29 8 27 7"
            stroke="#fff8dc"
            stroke-width="2"
            stroke-linecap="round"
          />

          <path
            d="M10 51 C12 54 14 55 16 56"
            stroke="#8e1714"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <path
            d="M32 51 C30 54 28 55 26 56"
            stroke="#8e1714"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <text
            x="21"
            y="53"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            font-family="Arial, sans-serif"
            font-size="6"
            font-weight="900"
          >
            X
          </text>

        </svg>
      </div>
    `;

    driverElementRef.current =
      marker.querySelector(
        "[data-driver-car]"
      ) as HTMLDivElement | null;

    return marker;
  }

  // ============================================================
  // PICKUP MARKER
  // ============================================================

  function createPickupMarker() {
    const marker =
      document.createElement("div");

    marker.style.width = "32px";
    marker.style.height = "32px";
    marker.style.display = "flex";
    marker.style.alignItems = "center";
    marker.style.justifyContent = "center";

    marker.innerHTML = `
      <div
        style="
          width:22px;
          height:22px;
          background:white;
          border:5px solid #17191f;
          border-radius:50%;
          box-shadow:0 4px 12px rgba(0,0,0,.30);
        "
      ></div>
    `;

    return marker;
  }

  // ============================================================
  // EMPTY ROUTE
  // ============================================================

  function emptyRoute() {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  // ============================================================
  // UPDATE ROUTE SOURCE
  // ============================================================

  function setRoute(
    coordinates: [number, number][]
  ) {
    const map = mapRef.current;

    if (!map) return;

    const source =
      map.getSource(
        ROUTE_SOURCE_ID
      ) as maplibregl.GeoJSONSource | undefined;

    if (!source) return;

    source.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    });
  }

  // ============================================================
  // FIT DRIVER + PICKUP
  // ============================================================

  function fitDriverAndPickup(
    driverLng: number,
    driverLat: number,
    pickupLng: number,
    pickupLat: number
  ) {
    const map = mapRef.current;

    if (!map) return;

    const bounds =
      new maplibregl.LngLatBounds();

    bounds.extend([
      driverLng,
      driverLat,
    ]);

    bounds.extend([
      pickupLng,
      pickupLat,
    ]);

    map.fitBounds(bounds, {
      padding: {
        top: 80,
        bottom: 80,
        left: 80,
        right: 80,
      },

      maxZoom: 16,
      duration: 1000,
    });
  }

  // ============================================================
  // GET ROAD ROUTE
  // ============================================================

  async function updateRoadRoute(
    driverLat: number,
    driverLng: number,
    pickupLat: number,
    pickupLng: number,
    fitMap = false
  ) {
    const now = Date.now();

    // Don't hammer OSRM on every tiny GPS update.
    if (
      !fitMap &&
      now - lastRouteRequestRef.current <
        4000
    ) {
      return;
    }

    lastRouteRequestRef.current = now;

    routeRequestRef.current?.abort();

    const controller =
      new AbortController();

    routeRequestRef.current =
      controller;

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${driverLng},${driverLat};` +
        `${pickupLng},${pickupLat}` +
        `?overview=full&geometries=geojson&steps=false`;

      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `OSRM ${response.status}`
        );
      }

        const data = await response.json();

        const route = data?.routes?.[0];

        const coordinates =
  route?.geometry?.coordinates as
    | [number, number][]
    | undefined;

      if (
        !coordinates ||
        coordinates.length < 2
      ) {
        console.warn(
          "No road route returned."
        );

        return;
      }

     setRoute(coordinates);

// Send the real OSRM road distance
// and estimated driving time to the passenger page.
if (
  typeof route?.distance === "number" &&
  typeof route?.duration === "number"
) {
  onRouteInfoRef.current?.({
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  });
}

if (fitMap) {
  fitDriverAndPickup(
    driverLng,
    driverLat,
    pickupLng,
    pickupLat
  );
}

    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "ROUTE ERROR:",
        error
      );
    }
  }

  // ============================================================
  // CREATE MAP
  // ============================================================

  useEffect(() => {
    if (
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    const map =
      new maplibregl.Map({
        container:
          mapContainer.current,

        style: {
          version: 8,

          sources: {
            osm: {
              type: "raster",

              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],

              tileSize: 256,

              attribution:
                "© OpenStreetMap contributors",
            },

            [ROUTE_SOURCE_ID]: {
              type: "geojson",
              data: emptyRoute(),
            },
          },

          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },

            // White border makes the route visible
            // over roads and map labels.
            {
              id:
                ROUTE_OUTLINE_LAYER_ID,

              type: "line",

              source:
                ROUTE_SOURCE_ID,

              layout: {
                "line-cap": "round",
                "line-join": "round",
              },

              paint: {
                "line-color":
                  "#ffffff",

                "line-width": 9,

                "line-opacity": 0.92,
              },
            },

            {
  id: ROUTE_LAYER_ID,

  type: "line",

  source:
    ROUTE_SOURCE_ID,

  layout: {
    "line-cap": "round",
    "line-join": "round",
  },

  paint: {
    "line-color": "#ff6547",
    "line-width": 6,
    "line-opacity": 1,
  },
},
          ],
        },

        center: [lng, lat],

        zoom: 16,
      });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
      }),
      "top-right"
    );

    map.on("load", () => {
      if (
        !driverMarkerRef.current
      ) {
        driverMarkerRef.current =
          new maplibregl.Marker({
            element:
              createDriverCar(),

            anchor: "center",
          })
            .setLngLat([
              lng,
              lat,
            ])
            .addTo(map);
      }
    });

    map.on(
      "click",
      (event) => {
        onPickupChangeRef.current({
          lat:
            event.lngLat.lat,

          lng:
            event.lngLat.lng,
        });
      }
    );

    return () => {
      routeRequestRef.current?.abort();

      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      driverMarkerRef.current?.remove();
      pickupMarkerRef.current?.remove();

      driverMarkerRef.current =
        null;

      pickupMarkerRef.current =
        null;

      driverElementRef.current =
        null;

      map.remove();

      mapRef.current = null;
    };
  }, []);

  // ============================================================
  // SMOOTH DRIVER MOVEMENT
  // ============================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (
      !driverMarkerRef.current
    ) {
      driverMarkerRef.current =
        new maplibregl.Marker({
          element:
            createDriverCar(),

          anchor: "center",
        })
          .setLngLat([
            lng,
            lat,
          ])
          .addTo(map);

      previousPositionRef.current = {
        lat,
        lng,
      };

      return;
    }

    const start =
      previousPositionRef.current;

    const destination = {
      lat,
      lng,
    };

    if (
      animationRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationRef.current
      );
    }

    const startedAt =
      performance.now();

    const duration = 1200;

    function animate(now: number) {
      const elapsed =
        now - startedAt;

      const rawProgress =
        Math.min(
          elapsed / duration,
          1
        );

      const progress =
        rawProgress < 0.5
          ? 2 *
            rawProgress *
            rawProgress
          : 1 -
            Math.pow(
              -2 * rawProgress + 2,
              2
            ) /
              2;

      const animatedLat =
        start.lat +
        (destination.lat -
          start.lat) *
          progress;

      const animatedLng =
        start.lng +
        (destination.lng -
          start.lng) *
          progress;

      driverMarkerRef.current?.setLngLat([
        animatedLng,
        animatedLat,
      ]);

      if (rawProgress < 1) {
        animationRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        previousPositionRef.current =
          destination;

        animationRef.current =
          null;
      }
    }

    animationRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }
    };
  }, [lat, lng]);

  // ============================================================
  // DRIVER HEADING
  // ============================================================

  useEffect(() => {
    if (
      heading === null ||
      heading === undefined ||
      !Number.isFinite(heading)
    ) {
      return;
    }

    const car =
      driverElementRef.current;

    if (!car) return;

    const newHeading =
      ((heading % 360) + 360) %
      360;

    const oldHeading =
      currentHeadingRef.current;

    let difference =
      newHeading - oldHeading;

    if (difference > 180) {
      difference -= 360;
    }

    if (difference < -180) {
      difference += 360;
    }

    const finalHeading =
      oldHeading + difference;

    currentHeadingRef.current =
      finalHeading;

    car.style.transform =
      `rotate(${finalHeading}deg)`;
  }, [heading]);

  // ============================================================
  // PASSENGER PICKUP
  // ============================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (!pickup) {
      pickupMarkerRef.current?.remove();

      pickupMarkerRef.current =
        null;

      const source =
        map.getSource(
          ROUTE_SOURCE_ID
        ) as
          | maplibregl.GeoJSONSource
          | undefined;

      source?.setData(
        emptyRoute()
      );

      hasFittedRouteRef.current =
        false;

      return;
    }

    if (
      !pickupMarkerRef.current
    ) {
      pickupMarkerRef.current =
        new maplibregl.Marker({
          element:
            createPickupMarker(),

          anchor: "center",
        })
          .setLngLat([
            pickup.lng,
            pickup.lat,
          ])
          .addTo(map);
    } else {
      pickupMarkerRef.current.setLngLat([
        pickup.lng,
        pickup.lat,
      ]);
    }

    const runRoute = () => {
      const shouldFit =
        !hasFittedRouteRef.current;

      updateRoadRoute(
        lat,
        lng,
        pickup.lat,
        pickup.lng,
        shouldFit
      );

      if (shouldFit) {
        hasFittedRouteRef.current =
          true;
      }
    };

    if (map.loaded()) {
      runRoute();
    } else {
      map.once(
        "load",
        runRoute
      );
    }
  }, [pickup]);

  // ============================================================
  // RECALCULATE ROUTE WHEN DRIVER MOVES
  // ============================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !pickup) {
      return;
    }

    const runRoute = () => {
      updateRoadRoute(
        lat,
        lng,
        pickup.lat,
        pickup.lng,
        false
      );
    };

    if (map.loaded()) {
      runRoute();
    } else {
      map.once(
        "load",
        runRoute
      );
    }
  }, [
    lat,
    lng,
    pickup?.lat,
    pickup?.lng,
  ]);

  // ============================================================
  // MAP
  // ============================================================

  return (
    <div
      ref={mapContainer}
      className="h-full w-full"
    />
  );
}