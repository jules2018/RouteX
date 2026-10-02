"use client";

import { useEffect, useMemo, useState } from "react";
import LocationPicker from "../components/LocationPicker";

type RideType = "now" | "scheduled";

type AddressResult = {
  address: string;
  area_name: string | null;
  full_address: string;
  lat: number;
  lng: number;
  place_type?: string;
  source?: string;
};

type AppPopup = {
  title: string;
  message: string;
  tone?: "info" | "error";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const UPINGTON_LAT = -28.4563;
const UPINGTON_LNG = 21.2419;

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEarliestScheduledRide() {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  const roundedMinutes = Math.ceil(date.getMinutes() / 15) * 15;

  if (roundedMinutes >= 60) {
    date.setHours(date.getHours() + 1, 0, 0, 0);
  } else {
    date.setMinutes(roundedMinutes, 0, 0);
  }

  return {
    date: localDateString(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`,
  };
}

export default function BookingTestPage() {
  const earliestSchedule = useMemo(() => getEarliestScheduledRide(), []);

  const [rideType, setRideType] = useState<RideType>("now");

  const [showPickupSearch, setShowPickupSearch] = useState(false);
  const [pickupQuery, setPickupQuery] = useState("");
  const [pickupResults, setPickupResults] = useState<AddressResult[]>([]);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [pickupSearchFinished, setPickupSearchFinished] = useState(false);
  const [selectedPickup, setSelectedPickup] =
    useState<AddressResult | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showPickupMap, setShowPickupMap] = useState(false);
const [onlineDrivers, setOnlineDrivers] = useState<number>(0);
const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<AddressResult[]>(
    []
  );
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [destinationSearchFinished, setDestinationSearchFinished] =
    useState(false);
  const [selectedDestination, setSelectedDestination] =
    useState<AddressResult | null>(null);
  const [showDestinationMap, setShowDestinationMap] = useState(false);

  const [fare, setFare] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [outOfTownFee, setOutOfTownFee] = useState(0);
  const [calculatingFare, setCalculatingFare] = useState(false);

  const [travelDate, setTravelDate] = useState(earliestSchedule.date);
  const [pickupTime, setPickupTime] = useState(earliestSchedule.time);
  const [promoCode, setPromoCode] = useState("");

  const [passenger, setPassenger] = useState<any>(null);
  const [requestState, setRequestState] = useState<
    "idle" | "searching" | "no_driver"
  >("idle");
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [appPopup, setAppPopup] = useState<AppPopup | null>(null);

  const showAppPopup = (
    title: string,
    message: string,
    tone: AppPopup["tone"] = "info"
  ) => {
    setAppPopup({ title, message, tone });
  };

  useEffect(() => {
    const storedPassenger = localStorage.getItem("passenger");

    if (!storedPassenger) return;

    try {
      setPassenger(JSON.parse(storedPassenger));
    } catch (error) {
      console.error("PASSENGER SESSION ERROR:", error);
    }
  }, []);

  useEffect(() => {
    if (!selectedPickup || !selectedDestination) {
      setFare("");
      setDistanceKm(null);
      setOutOfTownFee(0);
      setCalculatingFare(false);
      return;
    }

    let cancelled = false;

    const calculateFare = async () => {
      try {
        setCalculatingFare(true);

        const params = new URLSearchParams({
          pickup_area: selectedPickup.area_name || "GPS Pickup",
          dropoff_area: selectedDestination.area_name || "GPS Destination",
          pickup_lat: String(selectedPickup.lat),
          pickup_lng: String(selectedPickup.lng),
          dropoff_lat: String(selectedDestination.lat),
          dropoff_lng: String(selectedDestination.lng),
        });

        const response = await fetch(
          `${API_URL}/calculate-fare?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Fare calculation failed");
        }

        const numericFare = Number(data.fare);

        if (!Number.isFinite(numericFare) || numericFare <= 0) {
          throw new Error("Invalid fare returned");
        }

        if (cancelled) return;

        setFare(String(numericFare));
        setDistanceKm(
          data.distance_km !== undefined ? Number(data.distance_km) : null
        );
        setOutOfTownFee(Number(data.out_of_town_fee || 0));
      } catch (error) {
        console.error("FARE CALCULATION ERROR:", error);

        if (!cancelled) {
          setFare("");
          setDistanceKm(null);
          setOutOfTownFee(0);
        }
      } finally {
        if (!cancelled) setCalculatingFare(false);
      }
    };

    calculateFare();

    return () => {
      cancelled = true;
    };
  }, [selectedPickup, selectedDestination]);

  const searchPickupAddress = async (query: string) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 3) {
      setPickupResults([]);
      setPickupSearchFinished(false);
      return;
    }

    try {
      setPickupSearching(true);
      setPickupSearchFinished(false);

      const response = await fetch(
        `${API_URL}/addresses/search?q=${encodeURIComponent(cleanQuery)}`
      );

      if (!response.ok) {
        throw new Error("Address search failed");
      }

      const data = await response.json();

      setPickupResults(
        Array.isArray(data) ? data : data.results || data.items || []
      );
      setPickupSearchFinished(true);
    } catch (error) {
      console.error("PICKUP SEARCH ERROR:", error);
      setPickupResults([]);
      setPickupSearchFinished(true);
    } finally {
      setPickupSearching(false);
    }
  };

  const searchDestinationAddress = async (query: string) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 3) {
      setDestinationResults([]);
      setDestinationSearchFinished(false);
      return;
    }

    try {
      setDestinationSearching(true);
      setDestinationSearchFinished(false);

      const response = await fetch(
        `${API_URL}/addresses/search?q=${encodeURIComponent(cleanQuery)}`
      );

      if (!response.ok) {
        throw new Error("Destination search failed");
      }

      const data = await response.json();

      setDestinationResults(
        Array.isArray(data) ? data : data.results || data.items || []
      );
      setDestinationSearchFinished(true);
    } catch (error) {
      console.error("DESTINATION SEARCH ERROR:", error);
      setDestinationResults([]);
      setDestinationSearchFinished(true);
    } finally {
      setDestinationSearching(false);
    }
  };

  const useCurrentPickupLocation = () => {
    if (!navigator.geolocation) {
      showAppPopup(
        "Location unavailable",
        "Location services are not supported on this device.",
        "error"
      );
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const response = await fetch(
            `${API_URL}/addresses/reverse?lat=${lat}&lng=${lng}`
          );

          if (!response.ok) {
            throw new Error("Could not resolve current location");
          }

          const data = await response.json();

          const pickup: AddressResult = {
            address: data.address,
            full_address: data.address,
            area_name: data.area_name,
            lat: Number(data.lat ?? lat),
            lng: Number(data.lng ?? lng),
            place_type: "gps",
            source: "gps",
          };

          setSelectedPickup(pickup);
          setPickupQuery("");
          setPickupResults([]);
          setPickupSearchFinished(false);
          setShowPickupSearch(false);
        } catch (error) {
          console.error("CURRENT LOCATION ERROR:", error);
          showAppPopup(
            "Location unavailable",
            "We couldn't determine your pickup address.",
            "error"
          );
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("GPS ERROR:", error);
        setGettingLocation(false);

        showAppPopup(
          "Location unavailable",
          "RouteX couldn't access your location. Allow location access or enter your pickup address.",
          "error"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const reverseMapLocation = async (
    location: { lat: number; lng: number },
    type: "pickup" | "destination"
  ) => {
    const response = await fetch(
      `${API_URL}/addresses/reverse?lat=${location.lat}&lng=${location.lng}`
    );

    if (!response.ok) {
      throw new Error("Could not resolve map location");
    }

    const data = await response.json();

    const result: AddressResult = {
      address: data.address,
      full_address: data.address,
      area_name: data.area_name,
      lat: location.lat,
      lng: location.lng,
      place_type: "map",
      source: "map",
    };

    if (type === "pickup") {
      setSelectedPickup(result);
      setPickupQuery("");
      setPickupResults([]);
      setPickupSearchFinished(false);
      setShowPickupMap(false);
      setShowPickupSearch(false);
    } else {
      setSelectedDestination(result);
      setDestinationQuery("");
      setDestinationResults([]);
      setDestinationSearchFinished(false);
      setShowDestinationMap(false);
      setShowDestinationSearch(false);
    }
  };

  const chooseRideType = (type: RideType) => {
    setRideType(type);

    if (type === "scheduled") {
      const earliest = getEarliestScheduledRide();
      setTravelDate(earliest.date);
      setPickupTime(earliest.time);
    }
  };
const loadOnlineDrivers = async () => {
  try {
    const response = await fetch(`${API_URL}/online-drivers`);

    if (!response.ok) {
      throw new Error(`Failed to load drivers: ${response.status}`);
    }

    const data = await response.json();

    setOnlineDrivers(Number(data.total) || 0);
  } catch (error) {
    console.error("Error loading online drivers:", error);
  }
};

const loadAvailableDrivers = async () => {
  try {
    if (!selectedPickup?.lat || !selectedPickup?.lng) {
      setAvailableDrivers([]);
      return;
    }

    const response = await fetch(
      `${API_URL}/available-drivers?pickup_lat=${selectedPickup.lat}&pickup_lng=${selectedPickup.lng}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load available drivers: ${response.status}`
      );
    }

    const data = await response.json();

    setAvailableDrivers(Array.isArray(data) ? data : []);

    console.log("AVAILABLE DRIVERS:", data);
  } catch (error) {
    console.error("Error loading available drivers:", error);
    setAvailableDrivers([]);
  }
};

useEffect(() => {
  if (requestState !== "searching") return;

  loadOnlineDrivers();
  loadAvailableDrivers();

  const interval = window.setInterval(() => {
    loadOnlineDrivers();
    loadAvailableDrivers();
  }, 5000);

  return () => window.clearInterval(interval);
}, [requestState, selectedPickup]);


  const changeScheduledDate = (days: number) => {
    const current = new Date(`${travelDate}T12:00:00`);
    current.setDate(current.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (current < today) return;

    setTravelDate(localDateString(current));
  };

  const changeScheduledTime = (minutes: number) => {
    const current = new Date(`${travelDate}T${pickupTime || "00:00"}:00`);
    current.setMinutes(current.getMinutes() + minutes);

    const minimum = new Date(Date.now() + 30 * 60 * 1000);

    if (current < minimum) {
      const earliest = getEarliestScheduledRide();
      setTravelDate(earliest.date);
      setPickupTime(earliest.time);
      return;
    }

    setTravelDate(localDateString(current));
    setPickupTime(
      `${String(current.getHours()).padStart(2, "0")}:${String(
        current.getMinutes()
      ).padStart(2, "0")}`
    );
  };

  const formattedTravelDate = new Date(`${travelDate}T12:00:00`).toLocaleDateString(
    "en-ZA",
    { weekday: "short", day: "2-digit", month: "short" }
  );

  const scheduledDateTime = new Date(
    `${travelDate}T${pickupTime || "00:00"}:00`
  );

  const scheduledTimeIsValid =
    rideType === "now" ||
    (!Number.isNaN(scheduledDateTime.getTime()) &&
      scheduledDateTime.getTime() >= Date.now() + 30 * 60 * 1000);

  const canBook =
    Boolean(selectedPickup) &&
    Boolean(selectedDestination) &&
    Boolean(fare) &&
    !calculatingFare &&
    !loading &&
    scheduledTimeIsValid;

const waitForDriverAcceptance = async (bookingId: number | null) => {
  setRequestState("searching");

  const startedAt = Date.now();

  while (Date.now() - startedAt < 60000) {
    try {
      const response = await fetch(
        `${API_URL}/passenger-bookings/${passenger.id}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const rides = await response.json();

        console.log("PASSENGER BOOKING POLL:", rides);

        if (Array.isArray(rides)) {
          const ride =
            (bookingId
              ? rides.find(
                  (item: any) =>
                    Number(item.id ?? item.booking_id) === Number(bookingId)
                )
              : null) ||
            rides
              .filter((item: any) => !item.scheduled_pickup_at)
              .sort(
                (a: any, b: any) =>
                  new Date(b.created_at || 0).getTime() -
                  new Date(a.created_at || 0).getTime()
              )[0];

          if (ride) {
            console.log("MATCHED BOOKING:", ride);

            const status = String(
              ride.trip_status ??
                ride.booking_status ??
                ride.status ??
                ""
            )
              .trim()
              .toLowerCase()
              .replace(/-/g, "_")
              .replace(/\s+/g, "_");

            const assignedDriverId =
              ride.assigned_driver_id ??
              ride.driver_id ??
              ride.accepted_driver_id ??
              ride.driver?.id ??
              null;

            console.log("BOOKING STATUS:", status);
            console.log("ASSIGNED DRIVER:", assignedDriverId);

            const acceptedStatuses = [
              "accepted",
              "assigned",
              "driver_assigned",
              "on_the_way",
              "arriving",
              "arrived",
              "in_progress",
              "started",
            ];

            const driverAccepted =
              Boolean(assignedDriverId) ||
              acceptedStatuses.includes(status);

            if (driverAccepted) {
              const acceptedId = Number(
                ride.id ?? ride.booking_id ?? bookingId
              );

              console.log(
                "DRIVER ACCEPTED - OPENING PASSENGER RIDE:",
                acceptedId
              );

              window.location.href = Number.isFinite(acceptedId)
                ? `/passenger-portal?booking=${acceptedId}`
                : "/passenger-portal";

              return;
            }
          }
        }
      }
    } catch (error) {
      console.error("BOOKING STATUS CHECK ERROR:", error);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 3000));
  }

console.log("NO DRIVER ACCEPTED YET - RETURNING TO PASSENGER PORTAL");

window.location.href = "/passenger-portal";
};

  const handleBooking = async () => {
    if (!passenger?.id) {
      showAppPopup(
        "Sign in required",
        "Please sign in again before booking your ride.",
        "error"
      );
      return;
    }

    if (!selectedPickup || !selectedDestination) {
      showAppPopup(
        "Choose your route",
        "Select both your pickup and destination.",
        "error"
      );
      return;
    }

    const numericFare = Number(fare);

    if (!Number.isFinite(numericFare) || numericFare <= 0) {
      showAppPopup(
        "Fare unavailable",
        "Your fare could not be calculated. Please try again.",
        "error"
      );
      return;
    }

    if (rideType === "scheduled" && !scheduledTimeIsValid) {
      showAppPopup(
        "Choose a later time",
        "Scheduled rides must be booked at least 30 minutes before pickup.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passenger_id: passenger.id,
          pickup_area: selectedPickup.area_name || "GPS Pickup",
          dropoff_area: selectedDestination.area_name || "GPS Destination",
          pickup_address: selectedPickup.address,
          dropoff_address: selectedDestination.address,
          pickup_lat: selectedPickup.lat,
          pickup_lng: selectedPickup.lng,
          dropoff_lat: selectedDestination.lat,
          dropoff_lng: selectedDestination.lng,
          travel_date: travelDate,
          fare_amount: numericFare,
          promo_code: promoCode.trim(),
          ride_type: rideType,
          pickup_time: rideType === "scheduled" ? pickupTime : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Unable to create booking"
        );
      }

      if (rideType === "scheduled") {
        window.location.href = "/passenger-portal?booking=scheduled";
        return;
      }

      const createdBookingId = Number(
        data?.booking?.id ?? data?.booking_id ?? data?.id
      );
      const safeBookingId = Number.isFinite(createdBookingId)
        ? createdBookingId
        : null;

      setActiveBookingId(safeBookingId);
      setLoading(false);
      await waitForDriverAcceptance(safeBookingId);
    } catch (error) {
      console.error("BOOKING ERROR:", error);
      setRequestState("idle");

      showAppPopup(
        "Booking failed",
        error instanceof Error
          ? error.message
          : "Unable to create booking. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-[100dvh] bg-[#f5f5f5] text-[#17191f]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md bg-white px-5 pb-8 pt-5">
        {/* HEADER */}
        <header className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6846]">
            RouteX
          </p>

          <h1 className="mt-1 text-[28px] font-black tracking-[-0.045em]">
            Where to?
          </h1>
        </header>

        {requestState === "idle" ? (
          <>
        {/* LOCATIONS */}
       <section
  className="
    overflow-hidden
    rounded-[22px]
    bg-white
    shadow-[7px_7px_18px_rgba(0,0,0,0.08),-7px_-7px_18px_rgba(255,255,255,1)]
  "
>
          <button
            type="button"
            onClick={() => setShowPickupSearch(true)}
           className="
  flex w-full items-center gap-4
  bg-white px-5 py-5 text-left
  transition-all duration-150
  hover:bg-black/[0.01]
  active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.06),inset_-3px_-3px_8px_rgba(255,255,255,1)]
"
          >
            <span className="h-3 w-3 shrink-0 rounded-full border-[3px] border-[#17191f]" />

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">
                Pickup
              </p>

              <p className="mt-1 truncate text-[14px] font-bold">
                {selectedPickup
                  ? selectedPickup.address
                  : "Choose pickup location"}
              </p>

              {selectedPickup?.area_name && (
                <p className="mt-0.5 truncate text-[9px] font-medium text-black/35">
                  {selectedPickup.area_name}
                </p>
              )}
            </div>

            <span className="text-xl text-black/30">›</span>
          </button>

         <div className="ml-16 h-px bg-black/[0.06]" />

          <button
            type="button"
            onClick={() => setShowDestinationSearch(true)}
           className="
  flex w-full items-center gap-4
  bg-white px-5 py-5 text-left
  transition-all duration-150
  hover:bg-black/[0.01]
  active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.06),inset_-3px_-3px_8px_rgba(255,255,255,1)]
"
          >
            <span className="h-3 w-3 shrink-0 rounded-[3px] bg-[#ff6846]" />

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">
                Destination
              </p>

              <p
                className={`mt-1 truncate text-[14px] font-bold ${
                  selectedDestination ? "text-[#17191f]" : "text-black/40"
                }`}
              >
                {selectedDestination
                  ? selectedDestination.address
                  : "Where are you going?"}
              </p>

              {selectedDestination?.area_name && (
                <p className="mt-0.5 truncate text-[9px] font-medium text-black/35">
                  {selectedDestination.area_name}
                </p>
              )}
            </div>

            <span className="text-xl text-black/30">›</span>
          </button>
        </section>

        {/* WHEN */}
        <section className="mt-5">
        <div
  className="
    grid grid-cols-2 gap-1
    rounded-[18px]
    bg-white p-1.5
    shadow-[inset_3px_3px_8px_rgba(0,0,0,0.07),inset_-3px_-3px_8px_rgba(255,255,255,1)]
  "
>
            <button
              type="button"
              onClick={() => chooseRideType("now")}
              className={`rounded-[13px] px-4 py-3 text-[12px] font-bold transition ${
                rideType === "now"
                  ? "bg-[#17191f] text-white"
                  : "text-black/45"
              }`}
            >
              Ride now
            </button>

            <button
              type="button"
              onClick={() => chooseRideType("scheduled")}
              className={`rounded-[13px] px-4 py-3 text-[12px] font-bold transition ${
                rideType === "scheduled"
                  ? "bg-[#17191f] text-white"
                  : "text-black/45"
              }`}
            >
              Schedule
            </button>
          </div>
        </section>

        {/* SCHEDULE */}
       {rideType === "scheduled" && (
  <section
  className="
    mt-4 rounded-[22px]
    bg-white p-4
    shadow-[7px_7px_18px_rgba(0,0,0,0.07),-7px_-7px_18px_rgba(255,255,255,1)]
  "
>

    {/* HEADER */}
    <div className="mb-4">
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-black/35">
        Trip details
      </p>

      <h2 className="mt-1 text-[16px] font-black tracking-[-0.02em] text-[#17191f]">
        Choose pickup time
      </h2>
    </div>

    {/* DATE */}
    <div>
      <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-black/35">
        Travel date
      </p>

      <div className="grid grid-cols-[42px_1fr_42px] gap-2">
        <button
          type="button"
          onClick={() => changeScheduledDate(-1)}
          className="
  flex h-12 items-center justify-center
  rounded-[14px] bg-white
  text-[20px] font-bold
  shadow-[4px_4px_10px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,1)]
  transition
  active:scale-95
  active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.08),inset_-3px_-3px_7px_rgba(255,255,255,1)]
"
          aria-label="Previous day"
        >
          ‹
        </button>

        <div
  className="
    flex h-12 min-w-0 flex-col items-center justify-center
    rounded-[14px] bg-white px-2
    shadow-[inset_3px_3px_7px_rgba(0,0,0,0.07),inset_-3px_-3px_7px_rgba(255,255,255,1)]
  "
>
          <p className="truncate text-[13px] font-bold text-[#17191f]">
            {formattedTravelDate}
          </p>

          <p className="text-[8px] font-medium text-black/35">
            {travelDate}
          </p>
        </div>

        <button
          type="button"
          onClick={() => changeScheduledDate(1)}
          className="flex h-12 items-center justify-center rounded-[13px] bg-[#f3f3f3] text-[20px] font-bold"
          aria-label="Next day"
        >
          ›
        </button>
      </div>
    </div>

    {/* TIME */}
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-black/35">
          Pickup time
        </p>

        <p className="text-[8px] font-medium text-black/30">
          15 min intervals
        </p>
      </div>

      <div className="grid grid-cols-[42px_1fr_42px] gap-2">
        <button
          type="button"
          onClick={() => changeScheduledTime(-15)}
         className="
  flex h-12 items-center justify-center
  rounded-[14px]
  bg-white
  text-[20px] font-bold text-[#17191f]
  shadow-[4px_4px_10px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,1)]
  transition
  active:scale-95
  active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.08),inset_-3px_-3px_7px_rgba(255,255,255,1)]
"
          aria-label="15 minutes earlier"
        >
          −
        </button>

        <div className="flex h-12 items-center justify-center rounded-[13px] bg-[#17191f] px-3 text-[20px] font-black text-white">
          {pickupTime}
        </div>

        <button
          type="button"
          onClick={() => changeScheduledTime(15)}
          className="
  flex h-12 items-center justify-center
  rounded-[14px]
  bg-white
  text-[20px] font-bold text-[#17191f]
  shadow-[4px_4px_10px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,1)]
  transition
  active:scale-95
  active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.08),inset_-3px_-3px_7px_rgba(255,255,255,1)]
"
          aria-label="15 minutes later"
        >
          +
        </button>
      </div>
    </div>

    {/* 30 MINUTE NOTICE */}
  <div
  className="
    mt-4 rounded-[14px]
    bg-white px-3 py-2.5
    border-l-[3px] border-[#ff6846]
    shadow-[inset_2px_2px_6px_rgba(0,0,0,0.045),inset_-2px_-2px_6px_rgba(255,255,255,1)]
  "
>
      <p className="text-[10px] font-bold text-[#17191f]">
        Schedule at least 30 minutes ahead
      </p>

      <p className="mt-0.5 text-[9px] leading-4 text-black/45">
        Scheduled rides must be booked at least 30 minutes before pickup.
      </p>
    </div>

    {!scheduledTimeIsValid && (
      <p className="mt-2 text-[9px] font-semibold text-[#ff6846]">
        Choose a pickup time at least 30 minutes from now.
      </p>
    )}
  </section>
)}

        {/* FARE */}
        <section className="mt-7 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
            Estimated fare
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.05em]">
            {calculatingFare ? "..." : fare ? `R${fare}` : "—"}
          </p>

          <p className="mt-1 text-[10px] font-medium text-black/35">
            {calculatingFare
              ? "Calculating your route..."
              : fare && distanceKm !== null
              ? `${distanceKm.toFixed(1)} km road distance`
              : "Select your pickup and destination"}
          </p>

          {fare && outOfTownFee > 0 && (
            <p className="mt-1 text-[9px] font-semibold text-black/35">
              Includes R{outOfTownFee} out-of-town fee
            </p>
          )}
        </section>

        {/* PROMO */}
        <section className="mt-5">
          <input
            value={promoCode}
            onChange={(event) =>
              setPromoCode(event.target.value.toUpperCase())
            }
            placeholder="Promo code (optional)"
           className="
  w-full
  rounded-[15px]
  bg-white
  px-4 py-3.5
  text-[11px] font-bold uppercase
  outline-none
  border border-black/[0.05]
  shadow-[inset_2px_2px_6px_rgba(0,0,0,0.05),inset_-2px_-2px_6px_rgba(255,255,255,1)]
  placeholder:normal-case
  placeholder:text-black/30
"
          />
        </section>

        {/* REQUEST */}
        <button
          type="button"
          onClick={handleBooking}
          disabled={!canBook}
          className="mt-6 flex w-full items-center justify-between rounded-[18px] bg-[#17191f] px-5 py-4 text-white transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <div className="text-left">
            <p className="text-[13px] font-black">
              {loading
                ? rideType === "scheduled"
                  ? "Scheduling..."
                  : "Requesting..."
                : rideType === "scheduled"
                ? "Schedule RouteX"
                : "Request RouteX"}
            </p>

            <p className="mt-0.5 text-[8px] font-semibold text-white/45">
              {rideType === "scheduled"
                ? `${formattedTravelDate} at ${pickupTime}`
                : fare
                ? `Estimated fare R${fare}`
                : "Choose your route first"}
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6846] text-xl">
            →
          </span>
        </button>

        <p className="mt-5 text-center text-[9px] font-medium text-black/30">
          RouteX · Getting Upington Moving
        </p>
          </>
        ) : (
          <section className="flex min-h-[62dvh] flex-col items-center justify-center text-center">
            {requestState === "searching" ? (
              <>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute h-20 w-20 animate-ping rounded-full bg-[#ff6846]/15" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6846]">
                    <span className="h-4 w-4 rounded-full border-[3px] border-white" />
                  </span>
                </div>

                <h2 className="mt-7 text-[24px] font-black tracking-[-0.04em]">
                  Finding your driver...
                </h2>
                <p className="mt-2 max-w-[290px] text-[11px] leading-5 text-black/40">
                  We're sending your request to nearby RouteX drivers.
                </p>

                <div className="mt-7 w-full rounded-[18px] border border-black/[0.08] px-4 py-4 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/35">
                    Your trip
                  </p>
                  <p className="mt-2 truncate text-[13px] font-bold">
                    {selectedPickup?.address}
                  </p>
                  <p className="my-1 text-[10px] text-black/25">↓</p>
                  <p className="truncate text-[13px] font-bold">
                    {selectedDestination?.address}
                  </p>
                  <p className="mt-3 text-[11px] font-black text-[#ff6846]">
                    R{fare}
                  </p>
                </div>
{availableDrivers.length > 0 && (
  <div className="mt-4 w-full">
    <p className="mb-2 text-left text-[8px] font-black uppercase tracking-[0.14em] text-black/30">
      Available near you
    </p>

    {availableDrivers.slice(0, 3).map((driver) => (
      <div
        key={driver.id}
        className="mb-2 flex w-full items-center gap-3 rounded-[17px] bg-white px-3 py-3 text-left shadow-[4px_4px_12px_rgba(0,0,0,0.07),-4px_-4px_12px_rgba(255,255,255,1)]"
      >
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black/[0.04]">
          {driver.profile_image ? (
            <img
              src={driver.profile_image}
              alt={driver.first_name || "RouteX driver"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[14px] font-black text-black/30">
              {driver.first_name?.charAt(0)?.toUpperCase() || "D"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

            <p className="truncate text-[12px] font-black">
              {driver.first_name}
            </p>
          </div>

          <p className="mt-0.5 truncate text-[9px] font-semibold text-black/45">
            {[driver.vehicle_color, driver.vehicle_type]
              .filter(Boolean)
              .join(" ")}
          </p>

          {driver.distance_km && (
            <p className="mt-0.5 text-[8px] font-medium text-black/30">
              {driver.distance_km} km away
            </p>
          )}
        </div>

        <span className="rounded-full bg-[#fff0eb] px-2.5 py-1.5 text-[8px] font-black text-[#ff6846]">
          Available
        </span>
      </div>
    ))}
  </div>
)}
                <div className="mt-5 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-[3px_3px_8px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,1)]">
  <span
    className={`h-2 w-2 rounded-full ${
      onlineDrivers > 0 ? "bg-green-500" : "bg-black/20"
    }`}
  />

  <p className="text-[10px] font-bold text-black/55">
    {onlineDrivers === 0
      ? "No drivers currently online"
      : `${onlineDrivers} driver${onlineDrivers === 1 ? "" : "s"} online`}
  </p>
</div>

<p className="mt-3 text-[9px] font-semibold text-black/30">
  This can take up to 60 seconds.
</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3f3] text-[24px] font-black text-black/35">
                  ×
                </div>
                <h2 className="mt-6 text-[23px] font-black tracking-[-0.04em]">
                  No driver accepted your ride
                </h2>
                <p className="mt-2 max-w-[300px] text-[11px] leading-5 text-black/40">
                  No RouteX driver accepted within 60 seconds. You can try again or schedule the ride for later.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setRequestState("idle");
                    setActiveBookingId(null);
                  }}
                  className="mt-7 w-full rounded-[17px] bg-[#17191f] px-5 py-4 text-[13px] font-black text-white"
                >
                  Try again
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestState("idle");
                    setActiveBookingId(null);
                    chooseRideType("scheduled");
                  }}
                  className="mt-3 w-full rounded-[17px] border border-black/10 px-5 py-4 text-[13px] font-black"
                >
                  Schedule instead
                </button>
              </>
            )}
          </section>
        )}
      </div>

      {/* PICKUP SEARCH */}
      {showPickupSearch && (
        <div className="fixed inset-0 z-[100] bg-white">
          <div className="mx-auto h-[100dvh] w-full max-w-md overflow-y-auto bg-white px-5 pb-6 pt-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowPickupSearch(false);
                  setPickupQuery("");
                  setPickupResults([]);
                  setPickupSearchFinished(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]"
              >
                <BackIcon />
              </button>

              <p className="ml-4 text-[14px] font-black">Pickup</p>
            </div>

            <div className="mt-6">
              <h2 className="max-w-[320px] text-[24px] font-black leading-[1.05] tracking-[-0.04em]">
                Where should we pick you up?
              </h2>

              <p className="mt-2 text-[11px] font-medium text-black/40">
                Search for your street, address or place.
              </p>
            </div>

            <SearchBox
              value={pickupQuery}
              placeholder="Enter pickup address"
              onChange={(value) => {
                setPickupQuery(value);
                searchPickupAddress(value);
              }}
              onClear={() => {
                setPickupQuery("");
                setPickupResults([]);
                setPickupSearchFinished(false);
              }}
            />

            {rideType === "now" && (
              <button
                type="button"
                onClick={useCurrentPickupLocation}
                disabled={gettingLocation}
className="
  mt-4 flex w-full items-center gap-4
  rounded-[18px]
  border border-black/[0.04]
  bg-white
  px-4 py-4
  text-left
  shadow-[5px_5px_14px_rgba(0,0,0,0.07),-5px_-5px_14px_rgba(255,255,255,1)]
  transition
  active:scale-[0.985]
  active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)]
  disabled:opacity-50

"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0eb] text-[#ff6846]">
                  <GpsIcon />
                </span>

                <span>
                  <span className="block text-[12px] font-black">
                    {gettingLocation
                      ? "Finding your location..."
                      : "Use my current location"}
                  </span>

                  <span className="mt-0.5 block text-[9px] font-medium text-black/35">
                    Use your phone's GPS pickup point
                  </span>
                </span>
              </button>
            )}

            <AddressResults
              query={pickupQuery}
              searching={pickupSearching}
              finished={pickupSearchFinished}
              results={pickupResults}
              type="pickup"
              onSelect={(result) => {
                setSelectedPickup(result);
                setPickupQuery(result.address);
                setPickupResults([]);
                setPickupSearchFinished(false);
                setShowPickupSearch(false);
              }}
              onMap={() => {
                setShowPickupSearch(false);
                setShowPickupMap(true);
              }}
            />
          </div>
        </div>
      )}

      {/* PICKUP MAP */}
      {showPickupMap && (
        <LocationPicker
          title="Choose pickup location"
          initialLat={selectedPickup?.lat ?? UPINGTON_LAT}
          initialLng={selectedPickup?.lng ?? UPINGTON_LNG}
          onClose={() => {
            setShowPickupMap(false);
            setShowPickupSearch(true);
          }}
          onConfirm={async (location) => {
            try {
              await reverseMapLocation(location, "pickup");
            } catch (error) {
              console.error("MAP PICKUP ERROR:", error);
              showAppPopup(
                "Address unavailable",
                "We couldn't determine the address at this point. Move the pin and try again.",
                "error"
              );
            }
          }}
        />
      )}

      {/* DESTINATION SEARCH */}
      {showDestinationSearch && (
        <div className="fixed inset-0 z-[100] bg-white">
          <div className="mx-auto h-[100dvh] w-full max-w-md overflow-y-auto bg-white px-5 pb-6 pt-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowDestinationSearch(false);
                  setDestinationQuery("");
                  setDestinationResults([]);
                  setDestinationSearchFinished(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]"
              >
                <BackIcon />
              </button>

              <p className="ml-4 text-[14px] font-black">Destination</p>
            </div>

            <div className="mt-6">
              <h2 className="max-w-[320px] text-[24px] font-black leading-[1.05] tracking-[-0.04em]">
                Where are you going?
              </h2>

              <p className="mt-2 text-[11px] font-medium text-black/40">
                Search for your destination.
              </p>
            </div>

            <SearchBox
              value={destinationQuery}
              placeholder="Enter destination"
              onChange={(value) => {
                setDestinationQuery(value);
                searchDestinationAddress(value);
              }}
              onClear={() => {
                setDestinationQuery("");
                setDestinationResults([]);
                setDestinationSearchFinished(false);
              }}
            />

            <AddressResults
              query={destinationQuery}
              searching={destinationSearching}
              finished={destinationSearchFinished}
              results={destinationResults}
              type="destination"
              onSelect={(result) => {
                setSelectedDestination(result);
                setDestinationQuery(result.address);
                setDestinationResults([]);
                setDestinationSearchFinished(false);
                setShowDestinationSearch(false);
              }}
              onMap={() => {
                setShowDestinationSearch(false);
                setShowDestinationMap(true);
              }}
            />
          </div>
        </div>
      )}

      {/* DESTINATION MAP */}
      {showDestinationMap && (
        <LocationPicker
          title="Choose destination"
          initialLat={selectedDestination?.lat ?? UPINGTON_LAT}
          initialLng={selectedDestination?.lng ?? UPINGTON_LNG}
          onClose={() => {
            setShowDestinationMap(false);
            setShowDestinationSearch(true);
          }}
          onConfirm={async (location) => {
            try {
              await reverseMapLocation(location, "destination");
            } catch (error) {
              console.error("MAP DESTINATION ERROR:", error);
              showAppPopup(
                "Address unavailable",
                "We couldn't determine the address at this point. Move the pin and try again.",
                "error"
              );
            }
          }}
        />
      )}

      {/* APP POPUP */}
      {appPopup && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/35 p-5 sm:items-center">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl">
            <p className="text-[15px] font-black">{appPopup.title}</p>

            <p className="mt-2 text-[11px] leading-5 text-black/50">
              {appPopup.message}
            </p>

            <button
              type="button"
              onClick={() => setAppPopup(null)}
              className="mt-5 w-full rounded-[15px] bg-[#17191f] px-4 py-3.5 text-[11px] font-black text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function SearchBox({
  value,
  placeholder,
  onChange,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
  <div
  className="
    mt-5 flex items-center
    rounded-[18px]
    bg-white
    px-4
    border border-black/[0.04]
    shadow-[5px_5px_14px_rgba(0,0,0,0.08),-5px_-5px_14px_rgba(255,255,255,1)]
  "
>
      <SearchIcon />

      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          h-[52px] min-w-0 flex-1
          bg-transparent px-3
          text-[14px] font-semibold
          outline-none
          placeholder:text-black/30
        "
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="
            flex h-8 w-8 items-center justify-center
            rounded-full
            text-[20px] text-black/30
            transition
            active:scale-90
          "
        >
          ×
        </button>
      )}
    </div>
  );
}

function AddressResults({
  query,
  searching,
  finished,
  results,
  type,
  onSelect,
  onMap,
}: {
  query: string;
  searching: boolean;
  finished: boolean;
  results: AddressResult[];
  type: "pickup" | "destination";
  onSelect: (result: AddressResult) => void;
  onMap: () => void;
}) {
  if (!query.trim()) {
    return (
      <div className="mt-8 text-center">
        <p className="text-[10px] font-semibold text-black/30">
          Start typing to search for your {type}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/30">
        Search results
      </p>

      {searching && (
        <div className="py-7 text-center">
          <p className="text-[11px] font-semibold text-black/35">
            Searching...
          </p>
        </div>
      )}

      {!searching && results.length > 0 && (
<div className="mt-1">
          {results.map((result, index) => (
            <button
              key={`${result.lat}-${result.lng}-${index}`}
              type="button"
              onClick={() => onSelect(result)}
            className={`
  flex w-full items-center gap-3
  px-1 py-3.5
  text-left
  transition
  active:opacity-60
  ${
    index !== results.length - 1
      ? "border-b border-black/[0.06]"
      : ""
  }
`}
            >
             <span
  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
    type === "destination"
      ? "bg-[#fff0eb]"
      : "bg-white border border-black/[0.06]"
  }`}
>
                <span
                  className={
                    type === "destination"
                      ? "h-3 w-3 rounded-[3px] bg-[#ff6846]"
                      : "h-3 w-3 rounded-full border-[3px] border-[#17191f]"
                  }
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-black">
                  {result.address}
                </span>

                <span className="mt-0.5 block truncate text-[9px] font-medium text-black/40">
                  {result.area_name || result.full_address}
                </span>
              </span>

              <span className="text-[20px] text-black/20">›</span>
            </button>
          ))}
        </div>
      )}

      {!searching && finished && results.length === 0 && (
        <div className="mt-3 rounded-[16px] bg-[#f7f7f7] p-4">
          <p className="text-[11px] font-black">
            Can't find this address?
          </p>

          <p className="mt-1 text-[9px] font-medium leading-4 text-black/40">
            Choose the exact {type} point on the map.
          </p>

          <button
            type="button"
            onClick={onMap}
            className="mt-3 w-full rounded-[14px] bg-[#17191f] px-4 py-3 text-[11px] font-black text-white active:scale-[0.985]"
          >
            Choose {type} on map
          </button>
        </div>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-black/35"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  );
}
