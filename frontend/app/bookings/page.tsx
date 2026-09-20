
"use client";

import { useEffect, useRef, useState } from "react";
import { showNotification } from "../lib/notifications";
import { API_URL } from "../lib/api";

function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
}
export default function BookRidePage() {
  const [loading, setLoading] = useState(false);
  const [passenger, setPassenger] = useState<any>(null);

  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState("");
 

  const [gettingLocation, setGettingLocation] = useState(false);
  const [pickupGpsConfirmed, setPickupGpsConfirmed] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [fare, setFare] = useState("");
  const [outOfTownFee, setOutOfTownFee] = useState(0);

 const [form, setForm] = useState({
  pickup_area: "",
  dropoff_area: "",

  pickup_town: "",
  pickup_address: "",
  pickup_lat: null as number | null,
  pickup_lng: null as number | null,

  dropoff_town: "",
  dropoff_address: "",
  dropoff_lat: null as number | null,
  dropoff_lng: null as number | null,

  travel_date: new Date().toISOString().split("T")[0],
});

  /* =========================
     LOAD PASSENGER
  ========================= */

  useEffect(() => {
    const storedPassenger = localStorage.getItem("passenger");

    if (storedPassenger) {
      setPassenger(JSON.parse(storedPassenger));
    }
  }, []);

  /* =========================
     LOAD AREAS
  ========================= */

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const response = await fetch(
          `${API_URL}/areas`
        );

        const data = await response.json();
        console.log(data);

        setAreas(data);

       // setAreas(data);
      } catch (error) {
        console.error("Failed to load areas", error);
      }
    };

    loadAreas();
  }, []);

  /* =========================
     ADDRESS SEARCH
  ========================= */

  const searchAddress = async (
  query: string,
  type: "pickup" | "dropoff"
) => {
  if (query.trim().length < 3) {
    if (type === "pickup") {
      setPickupSuggestions([]);
    } else {
      setDropoffSuggestions([]);
    }
    return;
  }

  try {
    const searchQuery =
      `${query}, Upington, Northern Cape, South Africa`;

    const response = await fetch(
  `${API_URL}/addresses/search?q=${encodeURIComponent(query)}`
);

const data = await response.json();

const results = data;

    if (type === "pickup") {
      setPickupSuggestions(results);
    } else {
      setDropoffSuggestions(results);
    }
  } catch (error) {
    console.error("Address search failed:", error);
  }
};
/* =========================
   PASSENGER GPS LOCATION
========================= */

const getPickupLocation = () => {
  setLocationError("");

  if (!navigator.geolocation) {
    setLocationError(
      "Location services are not supported on this device."
    );
    return;
  }

  setGettingLocation(true);
  setPickupGpsConfirmed(false);

  let bestAccuracy = Infinity;
  let bestLatitude: number | null = null;
  let bestLongitude: number | null = null;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log("GPS READING:", {
        latitude,
        longitude,
        accuracy,
      });

      // Keep the most accurate reading received
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestLatitude = latitude;
        bestLongitude = longitude;
      }

      // Good enough for pickup navigation
      if (accuracy <= 100) {
        navigator.geolocation.clearWatch(watchId);
        clearTimeout(gpsTimeout);

        setForm((current) => ({
          ...current,
          pickup_lat: latitude,
          pickup_lng: longitude,
        }));

        setPickupGpsConfirmed(true);
        setGettingLocation(false);
        setLocationError("");
      }
    },

    (error) => {
      console.error("GPS ERROR:", error);

      navigator.geolocation.clearWatch(watchId);
      clearTimeout(gpsTimeout);

      setGettingLocation(false);
      setPickupGpsConfirmed(false);

      if (error.code === 1) {
        setLocationError(
          "Location permission is required to book a RouteX ride."
        );
      } else {
        setLocationError(
          "We couldn't find your precise location. Make sure Location is turned on, then try again."
        );
      }
    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    }
  );

  // Give the phone up to 15 seconds to improve its GPS reading
  const gpsTimeout = setTimeout(() => {
    navigator.geolocation.clearWatch(watchId);

    // If we received a reasonably useful reading, use it.
    if (
      bestLatitude !== null &&
      bestLongitude !== null &&
      bestAccuracy <= 150
    ) {
      setForm((current) => ({
        ...current,
        pickup_lat: bestLatitude,
        pickup_lng: bestLongitude,
      }));

      setPickupGpsConfirmed(true);
      setGettingLocation(false);
      setLocationError("");
      return;
    }

    setGettingLocation(false);
    setPickupGpsConfirmed(false);

    setLocationError(
      "We couldn't find your precise location. Make sure Location is turned on, then try again."
    );
  }, 15000);
};

  /* =========================
     FARE CALCULATION
  ========================= */

  useEffect(() => {
  const hasGps =
    form.pickup_lat !== null &&
    form.pickup_lng !== null &&
    form.dropoff_lat !== null &&
    form.dropoff_lng !== null;

  if (hasGps) {
    calculateFare(
      form.pickup_area || "GPS Pickup",
      form.dropoff_area || "GPS Destination"
    );
  }
}, [
  form.pickup_lat,
  form.pickup_lng,
  form.dropoff_lat,
  form.dropoff_lng,
  form.pickup_area,
  form.dropoff_area,
]);

  const calculateFare = async (
  pickupArea: string,
  dropoffArea: string
) => {
  if (!pickupArea || !dropoffArea) return;

  try {
  const params = new URLSearchParams({
    pickup_area: pickupArea,
    dropoff_area: dropoffArea,
  });

  if (
    form.pickup_lat !== null &&
    form.pickup_lng !== null &&
    form.dropoff_lat !== null &&
    form.dropoff_lng !== null
  ) {
    params.append("pickup_lat", String(form.pickup_lat));
    params.append("pickup_lng", String(form.pickup_lng));
    params.append("dropoff_lat", String(form.dropoff_lat));
    params.append("dropoff_lng", String(form.dropoff_lng));
  }

  const response = await fetch(
    `${API_URL}/calculate-fare?${params.toString()}`
  );

  const data = await response.json();
  

  console.log("Fare data:", data);

  setDistanceKm(data.distance_km ?? null);

  if (!response.ok) {
    console.error("Fare API error:", data);
    return;
  }

  const calculatedFare = Number(data.fare);

  setFare(String(data.fare));
  setOutOfTownFee(Number(data.out_of_town_fee || 0));

  console.log("Pricing method:", data.pricing_method);
  console.log("Road distance:", data.distance_km);
  console.log("Base Fare:", calculatedFare);
  console.log("Discount:", data.discount ?? 0);
  console.log("Final Fare:", calculatedFare);
}
  
  catch (error) {
    console.error(
      "Fare calculation failed",
      error
    );
  }
};

  /* =========================
     BOOK RIDE
  ========================= */

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Pickup area is not required here because the passenger's
    // confirmed GPS coordinates are the authoritative pickup location.
    if (
      !form.pickup_address ||
      !form.dropoff_address ||
      !form.dropoff_area ||
      !form.travel_date
    ) {
      alert("Please complete all fields");
      return;
    }
if (
  !pickupGpsConfirmed ||
  form.pickup_lat === null ||
  form.pickup_lng === null
) {
  alert(
    "Please confirm your current GPS location before booking your ride."
  );
  return;
}
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
         body: JSON.stringify({
  passenger_id: passenger?.id,

  // A typed pickup address may not have an area_name on mobile.
  // The confirmed GPS coordinates are what the driver will navigate to.
  pickup_area: form.pickup_area || "GPS Pickup",
  dropoff_area: form.dropoff_area,

  pickup_address: form.pickup_address,
  dropoff_address: form.dropoff_address,

  // Passenger's actual GPS pickup position
  pickup_lat: form.pickup_lat,
  pickup_lng: form.pickup_lng,

  // Selected destination coordinates
  dropoff_lat: form.dropoff_lat,
  dropoff_lng: form.dropoff_lng,

  travel_date: form.travel_date,
  fare_amount: fare,
  promo_code: promoCode,
}),
        }
      );

      const data = await response.json();
      

      if (!response.ok) {
        alert(
          data.message ||
            data.error ||
            "Booking failed"
        );

        setLoading(false);
        return;
      }

      alert("Booking created successfully");

      showNotification(
        "✅ Booking Confirmed",
        "Your RouteX trip has been booked successfully."
      );
     setPromoCode("");

setPickupGpsConfirmed(false);
setLocationError("");

setForm({
  pickup_area: "",
  dropoff_area: "",

  pickup_town: "",
  pickup_address: "",
  pickup_lat: null,
  pickup_lng: null,

  dropoff_town: "",
  dropoff_address: "",
  dropoff_lat: null,
  dropoff_lng: null,

  travel_date: new Date().toISOString().split("T")[0],
});

      setFare("");
    } catch (error) {
      console.error("Booking failed", error);
      alert("Unable to create booking. Please try again.");
    }

    setLoading(false);
  };

  /* =========================
     AREAS
  ========================= */

  const areaOptions = [
    "Bellvue",
    "Blydeville",
    "Die Rand",
    "Flora Park",
    "Keidebees",
    "Klippunt",
    "Laboria",
    "Lemoendraai",
    "Louisvale",
    "Louisvale Weg",
    "Middelpos",
    "Morning Glory",
    "Nuwerus",
    "Oosterville",
    "Paballelo",
    "Progress",
    "Raaswater",
    "Rosedale",
    "Ses Brugge",
    "Straussburg",
    "Swartkop",
    "Upington Central",
    "Vaalkroek",
  ];

  return (
    <main className="min-h-[100dvh] bg-[#e7e9ee] text-[#17191f]">
      <div className="mx-auto w-full max-w-md px-5 pb-10">

        <header className="flex items-center justify-between pt-6">
          <a
            href="/passenger-portal"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[#17191f] shadow-[4px_4px_9px_#c4c6ca,-4px_-4px_9px_#ffffff] transition active:scale-95"
          >
            <BackIcon />
          </a>

          <h1 className="text-[25px] font-black tracking-[-0.06em]">
            Route<span className="text-[#ff6846]">X</span>
          </h1>

          <div className="h-10 w-10" />
        </header>

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

        <form onSubmit={handleSubmit}>
          <section className="mt-7 rounded-[26px] bg-[#e7e9ee] p-4 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
            <div className="flex gap-3">
              <div className="flex w-5 shrink-0 flex-col items-center pt-[48px]">
                <span className="h-[12px] w-[12px] rounded-full border-[3px] border-[#17191f] bg-[#e7e9ee]" />
                <span className="my-1.5 min-h-[57px] w-px flex-1 border-l border-dashed border-[#aeb1b7]" />
                <span className="h-[11px] w-[11px] rounded-[3px] bg-[#ff6846]" />
              </div>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="relative">
                  <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
                    Pickup
                  </label>

                  <div className="rounded-[16px] bg-[#e7e9ee] shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                    <input
                      type="text"
                      value={form.pickup_address}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({
                          ...form,
                          pickup_address: value,
                          pickup_lat: null,
                          pickup_lng: null,
                        });
                        setPickupGpsConfirmed(false);
                        setLocationError("");
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        searchTimeoutRef.current = setTimeout(() => {
                          searchAddress(value, "pickup");
                        }, 250);
                      }}
                      placeholder="Enter pickup location"
                      className="w-full bg-transparent px-4 py-[14px] text-[13px] font-bold text-[#17191f] outline-none placeholder:font-medium placeholder:text-[#a0a3a9]"
                    />
                  </div>

                  {pickupSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[17px] bg-[#e7e9ee] p-2 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
                      {pickupSuggestions.map((item, index) => (
                        <button
                          key={`${item.address}-${index}`}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              pickup_address: item.address,
                              pickup_area: item.area_name || "",
                              pickup_lat: null,
                              pickup_lng: null,
                            });
                            setPickupGpsConfirmed(false);
                            setLocationError("");
                            setPickupSuggestions([]);
                          }}
                          className="w-full rounded-[12px] px-3 py-3 text-left transition hover:bg-[#dfe1e6]"
                        >
                          <p className="text-[11px] font-extrabold text-[#17191f]">
                            {item.address}
                          </p>
                          <p className="mt-1 text-[9px] font-semibold text-[#92959b]">
                            {item.area_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={getPickupLocation}
                    disabled={gettingLocation}
                    className={`mt-3 flex w-full items-center justify-between rounded-[14px] px-3.5 py-3 text-left transition active:scale-[0.985] ${
                      pickupGpsConfirmed
                        ? "bg-[#17191f] text-white shadow-[3px_3px_7px_#c3c5ca,-3px_-3px_7px_#ffffff]"
                        : "bg-[#e7e9ee] text-[#17191f] shadow-[3px_3px_7px_#c4c6ca,-3px_-3px_7px_#ffffff]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${
                        pickupGpsConfirmed
                          ? "bg-[#ff6846]"
                          : "bg-[#e7e9ee] text-[#ff6846] shadow-[inset_2px_2px_5px_#c4c6ca,inset_-2px_-2px_5px_#ffffff]"
                      }`}>
                        <GpsIcon />
                      </span>
                      <div>
                        <p className="text-[10px] font-extrabold">
                          {gettingLocation
                            ? "Getting your location..."
                            : pickupGpsConfirmed
                            ? "Pickup confirmed"
                            : "Confirm my location"}
                        </p>
                        <p className={`mt-0.5 text-[8px] font-semibold ${
                          pickupGpsConfirmed ? "text-white/55" : "text-[#96999f]"
                        }`}>
                          Helps your driver find you
                        </p>
                      </div>
                    </div>
                    {pickupGpsConfirmed && <CheckIcon />}
                  </button>

                  {locationError && (
                    <p className="mt-2 px-1 text-[10px] font-semibold leading-4 text-red-600">
                      {locationError}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8d9097]">
                    Destination
                  </label>

                  <div className="rounded-[16px] bg-[#e7e9ee] shadow-[inset_3px_3px_7px_#c7c9ce,inset_-3px_-3px_7px_#ffffff]">
                    <input
                      type="text"
                      value={form.dropoff_address}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({
                          ...form,
                          dropoff_address: value,
                          dropoff_lat: null,
                          dropoff_lng: null,
                        });
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        searchTimeoutRef.current = setTimeout(() => {
                          searchAddress(value, "dropoff");
                        }, 250);
                      }}
                      placeholder="Where are you going?"
                      className="w-full bg-transparent px-4 py-[14px] text-[13px] font-bold text-[#17191f] outline-none placeholder:font-medium placeholder:text-[#a0a3a9]"
                    />
                  </div>

                  {dropoffSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[17px] bg-[#e7e9ee] p-2 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">
                      {dropoffSuggestions.map((item, index) => (
                        <button
                          key={`${item.address}-${index}`}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              dropoff_address: item.address,
                              dropoff_area: item.area_name || "",
                              dropoff_lat: item.lat ?? null,
                              dropoff_lng: item.lng ?? null,
                            });
                            setDropoffSuggestions([]);
                          }}
                          className="w-full rounded-[12px] px-3 py-3 text-left transition hover:bg-[#dfe1e6]"
                        >
                          <p className="text-[11px] font-extrabold text-[#17191f]">
                            {item.address}
                          </p>
                          <p className="mt-1 text-[9px] font-semibold text-[#92959b]">
                            {item.area_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8f9298]">
                Trip details
              </p>
              <h3 className="mt-1 text-[18px] font-black tracking-[-0.035em]">
                When are you travelling?
              </h3>
            </div>

            <div className="rounded-[22px] bg-[#e7e9ee] p-4 shadow-[5px_5px_12px_#c4c6ca,-5px_-5px_12px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[#ff6846] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
                  <CalendarIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                    Travel date
                  </p>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.travel_date}
                    onChange={(e) => setForm({ ...form, travel_date: e.target.value })}
                    className="mt-1 w-full bg-transparent text-[12px] font-extrabold text-[#17191f] outline-none"
                  />
                </div>
              </div>

              <div className="my-4 h-px bg-[#d1d3d8]" />

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[#ff6846] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">
                  <TicketIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#92959b]">
                      Promo code
                    </p>
                    <span className="text-[8px] font-bold text-[#aaadb3]">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="mt-1 w-full bg-transparent text-[12px] font-extrabold uppercase text-[#17191f] outline-none placeholder:normal-case placeholder:font-medium placeholder:text-[#a0a3a9]"
                  />
                </div>
              </div>
            </div>
          </section>

          {fare && (
            <section className="mt-7">
              <div className="relative overflow-hidden rounded-[24px] bg-[#ff6846] p-5 text-white shadow-[7px_7px_15px_#c0c2c7,-5px_-5px_12px_#ffffff]">
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
                      {outOfTownFee > 0 ? (
                        <p className="mt-2 text-[9px] font-semibold text-white/65">
                          Includes R{outOfTownFee} out-of-town fee
                        </p>
                      ) : (
                        <p className="mt-2 text-[9px] font-semibold text-white/65">
                          Final fare calculated from your route
                        </p>
                      )}
                    </div>

                    {distanceKm !== null && (
                      <div className="text-right">
                        <p className="text-[16px] font-black">
                          {Number(distanceKm).toFixed(1)} km
                        </p>
                        <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/60">
                          Road distance
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="mt-7">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-between rounded-[18px] bg-[#17191f] px-5 py-[16px] text-white shadow-[6px_6px_13px_#c0c2c7,-5px_-5px_11px_#ffffff] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-[13px] font-black">
                  {loading ? "Requesting ride..." : "Request RouteX"}
                </p>
                <p className="mt-0.5 text-[8px] font-semibold text-white/45">
                  We'll send your request to nearby drivers
                </p>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6846]">
                <ArrowRightIcon />
              </span>
            </button>

            <p className="mt-4 px-5 text-center text-[9px] font-medium leading-4 text-[#96999f]">
              Your driver will receive your pickup location after you confirm the booking.
            </p>
          </section>
        </form>

        <footer className="mt-9 text-center">
          <p className="text-[9px] font-semibold text-[#a0a3a9]">
            RouteX • Getting Upington Moving
          </p>
        </footer>
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
