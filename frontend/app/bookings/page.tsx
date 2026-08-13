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
  full_name: "",
  phone: "",
  pickup_town: "",
  pickup_address: "",
  dropoff_town: "",
  dropoff_address: "",
  travel_date: "",
});
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
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
  const handleSubmit = async (e: any) => {
    e.preventDefault();
if (
  !form.pickup_town ||
  !form.pickup_address ||
  !form.dropoff_town ||
  !form.dropoff_address ||
  !form.travel_date
) {
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

alert(
  `Passenger Created and Assigned: ${data.full_name}`
);

    setForm({
  full_name: "",
  phone: "",
  pickup_town: "",
  pickup_address: "",
  dropoff_town: "",
  dropoff_address: "",
  travel_date: "",
});
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
       {/* <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) =>
            setForm({
              ...form,
              full_name: e.target.value,
            })
          }
          className="border p-2"
        />
        */}
{/*
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value,
            })
          }
          className="border p-2"
        />
*/}
        <select
  value={form.pickup_town}
  onChange={(e) =>
    setForm({
      ...form,
      pickup_town: e.target.value,
    })
  }
  className="border p-2"
>
  <option value="">Select Pickup Town</option>
  <option value="Upington">Upington</option>
  <option value="Kakamas">Kakamas</option>
  <option value="Springbok">Springbok</option>
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
  value={form.dropoff_town}
  onChange={(e) =>
    setForm({
      ...form,
      dropoff_town: e.target.value,
    })
  }
  className="border p-2"
>
  <option value="">Select Dropoff Town</option>
  <option value="Upington">Upington</option>
  <option value="Bellville">Bellville</option>
  <option value="Parow">Parow</option>
  <option value="Goodwood">Goodwood</option>
  <option value="Cape Town">Cape Town</option>
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