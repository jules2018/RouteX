
"use client";

import { useEffect, useRef, useState } from "react";
import { showNotification } from "../lib/notifications";

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
 const API_BASE_URL = "https://routex-development.onrender.com";

  const [fare, setFare] = useState("");

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
          "https://routex-development.onrender.com/areas"
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
  `${API_BASE_URL}/addresses/search?q=${encodeURIComponent(query)}`
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
     FARE CALCULATION
  ========================= */

  useEffect(() => {
    if (form.pickup_area && form.dropoff_area) {
      calculateFare(
        form.pickup_area,
        form.dropoff_area
      );
    }
  }, [
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
    `https://routex-development.onrender.com/calculate-fare?${params.toString()}`
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

    if (
      !form.pickup_area ||
      !form.pickup_address ||
      !form.dropoff_area ||
      !form.dropoff_address ||
      !form.travel_date
    ) {
      alert("Please complete all fields");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "https://routex-development.onrender.com/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  passenger_id: passenger?.id,
  pickup_area: form.pickup_area,
  dropoff_area: form.dropoff_area,
  pickup_address: form.pickup_address,
  dropoff_address: form.dropoff_address,
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
  <main className="min-h-screen bg-[#f7f3ee] text-[#171717]">

    <div className="mx-auto max-w-xl px-4 pb-10 pt-7">

      {/* =================================
          HEADER
      ================================= */}

      <div className="mb-5 px-1">

        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff8500]">
          RouteX
        </p>

        <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#171717]">
          Book your ride
        </h1>

        <p className="mt-1 text-sm text-[#8a8a8a]">
          Where would you like to go?
        </p>

      </div>


      <form onSubmit={handleSubmit} className="space-y-4">

        {/* =================================
            LOCATION CARD
        ================================= */}

      <section
  className="
    rounded-[26px]
    bg-white
    px-5
    py-4
    shadow-[0_12px_35px_rgba(0,0,0,0.08)]
  "
>
  <div className="flex gap-4">

    {/* ROUTE INDICATOR */}
    <div className="flex w-5 shrink-0 flex-col items-center pt-8">

      <div className="h-3.5 w-3.5 rounded-full border-[3px] border-[#ff8500] bg-white" />

      <div className="my-1 w-px flex-1 bg-[#dedede]" />

      <div className="h-3.5 w-3.5 rounded-[3px] bg-[#2c2d2d]" />

    </div>

    <div className="min-w-0 flex-1 space-y-4">

      {/* PICKUP */}
      <div className="relative">

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
          Pickup
        </label>

        <input
          value={form.pickup_address}
          placeholder="Enter pickup location"
          onChange={(e) => {
            const value = e.target.value;

            setForm({
              ...form,
              pickup_address: value,
            });

            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = setTimeout(() => {
              searchAddress(value, "pickup");
            }, 250);
          }}
          className="
            w-full
            rounded-[16px]
            border
            border-[#ececec]
            bg-white
            px-4
            py-[14px]
            text-[15px]
            font-semibold
            text-[#1f1f1f]
            outline-none
            placeholder:font-normal
            placeholder:text-[#aaa]
            focus:border-[#ff8500]
            focus:ring-2
            focus:ring-[#ff8500]/10
          "
        />

        {pickupSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[18px] bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">

            {pickupSuggestions.map((item, index) => (
              <button
                key={`${item.address}-${index}`}
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    pickup_address: item.address,
                    pickup_area: item.area_name || "",
                    pickup_lat: item.lat ?? null,
                    pickup_lng: item.lng ?? null,
                  });

                  setPickupSuggestions([]);
                }}
                className="w-full rounded-[14px] px-4 py-3 text-left hover:bg-[#fff6ed]"
              >
                <p className="text-[14px] font-semibold text-[#202020]">
                  {item.address}
                </p>

                <p className="mt-1 text-xs text-[#9a9a9a]">
                  {item.area_name}
                </p>
              </button>
            ))}

          </div>
        )}
      </div>

      {/* DROP-OFF */}
      <div className="relative">

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
          Drop-off
        </label>

        <input
          value={form.dropoff_address}
          placeholder="Enter destination"
          onChange={(e) => {
            const value = e.target.value;

            setForm({
              ...form,
              dropoff_address: value,
            });

            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = setTimeout(() => {
              searchAddress(value, "dropoff");
            }, 250);
          }}
          className="
            w-full
            rounded-[16px]
            border
            border-[#ececec]
            bg-white
            px-4
            py-[14px]
            text-[15px]
            font-semibold
            text-[#1f1f1f]
            outline-none
            placeholder:font-normal
            placeholder:text-[#aaa]
            focus:border-[#ff8500]
            focus:ring-2
            focus:ring-[#ff8500]/10
          "
        />

        {dropoffSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[18px] bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">

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
                className="w-full rounded-[14px] px-4 py-3 text-left hover:bg-[#fff6ed]"
              >
                <p className="text-[14px] font-semibold text-[#202020]">
                  {item.address}
                </p>

                <p className="mt-1 text-xs text-[#9a9a9a]">
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


        {/* =================================
            DATE + PROMO CARD
        ================================= */}

        <section
          className="
            rounded-[28px]
            bg-white
            p-5
            shadow-[0_12px_35px_rgba(0,0,0,0.08)]
          "
        >

          {/* DATE */}

          <div className="flex items-center justify-between gap-5">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
                Travel date
              </p>

              <p className="mt-1 text-sm font-semibold text-[#262626]">
                When do you need the ride?
              </p>

            </div>


            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={form.travel_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  travel_date: e.target.value,
                })
              }
              className="
                rounded-[16px]
                border-0
              bg-white border border-[#e8e8e8]
                px-3
                py-3
                text-sm
                font-semibold
                text-[#252525]
                outline-none
              "
            />

          </div>


          {/* DIVIDER */}

          <div className="my-5 h-px bg-[#eeeeec]" />


          {/* PROMO */}

          <div>

            <div className="mb-2 flex items-center justify-between">

              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
                Promo code
              </label>

              <span className="text-[11px] font-medium text-[#b0b0b0]">
                Optional
              </span>

            </div>


            <input
              type="text"
              value={promoCode}
              onChange={(e) =>
                setPromoCode(e.target.value.toUpperCase())
              }
              placeholder="Enter promo code"
              className="
                w-full
                rounded-[18px]
                border-0
                bg-white border border-[#e8e8e8]
                px-4
                py-[15px]
                text-sm
                font-semibold
                text-[#202020]
                outline-none
                placeholder:font-normal
                placeholder:text-[#aaa]
                focus:ring-2
                focus:ring-teal-600/15
              "
            />

          </div>

        </section>


        {/* =================================
            FARE CARD
        ================================= */}

        {fare && (
         <section
  className="
    rounded-[28px]
    bg-[#ff8500]
    p-5
    text-white
    shadow-[0_10px_30px_rgba(0,0,0,0.10)]
  "
>

           <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
  Your ride
</p>

<div className="mt-4 flex items-end justify-between gap-6">

  <div>
    <p className="text-sm text-white/75">
      Estimated fare
    </p>

    <p className="mt-1 text-[40px] font-bold tracking-[-0.05em] text-white">
      R{fare}
    </p>
  </div>

  <div className="text-right">
    {distanceKm && (
      <>
        <p className="text-[18px] font-bold text-white">
          {distanceKm} km
        </p>

        <p className="mt-1 text-xs text-white/70">
          Road distance
        </p>
      </>
    )}
  </div>

</div>


            <div className="my-5 h-px bg-[#eeeeec]" />


            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold text-[#303030]">
                  RouteX ride
                </p>

                <p className="mt-1 text-sm font-medium text-[#333333]">
                  Driver assigned when available
                </p>

              </div>


              <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />

            </div>

          </section>
        )}


        {/* =================================
            REQUEST BUTTON
        ================================= */}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-[20px]
            bg-[#2c2d2d]
            py-[17px]
            text-[15px]
            font-bold
            text-white
            shadow-[0_8px_24px_rgba(0,0,0,0.14)]
            transition
            hover:bg-[#1f2020]
            active:scale-[0.99]
            disabled:bg-[#bdbdbd]
          "
        >
          {loading
            ? "Requesting ride..."
            : "Request ride"}
        </button>


        <p className="px-7 text-center text-[11px] leading-5 text-[#999]">
          Your request will be sent to available RouteX drivers.
        </p>

      </form>

    </div>

  </main>
);
}