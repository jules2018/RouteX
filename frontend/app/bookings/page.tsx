"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type AddressSuggestion = {
  address: string;
  full_address?: string;
  area_name?: string;
  place_type?: string;
  lat: number;
  lng: number;
};

export default function BookRidePage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fare, setFare] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [outOfTownFee, setOutOfTownFee] = useState(0);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);

  const [selectedPickup, setSelectedPickup] =
  useState<AddressSuggestion | null>(null);

const [selectedDestination, setSelectedDestination] =
  useState<AddressSuggestion | null>(null);
  const [locationConfirmed, setLocationConfirmed] =
    useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [rideType, setRideType] = useState<"now" | "scheduled">("now");
  const [pickupTime, setPickupTime] = useState("");
  const [appPopup, setAppPopup] = useState<{
    title: string;
    message: string;
    tone?: "info" | "success" | "error";
  } | null>(null);

  const showAppPopup = (
    title: string,
    message: string,
    tone: "info" | "success" | "error" = "info"
  ) => setAppPopup({ title, message, tone });
  const [travelDate, setTravelDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const storedPassenger = localStorage.getItem("passenger");
    if (storedPassenger) {
      try { setPassenger(JSON.parse(storedPassenger)); } catch { setPassenger(null); }
    }
  }, []);

  useEffect(() => {
  const query = pickup.trim();

  if (query.length < 2 || selectedPickup?.address === pickup) {
    setPickupSuggestions([]);
    return;
  }

  const timer = window.setTimeout(async () => {
    try {
      const response = await fetch(
        `${API_URL}/addresses/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        setPickupSuggestions([]);
        return;
      }

      const data = await response.json();
      setPickupSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("PICKUP SEARCH ERROR:", error);
      setPickupSuggestions([]);
    }
  }, 300);

  return () => window.clearTimeout(timer);
}, [pickup, selectedPickup]);


useEffect(() => {
  const query = destination.trim();

  if (
    query.length < 2 ||
    selectedDestination?.address === destination
  ) {
    setDestinationSuggestions([]);
    return;
  }

  const timer = window.setTimeout(async () => {
    try {
      const response = await fetch(
        `${API_URL}/addresses/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        setDestinationSuggestions([]);
        return;
      }

      const data = await response.json();
      setDestinationSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("DESTINATION SEARCH ERROR:", error);
      setDestinationSuggestions([]);
    }
  }, 300);

  return () => window.clearTimeout(timer);
}, [destination, selectedDestination]);

  useEffect(() => {
    if (!selectedPickup || !selectedDestination) {
      setFare("");
      setDistanceKm(null);
      setOutOfTownFee(0);
      return;
    }

    // Ride Now must use the passenger's confirmed live GPS position.
    if (rideType === "now" && !gpsLocation) {
      setFare("");
      setDistanceKm(null);
      setOutOfTownFee(0);
      return;
    }

    const calculateFare = async () => {
      try {
        const pickupLat = rideType === "now" ? gpsLocation!.lat : selectedPickup.lat;
        const pickupLng = rideType === "now" ? gpsLocation!.lng : selectedPickup.lng;

        const params = new URLSearchParams({
          pickup_area: selectedPickup.area_name || "GPS Pickup",
          dropoff_area: selectedDestination.area_name || "GPS Destination",
          pickup_lat: String(pickupLat),
          pickup_lng: String(pickupLng),
          dropoff_lat: String(selectedDestination.lat),
          dropoff_lng: String(selectedDestination.lng),
        });

        const response = await fetch(`${API_URL}/calculate-fare?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          setFare("");
          setDistanceKm(null);
          setOutOfTownFee(0);
          return;
        }

        const numericFare = Number(data.fare);
        if (!Number.isFinite(numericFare) || numericFare <= 0) {
          setFare("");
          setDistanceKm(null);
          setOutOfTownFee(0);
          return;
        }

        setFare(String(data.fare));
        setDistanceKm(data.distance_km ?? null);
        setOutOfTownFee(Number(data.out_of_town_fee || 0));
      } catch (error) {
        console.error("FARE CALCULATION ERROR:", error);
        setFare("");
        setDistanceKm(null);
        setOutOfTownFee(0);
      }
    };

    calculateFare();
  }, [selectedPickup, selectedDestination, rideType, gpsLocation]);

  const confirmCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAppPopup("RouteX", "Location services are not supported on this device.", "error");
      return;
    }

    setGettingLocation(true);
    setLocationConfirmed(false);
    setGpsLocation(null);
    setFare("");
    setDistanceKm(null);
    setOutOfTownFee(0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationConfirmed(true);
        setGettingLocation(false);
      },
      (error) => {
        console.error("GPS ERROR:", error);
        setGpsLocation(null);
        setLocationConfirmed(false);
        setGettingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          showAppPopup("RouteX", "Location permission was denied. Please allow location access and try again.", "error");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showAppPopup("RouteX", "Your current location could not be determined. Please try again.", "error");
        } else if (error.code === error.TIMEOUT) {
          showAppPopup("RouteX", "Getting your location took too long. Please try again.", "error");
        } else {
          showAppPopup("RouteX", "Could not get your current location.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleBooking = async () => {
    if (loading) return;

    if (!passenger?.id) {
      showAppPopup("RouteX", "Please sign in again before booking your ride.", "error");
      return;
    }

    if (!selectedPickup || !selectedDestination) {
      showAppPopup("RouteX", "Please choose your pickup and destination from the suggestions.", "error");
      return;
    }

    const numericFare = Number(fare);
    if (!fare || !Number.isFinite(numericFare) || numericFare <= 0) {
      showAppPopup("RouteX", "Your fare is still being calculated. Please wait a moment and try again.", "error");
      return;
    }

    if (rideType === "now" && (!locationConfirmed || !gpsLocation)) {
      showAppPopup("RouteX", "Please confirm your current GPS location before requesting a ride.", "error");
      return;
    }

    if (rideType === "scheduled") {
      const scheduled = new Date(`${travelDate}T${pickupTime}:00`);
      const minimumScheduledTime = Date.now() + 30 * 60 * 1000;
      if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() < minimumScheduledTime) {
        showAppPopup("RouteX", "Scheduled rides must be booked at least 30 minutes before pickup.", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passenger_id: passenger.id,
          pickup_area: selectedPickup.area_name || "GPS Pickup",
          dropoff_area: selectedDestination.area_name || "GPS Destination",
          pickup_address: selectedPickup.address,
          dropoff_address: selectedDestination.address,
          pickup_lat: rideType === "now" ? gpsLocation!.lat : selectedPickup.lat,
          pickup_lng: rideType === "now" ? gpsLocation!.lng : selectedPickup.lng,
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
        showAppPopup("RouteX", data.message || data.error || "Booking failed.", "error");
        return;
      }

      window.location.href =
  rideType === "scheduled"
    ? "/passenger-portal-new?booking=scheduled"
    : "/passenger-portal-new?booking=requested";

    } catch (error) {
      console.error("BOOKING ERROR:", error);
      showAppPopup("RouteX", "Unable to create booking. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const current = new Date(`${travelDate}T12:00:00`);
    current.setDate(current.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (current < today) return;
    setTravelDate(current.toISOString().split("T")[0]);
  };

  const changeTime = (minutes: number) => {
    const [hours, mins] = pickupTime.split(":").map(Number);
    let total = hours * 60 + mins + minutes;
    total = Math.max(0, Math.min(23 * 60 + 45, total));
    const nextHours = Math.floor(total / 60);
    const nextMinutes = total % 60;
    setPickupTime(`${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`);
  };

  const formattedTravelDate = new Date(`${travelDate}T12:00:00`).toLocaleDateString(
    "en-ZA",
    { weekday: "short", day: "numeric", month: "short" }
  );

  const selectedScheduledDateTime = new Date(`${travelDate}T${pickupTime}:00`);
  const scheduledTimeIsValid =
    !Number.isNaN(selectedScheduledDateTime.getTime()) &&
    selectedScheduledDateTime.getTime() >= Date.now() + 30 * 60 * 1000;

  return (
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      <div className="mx-auto w-full max-w-md px-5 pb-10">

        {/* HEADER */}
        <header className="flex items-center justify-between pt-6">
          <a
            href="/passenger-portal-new"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-[14px]
              bg-[#e7e9ee]
              text-[#17191f]
              shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]
              transition
              active:scale-95
            "
          >
            <BackIcon />
          </a>

          <h1 className="text-[25px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

          <div className="h-10 w-10" />
        </header>

        {/* TITLE */}
        <section className="pt-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ff6846]">
            Book a ride
          </p>

          <h2 className="mt-2 text-[30px] font-black leading-[1.05] tracking-[-0.045em]">
            Where are you
            <br />
            going?
          </h2>

          <p className="mt-3 max-w-[280px] text-[13px] font-medium leading-5 text-[#7c7f86]">
            Choose your pickup point and destination.
          </p>
        </section>

        {/* RIDE TYPE */}
        <section className="mt-7">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRideType("now")}
              className={`rounded-[18px] px-4 py-4 text-left transition active:scale-[0.985] ${
                rideType === "now"
                  ? "bg-[#17191f] text-white shadow-[5px_5px_11px_#c3c5ca,-5px_-5px_11px_#ffffff]"
                  : "bg-[#e7e9ee] text-[#17191f] shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]"
              }`}
            >
              <p className="text-[12px] font-black">Ride now</p>
              <p className={`mt-1 text-[8px] font-semibold ${rideType === "now" ? "text-white/50" : "text-[#96999f]"}`}>
                Request a driver now
              </p>
            </button>

            <button
              type="button"
             onClick={() => {
  setRideType("scheduled");
  setLocationConfirmed(false);
  setGpsLocation(null);

  // Earliest scheduled ride = at least 30 minutes from now.
  // Round UP to the next 15-minute slot.
  const now = new Date();
  const earliest = new Date(now.getTime() + 30 * 60 * 1000);

  const minutes = earliest.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;

    earliest.setMinutes(roundedMinutes, 0, 0);

        // Handle rounding into the next hour/day.
        if (roundedMinutes >= 60) {
          earliest.setHours(earliest.getHours() + 1);
          earliest.setMinutes(0, 0, 0);
        }

        const year = earliest.getFullYear();
        const month = String(earliest.getMonth() + 1).padStart(2, "0");
        const day = String(earliest.getDate()).padStart(2, "0");
        const hours = String(earliest.getHours()).padStart(2, "0");
        const mins = String(earliest.getMinutes()).padStart(2, "0");

        setTravelDate(`${year}-${month}-${day}`);
        setPickupTime(`${hours}:${mins}`);
      }}
              className={`rounded-[18px] px-4 py-4 text-left transition active:scale-[0.985] ${
                rideType === "scheduled"
                  ? "bg-[#ff6846] text-white shadow-[5px_5px_11px_#c3c5ca,-5px_-5px_11px_#ffffff]"
                  : "bg-[#e7e9ee] text-[#17191f] shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff]"
              }`}
            >
              <p className="text-[12px] font-black">Schedule ride</p>
              <p className={`mt-1 text-[8px] font-semibold ${rideType === "scheduled" ? "text-white/65" : "text-[#96999f]"}`}>
                Choose a future time
              </p>
            </button>
          </div>
        </section>

        {/* ROUTE CARD */}
        <section
          className="
            mt-7
            rounded-[26px]
            bg-[#e7e9ee]
            p-4
            shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]
          "
        >
          <div className="flex gap-3">

            {/* ROUTE LINE */}
            <div className="flex w-5 shrink-0 flex-col items-center pt-[48px]">
              <span
                className="
                  h-[12px] w-[12px]
                  rounded-full
                  border-[3px]
                  border-[#17191f]
                  bg-[#e7e9ee]
                "
              />

              <span className="my-1.5 min-h-[57px] w-px flex-1 border-l border-dashed border-[#aeb1b7]" />

              <span className="h-[11px] w-[11px] rounded-[3px] bg-[#ff6846]" />
            </div>

            <div className="min-w-0 flex-1 space-y-5">

              {/* PICKUP */}
              <div>
                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
                  Pickup
                </label>

                <div
                  className="
                    rounded-[16px]
                    bg-[#e7e9ee]
                    shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]
                  "
                >
                  <input
                    type="text"
                    value={pickup}
                   onChange={(e) => {
                    setPickup(e.target.value);
                    setSelectedPickup(null);
                    setLocationConfirmed(false);
                  }}
                    placeholder="Enter pickup location"
                    className="
                      w-full
                      bg-transparent
                      px-4 py-[14px]
                      text-[13px]
                      font-bold
                      text-[#17191f]
                      outline-none
                      placeholder:font-medium
                      placeholder:text-[#a0a3a9]
                    "
                  />
                </div>
                  {pickupSuggestions.length > 0 && (
  <div className="relative z-30 mt-2 overflow-hidden rounded-[16px] bg-white shadow-[5px_5px_12px_rgba(80,82,88,0.18)]">
    {pickupSuggestions.map((item, index) => (
      <button
        key={`${item.address}-${index}`}
        type="button"
        onClick={() => {
          setPickup(item.address);
          setSelectedPickup(item);
          setPickupSuggestions([]);
          setLocationConfirmed(false);
          setGpsLocation(null);
          setFare("");
          setDistanceKm(null);
          setOutOfTownFee(0);
        }}
        className="block w-full border-b border-[#eeeeee] px-4 py-3 text-left last:border-b-0"
      >
        <p className="text-[12px] font-black text-[#17191f]">
          {item.address}
        </p>

        {item.full_address && item.full_address !== item.address && (
          <p className="mt-1 text-[9px] font-medium text-[#8d9097]">
            {item.full_address}
          </p>
        )}
      </button>
    ))}
  </div>
)}
                {/* GPS - RIDE NOW ONLY */}
                {rideType === "now" && (
                <button
                  type="button"
                  onClick={confirmCurrentLocation}
                  disabled={gettingLocation}
                  className={`
                    mt-3
                    flex w-full
                    items-center justify-between
                    rounded-[14px]
                    px-3.5 py-3
                    text-left
                    transition
                    active:scale-[0.985]
                    disabled:cursor-wait
                    disabled:opacity-70
                    ${
                      locationConfirmed
                        ? "bg-[#17191f] text-white shadow-[3px_3px_7px_#c3c5ca,-3px_-3px_7px_#ffffff]"
                        : "bg-[#e7e9ee] text-[#17191f] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`
                        flex h-8 w-8
                        items-center justify-center
                        rounded-[10px]
                        ${
                          locationConfirmed
                            ? "bg-[#ff6846]"
                            : "bg-[#e7e9ee] text-[#ff6846] shadow-[inset_2px_2px_5px_#c4c6ca,inset_-2px_-2px_5px_#ffffff]"
                        }
                      `}
                    >
                      <GpsIcon />
                    </span>

                    <div>
                      <p className="text-[10px] font-extrabold">
                        {locationConfirmed
                          ? "Pickup confirmed"
                          : "Confirm my location"}
                      </p>

                      <p
                        className={`mt-0.5 text-[8px] font-semibold ${
                          locationConfirmed
                            ? "text-white/55"
                            : "text-[#96999f]"
                        }`}
                      >
                        Helps your driver find you
                      </p>
                    </div>
                  </div>

                  {locationConfirmed && <CheckIcon />}
                </button>
                )}

                {rideType === "scheduled" && (
                  <p className="mt-3 rounded-[14px] bg-[#e7e9ee] px-3.5 py-3 text-[9px] font-semibold leading-4 text-[#7f8289] shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff]">
                    For a scheduled ride, RouteX will use the pickup address you choose. Your current GPS location is not required.
                  </p>
                )}
              </div>

              {/* DESTINATION */}
              <div>
                <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
                  Destination
                </label>

                <div
                  className="
                    rounded-[16px]
                    bg-[#e7e9ee]
                    shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]
                  "
                >
                  <input
                    type="text"
                    value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setSelectedDestination(null);
                  }}
                    placeholder="Where are you going?"
                    className="
                      w-full
                      bg-transparent
                      px-4 py-[14px]
                      text-[13px]
                      font-bold
                      text-[#17191f]
                      outline-none
                      placeholder:font-medium
                      placeholder:text-[#a0a3a9]
                    "
                  />
                </div>

                {destinationSuggestions.length > 0 && (
  <div className="relative z-30 mt-2 overflow-hidden rounded-[16px] bg-white shadow-[5px_5px_12px_rgba(80,82,88,0.18)]">
    {destinationSuggestions.map((item, index) => (
      <button
        key={`${item.address}-${index}`}
        type="button"
        onClick={() => {
          setDestination(item.address);
          setSelectedDestination(item);
          setDestinationSuggestions([]);
        }}
        className="block w-full border-b border-[#eeeeee] px-4 py-3 text-left last:border-b-0"
      >
        <p className="text-[12px] font-black text-[#17191f]">
          {item.address}
        </p>

        {item.full_address && item.full_address !== item.address && (
          <p className="mt-1 text-[9px] font-medium text-[#8d9097]">
            {item.full_address}
          </p>
        )}
      </button>
    ))}
  </div>
)}
              </div>
            </div>
          </div>
        </section>

        {/* TRIP DETAILS */}
        <section className="mt-7">
          <div className="mb-3">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8f9298]">
              Trip details
            </p>

            <h3 className="mt-1 text-[18px] font-black tracking-[-0.035em]">
              {rideType === "scheduled" ? "Choose pickup time" : "When are you travelling?"}
            </h3>
          </div>

          <div
            className="
              rounded-[22px]
              bg-[#e7e9ee]
              p-4
              shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff]
            "
          >
            {/* DATE / TIME */}
            {rideType === "scheduled" ? (
              <>
                <div className="space-y-4">
                  {/* ROUTEX DATE SELECTOR */}
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                      Travel date
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[18px] font-black shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] active:scale-95"
                        aria-label="Previous day"
                      >
                        ‹
                      </button>
                      <div className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[15px] bg-[#e7e9ee] px-3 shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                        <div className="text-center">
                          <p className="text-[13px] font-black text-[#17191f]">{formattedTravelDate}</p>
                          <p className="mt-0.5 text-[8px] font-bold text-[#9a9da3]">{travelDate}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeDate(1)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[18px] font-black shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] active:scale-95"
                        aria-label="Next day"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* ROUTEX 15-MINUTE TIME SELECTOR */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                        Pickup time
                      </p>
                      <span className="text-[8px] font-bold text-[#aaadb3]">15 min intervals</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => changeTime(-15)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[20px] font-black shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] active:scale-95"
                        aria-label="15 minutes earlier"
                      >
                        −
                      </button>
                      <div className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-[16px] bg-[#17191f] shadow-[4px_4px_9px_#c3c5ca,-4px_-4px_9px_#ffffff]">
                        <ClockIcon />
                        <span className="ml-2 text-[20px] font-black tracking-[-0.03em] text-white">{pickupTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeTime(15)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[20px] font-black shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff] active:scale-95"
                        aria-label="15 minutes later"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[14px] bg-[#e7e9ee] px-3.5 py-3 shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff]">
                  <p className="text-[9px] font-black text-[#17191f]">Schedule at least 30 minutes ahead</p>
                  <p className="mt-1 text-[8px] font-semibold leading-4 text-[#8d9097]">
                    Scheduled rides must be booked at least 30 minutes before pickup. Driver matching starts 30 minutes before pickup.
                  </p>
                  {!scheduledTimeIsValid && (
                    <p className="mt-1.5 text-[8px] font-black text-[#ff6846]">
                      This pickup time is too soon. Choose a later time.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[#ff6846] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
                  <ClockIcon />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">Pickup</p>
                  <p className="mt-1 text-[12px] font-extrabold text-[#17191f]">As soon as possible</p>
                  <p className="mt-1 text-[8px] font-semibold text-[#9a9da3]">Drivers receive your request immediately</p>
                </div>
              </div>
            )}

            <div className="my-4 h-px bg-[#d1d3d8]" />

            {/* PROMO */}
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11
                  shrink-0
                  items-center justify-center
                  rounded-[14px]
                  bg-[#e7e9ee]
                  text-[#ff6846]
                  shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]
                "
              >
                <TicketIcon />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                    Promo code
                  </p>

                  <span className="text-[8px] font-bold text-[#aaadb3]">
                    Optional
                  </span>
                </div>

                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) =>
                    setPromoCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter code"
                  className="
                    mt-1
                    w-full
                    bg-transparent
                    text-[12px]
                    font-extrabold
                    uppercase
                    text-[#17191f]
                    outline-none
                    placeholder:normal-case
                    placeholder:font-medium
                    placeholder:text-[#a0a3a9]
                  "
                />
              </div>
            </div>
          </div>
        </section>

        {/* SCHEDULED RIDE PREVIEW - COMPACT MOBILE */}
        {rideType === "scheduled" && (
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#ff6846]">
                  Upcoming
                </p>
                <h3 className="mt-0.5 text-[17px] font-black tracking-[-0.035em]">
                  Scheduled ride
                </h3>
              </div>

              <span className="rounded-full bg-[#fff0eb] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#ff6846]">
                Scheduled
              </span>
            </div>

            <div className="rounded-[23px] bg-[#e7e9ee] p-4 shadow-[6px_6px_14px_#c3c5ca,-6px_-6px_14px_#ffffff]">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.11em] text-[#92959b]">
                    Pickup
                  </p>
                  <p className="mt-0.5 text-[17px] font-black tracking-[-0.04em]">
                    {formattedTravelDate}
                  </p>
                </div>

                <div className="rounded-[14px] bg-[#17191f] px-3.5 py-2 text-center text-white">
                  <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-white/45">
                    Time
                  </p>
                  <p className="text-[15px] font-black">{pickupTime}</p>
                </div>

                <div className="text-right">
                  <p className="text-[7px] font-extrabold uppercase tracking-[0.1em] text-[#92959b]">
                    Fare
                  </p>
                  <p className="mt-0.5 text-[17px] font-black">{fare ? `R${fare}` : "—"}</p>
                </div>
              </div>

              <div className="mt-3 rounded-[16px] bg-[#e7e9ee] px-3.5 py-3 shadow-[inset_2px_2px_5px_#c7c9ce,inset_-2px_-2px_5px_#ffffff]">
                <div className="flex items-center gap-2.5">
                  <span className="h-[10px] w-[10px] shrink-0 rounded-full border-[3px] border-[#17191f]" />
                  <p className="min-w-0 flex-1 truncate text-[10px] font-black">
                    {pickup || "Choose pickup location"}
                  </p>
                </div>

                <div className="ml-[4px] my-1 h-3 border-l border-dashed border-[#b6b9bf]" />

                <div className="flex items-center gap-2.5">
                  <span className="h-[10px] w-[10px] shrink-0 rounded-[3px] bg-[#ff6846]" />
                  <p className="min-w-0 flex-1 truncate text-[10px] font-black">
                    {destination || "Choose destination"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[#ff6846] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]">
                  <ClockIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black">
                    Driver matching starts closer to pickup time
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold leading-3.5 text-[#8b8e95]">
                    Your ride stays scheduled until matching begins.
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#e7e9ee] px-2.5 py-2 text-center shadow-[inset_2px_2px_4px_#c7c9ce,inset_-2px_-2px_4px_#ffffff]">
                  <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-[#9a9da3]">
                    Status
                  </p>
                  <p className="mt-0.5 text-[8px] font-black text-[#ff6846]">
                    Scheduled
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RIDE NOW GPS PROMPT */}
        {rideType === "now" && selectedPickup && selectedDestination && !locationConfirmed && (
          <section className="mt-7">
            <div className="rounded-[20px] bg-[#e7e9ee] px-4 py-4 text-center shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
              <p className="text-[10px] font-black text-[#17191f]">Confirm your current location to calculate your fare</p>
              <p className="mt-1 text-[8px] font-semibold text-[#92959b]">Ride Now uses your live GPS position so your driver can find you accurately.</p>
            </div>
          </section>
        )}

        {/* SAMPLE FARE */}
        {fare && selectedPickup && selectedDestination && (
          <section className="mt-7">
            <div
              className="
                relative
                overflow-hidden
                rounded-[24px]
                bg-[#ff6846]
                p-5
                text-white
                shadow-[7px_7px_15px_#c0c2c7,-5px_-5px_12px_#ffffff]
              "
            >
              {/* DECORATION */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[24px] border-white/5" />

              <div className="relative">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/65">
                  Estimated fare
                </p>

                <div className="mt-3 flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[38px] font-black leading-none tracking-[-0.055em]">
                      R{fare}
                    </p>

                    <p className="mt-2 text-[9px] font-semibold text-white/65">
                      {outOfTownFee > 0
                        ? `Includes R${outOfTownFee} out-of-town fee`
                        : "Final fare calculated from your route"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[16px] font-black">
                      {distanceKm !== null ? `${Number(distanceKm).toFixed(1)} km` : "—"}
                    </p>

                    <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/60">
                      Road distance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* REQUEST */}
        <section className="mt-7">
          <button
            type="button"
            onClick={handleBooking}
            disabled={
                loading ||
                !selectedPickup ||
                !selectedDestination ||
                !fare ||
                (rideType === "now" && (!locationConfirmed || !gpsLocation)) ||
                (rideType === "scheduled" && !scheduledTimeIsValid)
              }
            className="
              flex w-full
              items-center justify-between
              rounded-[18px]
              bg-[#17191f]
              px-5 py-[16px]
              text-white
              shadow-[6px_6px_13px_#c0c2c7,-5px_-5px_11px_#ffffff]
              transition
              active:scale-[0.985]
              disabled:cursor-not-allowed
              disabled:opacity-45
            "
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
                  ? pickupTime
                    ? `Pickup ${travelDate} at ${pickupTime}`
                    : "Choose your pickup time"
                  : "We'll send your request to nearby drivers"}
              </p>
            </div>

            <span
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full
                bg-[#ff6846]
              "
            >
              <ArrowRightIcon />
            </span>
          </button>

          <p className="mt-4 px-5 text-center text-[9px] font-medium leading-4 text-[#96999f]">
            {rideType === "scheduled"
              ? "Scheduled rides stay reserved until their driver-request window opens closer to pickup time."
              : "Your driver will receive your pickup location after you confirm the booking."}
          </p>
        </section>

        <footer className="mt-9 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9]">
            RouteX • Getting Upington Moving
          </p>
        </footer>
      </div>

        {appPopup && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-5 pb-6 sm:items-center sm:pb-0">
            <div className="w-full max-w-sm rounded-[26px] bg-[#e7e9ee] p-5 shadow-[10px_10px_28px_rgba(0,0,0,0.22),-6px_-6px_18px_rgba(255,255,255,0.75)]">
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                  appPopup.tone === "error"
                    ? "bg-[#ff6846] text-white"
                    : "bg-[#17191f] text-white"
                }`}>
                  <span className="text-[18px] font-black">!</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-[#17191f]">{appPopup.title}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-5 text-[#7c7f86]">{appPopup.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppPopup(null)}
                className="mt-5 w-full rounded-[16px] bg-[#17191f] px-4 py-3.5 text-[11px] font-black text-white shadow-[4px_4px_9px_#c3c5ca,-4px_-4px_9px_#ffffff] active:scale-[0.985]"
              >
                OK
              </button>
            </div>
          </div>
        )}
    </main>
  );
}

function BackIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg
      width="15"
      height="15"
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

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}