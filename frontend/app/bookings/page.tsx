"use client";
import { useEffect, useState } from "react";

export default function BookingPage() {
const [loading, setLoading] = useState(false);
const [passenger, setPassenger] = useState<any>(null);

useEffect(() => {
  const storedPassenger =
    localStorage.getItem("passenger");

  if (storedPassenger) {
    setPassenger(
      JSON.parse(storedPassenger)
    );
  }
}, []);

const [form, setForm] = useState({
  pickup_area: "",
  dropoff_area: "",

  pickup_town: "",
  pickup_address: "",
  dropoff_town: "",
  dropoff_address: "",
  travel_date: "",
});

  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  
  const [fare, setFare] = useState("");
  const searchAddress = async (
  query: string,
  type: "pickup" | "dropoff"
) => {

  if (!query) return;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=jsonv2`
    );

    const data = await response.json();

    if (type === "pickup") {
      setPickupResults(data);
    } else {
      setDropoffResults(data);
    }

  } catch (error) {
    console.error(
      "Address search failed",
      error
    );
  }
};
useEffect(() => {
  console.log(
  "AREAS:",
  form.pickup_area,
  form.dropoff_area
);
  if (
    form.pickup_area &&
    form.dropoff_area
  ) {
    calculateFare(
      form.pickup_area,
      form.dropoff_area
    );
  }
}, [
  form.pickup_area,
  form.dropoff_area
]);

const calculateFare = async (
  pickupArea: string,
  dropoffArea: string
) => {

  if (!pickupArea || !dropoffArea) return;

  try {

   const response = await fetch(
  `https://routex-smgu.onrender.com/calculate-fare?pickup_area=${encodeURIComponent(
    pickupArea
  )}&dropoff_area=${encodeURIComponent(
    dropoffArea
  )}`
);

const data = await response.json();

alert(JSON.stringify(data));

console.log("FARE:", data);

setFare(data.fare); 

  } catch (error) {

    console.error(
      "Fare calculation failed",
      error
    );

  }
};
  const handleSubmit = async (e: any) => {
    e.preventDefault();
if (
  !form.pickup_area ||
  !form.pickup_address ||
  !form.dropoff_area ||
  !form.dropoff_address ||
  !form.travel_date
)
 {
  alert("Please complete all fields");
  return;
}
    if (loading) return;

    setLoading(true);
    console.log("Passenger:", passenger);

    const response = await fetch(
  "https://routex-smgu.onrender.com/bookings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  passenger_id: passenger?.id,
  pickup_area: form.pickup_area,
  dropoff_area: form.dropoff_area,
  fare_amount: fare,
}),
      }
    );

  const data = await response.json();

await fetch(
  `https://routex-smgu.onrender.com/auto-assign/${data.id}`,
  {
    method: "POST",
  }
);

alert("Booking created successfully");

    setForm({
  pickup_area: "",
  dropoff_area: "",
  pickup_town: "",
  pickup_address: "",
  dropoff_town: "",
  dropoff_address: "",
  travel_date: "",
});
setFare("");
    setLoading(false);

  };

  return (
    
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        New Booking
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md"
      >
     <select
  value={form.pickup_area}
  onChange={(e) => {
  alert("Pickup: " + e.target.value);

  setForm({
    ...form,
    pickup_area: e.target.value,
  });
}}
  className="border p-2"
>
  <option value="">
    Select Pickup Area
  </option>
  <option value="Blydeville">Blydeville</option>
  <option value="Die Rand">Die Rand</option>
  <option value="Flora Park">Flora Park</option>
  <option value="Keidebees">Keidebees</option>
  <option value="Middelpos">Middelpos</option>
  <option value="Morning Glory">Morning Glory</option>
  <option value="Oosterville">Oosterville</option>
  <option value="Paballelo">Paballelo</option>
  <option value="Progress">Progress</option>
  <option value="Louisvale">Louisvale</option>
  <option value="Laboria">Laboria</option>
  <option value="Ses Brugge">Ses Brugge</option>
  <option value="Upington Central">Upington Central</option>   
</select>
<input
  placeholder="Pickup Address"
  value={form.pickup_address}
  onChange={(e) =>
  setForm({
    ...form,
    pickup_address: e.target.value,
  })
}
  className="border p-2"
/>

        <select
  value={form.dropoff_area}
  onChange={(e) =>
    setForm({
      ...form,
      dropoff_area: e.target.value,
    })
  }
  className="border p-2"
>
  <option value="">
    Select Dropoff Area
  </option>
  <option value="Blydeville">Blydeville</option>
  <option value="Die Rand">Die Rand</option>
  <option value="Flora Park">Flora Park</option>
  <option value="Keidebees">Keidebees</option>
  <option value="Middelpos">Middelpos</option>
  <option value="Morning Glory">Morning Glory</option>
  <option value="Oosterville">Oosterville</option>
  <option value="Paballelo">Paballelo</option>
  <option value="Progress">Progress</option>
  <option value="Louisvale">Louisvale</option>
  <option value="Laboria">Laboria</option>
  <option value="Ses Brugge">Ses Brugge</option>
  <option value="Upington Central">Upington Central</option>
</select>

<input
  placeholder="Dropoff Address"
  value={form.dropoff_address}
  onChange={(e) =>
    setForm({
      ...form,
      dropoff_address: e.target.value,
    })
  }
  className="border p-2"
/>

<input
  type="date"
  value={form.travel_date}
  onChange={(e) =>
    setForm({
      ...form,
      travel_date: e.target.value,
    })
  }
  className="border p-2"
/>
{fare && (
  <div className="border rounded-xl p-4 bg-green-50 border-green-200">
    <p className="text-sm text-slate-500">
      Estimated Fare
    </p>

    <p className="text-2xl font-bold text-green-700">
      R{fare}
    </p>
  </div>
)}
        <button
             type="submit"
             disabled={loading}
             className="bg-blue-600 text-white p-2 rounded"
                >           
            {loading ? "Creating..." : "Create Booking"}
        </button>
`
      </form>
    </main>
    
  );
}