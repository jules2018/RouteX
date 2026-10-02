

"use client";

import {

  useEffect,

  useMemo,

  useState,
  Suspense,

} from "react";

import { useSearchParams } from "next/navigation";

import { supabase } from "../lib/supabase";



import LiveMap, {

  type RouteInfo,

} from "../components/LiveMap";






// ============================================================

// TYPES

// ============================================================



type Booking = {

  id: number;



  passenger_id: number;



  assigned_driver_id: number | null;



  pickup_address: string | null;



  dropoff_address: string | null;

  pickup_lat: number | string | null;

  pickup_lng: number | string | null;
destination_lat: number | string | null;
destination_lng: number | string | null;


  confirmed_pickup_lat:

    | number

    | string

    | null;



  confirmed_pickup_lng:

    | number

    | string

    | null;



  booking_status: string | null;



  trip_status: string | null;

};



type Driver = {

  id: number;



  full_name: string | null;



  vehicle_type: string | null;



  vehicle_color: string | null;



  license_plate: string | null;



  profile_image: string | null;



  current_lat: number | string | null;



  current_lng: number | string | null;

};



type PickupLocation = {

  lat: number;

  lng: number;

};



// ============================================================

// FORMAT ROAD DISTANCE

// ============================================================



function formatRoadDistance(

  distanceMeters: number

) {

  if (distanceMeters < 1000) {

    return `${Math.round(

      distanceMeters

    )} m`;

  }



  return `${(

    distanceMeters / 1000

  ).toFixed(1)} km`;

}



// ============================================================

// FORMAT ETA

// ============================================================



function formatEta(

  durationSeconds: number

) {

  const minutes = Math.max(

    1,

    Math.ceil(

      durationSeconds / 60

    )

  );



  if (minutes < 60) {

    return {

      primary: `${minutes}`,

      secondary: "min",

    };

  }



  const hours =

    Math.floor(minutes / 60);



  const remainingMinutes =

    minutes % 60;



  return {

    primary: `${hours} hr`,

    secondary:

      remainingMinutes > 0

        ? `${remainingMinutes} min`

        : "",

  };

}



// ============================================================

// PAGE

// ============================================================



function PassengerPageContent() {
  const searchParams = useSearchParams();

  const bookingParam = searchParams.get("booking");

  const bookingId =
    bookingParam && /^\d+$/.test(bookingParam)
      ? Number(bookingParam)
      : null;

  const [booking, setBooking] =

    useState<Booking | null>(null);



  const [driver, setDriver] =

    useState<Driver | null>(null);



  const [connected, setConnected] =

    useState(false);



  const [loading, setLoading] =

    useState(true);



  const [error, setError] =

    useState<string | null>(null);



  const [routeInfo, setRouteInfo] =

    useState<RouteInfo | null>(null);



  // ==========================================================

  // LOAD BOOKING

  // ==========================================================



  useEffect(() => {

    async function loadBooking() {

      setLoading(true);
      setError(null);
      setBooking(null);
      setDriver(null);
      setRouteInfo(null);

      if (!bookingId) {
        setError("No valid RouteX booking was provided.");
        setLoading(false);
        return;
      }



      const { data, error } =

        await supabase

          .from("trip_bookings")

          .select(`

            id,

            passenger_id,

            assigned_driver_id,

            pickup_address,

            dropoff_address,

            pickup_lat,
            pickup_lng,
            destination_lat,
            destination_lng,
            confirmed_pickup_lat,
            confirmed_pickup_lng,
            booking_status,
            trip_status

          `)

          .eq(

            "id",

            bookingId

          )

          .single();



      if (error) {

        console.error(

          "BOOKING LOAD ERROR:",

          error

        );



        setError(

          "Could not load the RouteX booking."

        );



        setLoading(false);



        return;

      }



      setBooking(

        data as Booking

      );



      setLoading(false);

    }



loadBooking();

}, [bookingId]);
useEffect(() => {
  if (!bookingId) return;

  async function refreshBookingStatus() {
    const { data, error } = await supabase
      .from("trip_bookings")
      .select(`
        id,
        passenger_id,
        assigned_driver_id,
        pickup_address,
        dropoff_address,
        pickup_lat,
        pickup_lng,
        destination_lat,
        destination_lng,
        confirmed_pickup_lat,
        confirmed_pickup_lng,
        booking_status,
        trip_status
      `)
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      console.error("BOOKING STATUS REFRESH ERROR:", error);
      return;
    }

    setBooking((current) => {
      if (!current) return data as Booking;

      return {
        ...current,
        ...(data as Booking),
      };
    });
  }

  const interval = window.setInterval(() => {
    refreshBookingStatus();
  }, 5000);

  return () => {
    window.clearInterval(interval);
  };
}, [bookingId]);
// ==========================================================
// REALTIME BOOKING STATUS
// ==========================================================

useEffect(() => {
  if (!bookingId) {
    return;
  }

  const channel = supabase
    .channel(`routex-booking-${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "trip_bookings",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        console.log(
          "LIVE BOOKING UPDATE:",
          payload.new
        );

        const updatedBooking =
          payload.new as Booking;

        setBooking((current) => {
          if (!current) {
            return updatedBooking;
          }

          return {
            ...current,
            ...updatedBooking,
          };
        });
      }
    )
    .subscribe((status) => {
      console.log(
        "BOOKING REALTIME:",
        status
      );
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [bookingId]);

  // ==========================================================

  // LOAD ASSIGNED DRIVER

  // ==========================================================



  useEffect(() => {

    if (

      !booking?.assigned_driver_id

    ) {

      return;

    }



    async function loadDriver() {

      const { data, error } =

        await supabase

          .from("drivers")

          .select(`

            id,

            full_name,

            vehicle_type,

            vehicle_color,

            license_plate,

            profile_image,

            current_lat,

            current_lng

          `)

          .eq(

            "id",

            booking!

              .assigned_driver_id

          )

          .single();



      if (error) {

        console.error(

          "DRIVER LOAD ERROR:",

          error

        );



        setError(

          "Could not load the assigned driver."

        );



        return;

      }



      setDriver(

        data as Driver

      );

    }



    loadDriver();

  }, [

    booking?.assigned_driver_id,

  ]);



  // ==========================================================

  // REALTIME DRIVER LOCATION

  // ==========================================================



  useEffect(() => {

    if (

      !booking?.assigned_driver_id

    ) {

      return;

    }



    const driverId =

      booking.assigned_driver_id;



    const channel = supabase

      .channel(

        `routex-driver-${driverId}`

      )

      .on(

        "postgres_changes",



        {

          event: "UPDATE",



          schema: "public",



          table: "drivers",



          filter:

            `id=eq.${driverId}`,

        },



        (payload) => {

          console.log(

            "LIVE DRIVER UPDATE:",

            payload.new

          );



          const updatedDriver =

            payload.new as Driver;



          setDriver(

            (current) => {

              if (!current) {

                return updatedDriver;

              }



              return {

                ...current,

                ...updatedDriver,

              };

            }

          );

        }

      )

      .subscribe(

        (status) => {

          console.log(

            "DRIVER REALTIME:",

            status

          );



          if (

            status ===

            "SUBSCRIBED"

          ) {

            setConnected(true);

          }



          if (

            status ===

              "CHANNEL_ERROR" ||

            status ===

              "TIMED_OUT"

          ) {

            setConnected(false);



            setError(

              "Live driver connection was interrupted."

            );

          }

        }

      );



    return () => {

      supabase.removeChannel(

        channel

      );

    };

  }, [

    booking?.assigned_driver_id,

  ]);



  // ==========================================================

  // PICKUP

  // ==========================================================



  const pickup =

    useMemo<PickupLocation | null>(

      () => {

        if (!booking) {

          return null;

        }



        // Prefer passenger-confirmed

        // pickup coordinates.



        const rawLat =

          booking

            .confirmed_pickup_lat ??

          booking.pickup_lat;



        const rawLng =

          booking

            .confirmed_pickup_lng ??

          booking.pickup_lng;



        if (

          rawLat === null ||

          rawLng === null

        ) {

          return null;

        }



        const lat =

          Number(rawLat);



        const lng =

          Number(rawLng);



        if (

          !Number.isFinite(lat) ||

          !Number.isFinite(lng)

        ) {

          return null;

        }



        return {

          lat,

          lng,

        };

      },



      [booking]

    );

// ==========================================================
// DESTINATION
// ==========================================================

const destination =
  useMemo<PickupLocation | null>(
    () => {
      if (!booking) {
        return null;
      }

      if (
        booking.destination_lat === null ||
        booking.destination_lng === null
      ) {
        return null;
      }

      const lat = Number(
        booking.destination_lat
      );

      const lng = Number(
        booking.destination_lng
      );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null;
      }

      return {
        lat,
        lng,
      };
    },
    [
      booking?.destination_lat,
      booking?.destination_lng,
    ]
  );


  // ==========================================================
// ROUTE TARGET
// ==========================================================

const normalizedTripStatus = String(
  booking?.trip_status || ""
)
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "_");

const tripInProgress =
  normalizedTripStatus === "in_progress";

const routeTarget =
  tripInProgress
    ? destination
    : pickup;
  // ==========================================================

  // DRIVER LOCATION

  // ==========================================================



  const driverLocation =

    useMemo(() => {

      if (

        driver?.current_lat ===

          null ||

        driver?.current_lat ===

          undefined ||

        driver?.current_lng ===

          null ||

        driver?.current_lng ===

          undefined

      ) {

        return null;

      }



      const lat =

        Number(

          driver.current_lat

        );



      const lng =

        Number(

          driver.current_lng

        );



      if (

        !Number.isFinite(lat) ||

        !Number.isFinite(lng)

      ) {

        return null;

      }



      return {

        lat,

        lng,

      };

    }, [

      driver?.current_lat,

      driver?.current_lng,

    ]);



  // ==========================================================

  // ROAD DISTANCE + ETA

  // ==========================================================



  const roadDistance =

    routeInfo

      ? formatRoadDistance(

          routeInfo.distanceMeters

        )

      : null;



  const eta =

    routeInfo

      ? formatEta(

          routeInfo.durationSeconds

        )

      : null;



  // ==========================================================

  // PASSENGER STATUS

  //

  // Uses ROAD distance now instead of straight-line distance.

  // ==========================================================



  let status = "Driver assigned";

if (tripInProgress) {
  if (
    routeInfo &&
    routeInfo.distanceMeters <= 80
  ) {
    status = "Arriving at destination";
  } else {
    status = "Trip in progress";
  }
} else if (routeInfo) {
  if (
    routeInfo.distanceMeters <= 80
  ) {
    status = "Driver is arriving";
  } else if (
    routeInfo.distanceMeters <= 250
  ) {
    status = "Driver is approaching";
  } else {
    status = "Driver is on the way";
  }
} else if (driverLocation) {
  status = "Driver is on the way";
}


  // ==========================================================
  // MOBILE BOTTOM SHEET
  // ==========================================================

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetPointerStart, setSheetPointerStart] = useState<number | null>(null);

  const handleSheetPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    setSheetPointerStart(event.clientY);
    setSheetDragY(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (sheetPointerStart === null) return;
    const delta = event.clientY - sheetPointerStart;
    setSheetDragY(Math.max(-90, Math.min(90, delta)));
  };

  const handleSheetPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (sheetPointerStart === null) return;

    if (sheetDragY < -28) setSheetExpanded(true);
    else if (sheetDragY > 28) setSheetExpanded(false);
    else setSheetExpanded((current) => !current);

    setSheetPointerStart(null);
    setSheetDragY(0);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

    return (
    <main className="min-h-screen bg-white text-[#17191f]">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="text-center">
            <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-[#ff6547]" />

            <p className="mt-3 text-sm font-semibold text-[#17191f]">
              Loading your ride...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="max-w-md rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {error}
          </div>
        </div>
      ) : (
        <>
          {/* =====================================================
              MOBILE — FULL SCREEN MAP
          ====================================================== */}

          <div className="fixed inset-0 overflow-hidden bg-white lg:hidden">

            {/* MAP */}
            <div className="absolute inset-0">
             {driverLocation && routeTarget ? (
              <LiveMap
                lat={driverLocation.lat}
                lng={driverLocation.lng}
                heading={null}
                pickup={routeTarget}
                onPickupChange={() => {}}
                onRouteInfo={setRouteInfo}
              />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#f7f7f7] px-6 text-center">
                  <div>
                    <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-[#ff6547]" />

                    <p className="mt-3 text-sm font-bold text-[#17191f]">
                      Waiting for driver location
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      The map will appear when live GPS is available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* TOP CONTROLS */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">

              {/* CLOSE */}
              <button
                type="button"
                onClick={() => window.history.back()}
                aria-label="Back to ride"
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white text-xl font-medium text-[#17191f] shadow-[0_3px_14px_rgba(0,0,0,0.12)] transition active:scale-95"
              >
                ×
              </button>

              {/* LIVE */}
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3.5 py-2.5 shadow-[0_3px_14px_rgba(0,0,0,0.10)]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connected
                      ? "bg-green-500"
                      : "bg-black/25"
                  }`}
                />

                <span className="text-xs font-bold">
                  {connected
                    ? "Live"
                    : "Connecting"}
                </span>
              </div>
            </div>

            {/* ETA CHIP — ONLY WHEN SHEET IS CLOSED */}
            {!sheetExpanded && eta && roadDistance && (
              <div className="pointer-events-none absolute left-4 top-[calc(max(1rem,env(safe-area-inset-top))+58px)] z-20 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 shadow-[0_3px_14px_rgba(0,0,0,0.10)]">
                <span className="text-sm font-bold text-[#17191f]">
                  {eta.primary} {eta.secondary}
                </span>

                <span className="mx-2 text-black/20">
                  •
                </span>

                <span className="text-sm font-medium text-black/55">
                  {roadDistance}
                </span>
              </div>
            )}

            {/* =====================================================
                BOTTOM RIDE SHEET
            ====================================================== */}

            <section
              className={`absolute inset-x-0 bottom-0 z-40 rounded-t-[28px] border-t border-black/[0.06] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.10)] ${
                sheetExpanded
                ? "h-[310px]"
                : "h-[150px]"
              }`}
              style={{
                transform: `translateY(${sheetDragY}px)`,
                transition:
                  sheetPointerStart === null
                    ? "height 300ms cubic-bezier(.22,.8,.32,1), transform 300ms cubic-bezier(.22,.8,.32,1)"
                    : "none",
              }}
            >

              {/* DRAG HANDLE */}
              <button
                type="button"
                onPointerDown={handleSheetPointerDown}
                onPointerMove={handleSheetPointerMove}
                onPointerUp={handleSheetPointerEnd}
                onPointerCancel={handleSheetPointerEnd}
                className="block w-full touch-none cursor-grab pb-2 pt-3 active:cursor-grabbing"
                aria-label={
                  sheetExpanded
                    ? "Collapse ride details"
                    : "Expand ride details"
                }
              >
                <span className="mx-auto block h-1 w-10 rounded-full bg-black/20" />
              </button>

              <div className="px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">

                {/* STATUS */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2
                      className={`text-[18px] font-bold leading-tight ${
                        status === "Driver is arriving"
                          ? "text-[#ff6547]"
                          : "text-[#17191f]"
                      }`}
                    >
                      {status}
                    </h2>

                   <p className="text-sm font-medium text-black/45">
                    {roadDistance
                      ? tripInProgress
                        ? `${roadDistance} to destination`
                        : `${roadDistance} away`
                      : "Locating driver..."}
                  </p>
                  </div>

                  {sheetExpanded && eta && (
                    <p className="shrink-0 text-sm font-bold text-[#17191f]">
                      {eta.primary}{" "}
                      <span className="font-medium text-black/45">
                        {eta.secondary}
                      </span>
                    </p>
                  )}
                </div>

                {/* DRIVER */}
                {driver && (
                  <div className="mt-2.5 flex items-center gap-3 border-t border-black/[0.06] pt-2.5">

                    {driver.profile_image ? (
                      <img
                        src={driver.profile_image}
                        alt={
                          driver.full_name ||
                          "RouteX driver"
                        }
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-sm font-bold">
                        {driver.full_name
                          ?.charAt(0)
                          ?.toUpperCase() ?? "D"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[#17191f]">
                        {driver.full_name ||
                          "RouteX Driver"}
                      </p>

                      <p className="truncate text-xs font-medium text-black/45">
                        {[
                          driver.vehicle_color,
                          driver.vehicle_type,
                        ]
                          .filter(Boolean)
                          .join(" ")}

                        {driver.license_plate
                          ? ` · ${driver.license_plate}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* EXPANDED TRIP DETAILS */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    sheetExpanded
                    ? "mt-3 max-h-[145px] opacity-100"
                    : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-black/[0.06] pt-3">

                    <div className="grid grid-cols-[16px_1fr] gap-x-3">

                      {/* ROUTE INDICATORS */}
                      <div className="flex flex-col items-center pt-1">
                        <span className="h-3 w-3 rounded-full border-[3px] border-[#ff6547] bg-white" />

                        <span className="my-1 h-5 w-px bg-black/15" />

                        <span className="h-3 w-3 rounded-full bg-[#17191f]" />
                      </div>

                      {/* ADDRESSES */}
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                          Pickup
                        </p>

                        <p className="mt-0.5 truncate text-sm font-semibold">
                          {booking?.pickup_address ||
                            "Pickup location"}
                        </p>

                       <div className="mt-2">
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                            Destination
                          </p>

                          <p className="mt-0.5 truncate text-sm font-semibold">
                            {booking?.dropoff_address ||
                              "Destination"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {routeInfo &&
                      routeInfo.distanceMeters <= 80 && (
                        <p className="mt-3 text-xs font-bold text-[#ff6547]">
                          Your driver is at the pickup location.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </section>
          </div>
                    {/* =====================================================
              DESKTOP — CLEAN SIDE PANEL + MAP
          ====================================================== */}

          <div className="mx-auto hidden min-h-screen max-w-7xl gap-5 bg-[#f7f7f7] px-6 py-6 lg:grid lg:grid-cols-[330px_1fr]">

            {/* LEFT PANEL */}
            <aside className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.07)]">

              {/* BRAND + LIVE */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff6547]" />

                  <h1 className="text-xl font-bold text-[#17191f]">
                    RouteX
                  </h1>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connected
                        ? "bg-green-500"
                        : "bg-black/25"
                    }`}
                  />

                  <span className="text-[10px] font-bold uppercase">
                    {connected
                      ? "Live"
                      : "Connecting"}
                  </span>
                </div>
              </div>

              {/* RIDE STATUS */}
              <div className="mt-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                  Live ride · #{booking?.id}
                </p>

                <h2
                  className={`mt-2 text-2xl font-bold ${
                    status === "Driver is arriving"
                      ? "text-[#ff6547]"
                      : "text-[#17191f]"
                  }`}
                >
                  {status}
                </h2>

                <div className="mt-3 flex items-end justify-between gap-3">
                 <p className="text-sm font-medium text-black/45">
                  {roadDistance
                    ? tripInProgress
                      ? `${roadDistance} to destination`
                      : `${roadDistance} away`
                    : "Locating driver..."}
                </p>

                  {eta && (
                    <p className="text-xl font-bold text-[#17191f]">
                      {eta.primary}{" "}
                      <span className="text-sm font-medium text-black/45">
                        {eta.secondary}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* DRIVER */}
              {driver && (
                <div className="mt-6 flex items-center gap-3 border-t border-black/[0.06] pt-5">

                  {driver.profile_image ? (
                    <img
                      src={driver.profile_image}
                      alt={
                        driver.full_name ||
                        "RouteX driver"
                      }
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] font-bold">
                      {driver.full_name
                        ?.charAt(0)
                        ?.toUpperCase() ?? "D"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[#17191f]">
                      {driver.full_name ||
                        "RouteX Driver"}
                    </p>

                    <p className="text-sm text-black/45">
                      {[
                        driver.vehicle_color,
                        driver.vehicle_type,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>

                    {driver.license_plate && (
                      <p className="mt-0.5 text-sm font-semibold">
                        {driver.license_plate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TRIP */}
              <div className="mt-6 border-t border-black/[0.06] pt-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Pickup
                </p>

                <p className="mt-1 text-sm font-semibold text-[#17191f]">
                  {booking?.pickup_address ||
                    "Pickup location"}
                </p>

                <div className="my-4 h-px bg-black/[0.06]" />

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Destination
                </p>

                <p className="mt-1 text-sm font-semibold text-[#17191f]">
                  {booking?.dropoff_address ||
                    "Destination"}
                </p>
              </div>

              {/* BACK */}
              <button
                type="button"
                onClick={() => window.history.back()}
                className="mt-6 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm font-bold transition hover:bg-black/[0.02] active:scale-[0.98]"
              >
                ← Back to ride
              </button>
            </aside>

            {/* DESKTOP MAP */}
            <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white p-2 shadow-[0_6px_24px_rgba(0,0,0,0.07)]">

              <div className="h-[calc(100vh-48px)] overflow-hidden rounded-[19px]">

                {driverLocation && routeTarget ? (
                <LiveMap
                  lat={driverLocation.lat}
                  lng={driverLocation.lng}
                  heading={null}
                  pickup={routeTarget}
                  onPickupChange={() => {}}
                  onRouteInfo={setRouteInfo}
                />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#f7f7f7] text-center">
                    <div>
                      <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-[#ff6547]" />

                      <p className="mt-3 text-sm font-bold">
                        Waiting for driver location
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
export default function PassengerPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm font-semibold text-black/50">
            Loading your ride...
          </p>
        </main>
      }
    >
      <PassengerPageContent />
    </Suspense>
  );
}