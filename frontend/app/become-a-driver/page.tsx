"use client";

import { useState } from "react";

export default function BecomeADriverPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_type: "",
    vehicle_color: "",
    license_plate: "",
    referral_code: "",
  });

  const handleSubmit = async () => {
    const response = await fetch(
      "https://routex-smgu.onrender.com/driver-application",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    if (!response.ok) {
      alert("Failed to submit application");
      return;
    }

    alert(
      "Application submitted successfully. RouteX will review your application."
    );

    setForm({
      full_name: "",
      phone: "",
      vehicle_type: "",
      vehicle_color: "",
      license_plate: "",
      referral_code: "",
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm">

        <h1 className="text-2xl font-bold text-slate-800">
          Become a RouteX Driver
        </h1>

        <p className="text-slate-600 mt-2 mb-6">
          Complete the form below and our team will review your application.
        </p>

        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) =>
            setForm({
              ...form,
              full_name: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-3 text-slate-800 placeholder-slate-500"
        />

        <input
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-3 text-slate-800 placeholder-slate-500"
        />

        <input
          placeholder="Vehicle Type"
          value={form.vehicle_type}
          onChange={(e) =>
            setForm({
              ...form,
              vehicle_type: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-3 text-slate-800 placeholder-slate-500"
        />

        <input
          placeholder="Vehicle Colour"
          value={form.vehicle_color}
          onChange={(e) =>
            setForm({
              ...form,
              vehicle_color: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-3 text-slate-800 placeholder-slate-500"
        />

        <input
          placeholder="License Plate"
          value={form.license_plate}
          onChange={(e) =>
            setForm({
              ...form,
              license_plate: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-3 text-slate-800 placeholder-slate-500"
        />

        <input
          placeholder="Referral Code (Optional)"
          value={form.referral_code}
          onChange={(e) =>
            setForm({
              ...form,
              referral_code: e.target.value,
            })
          }
          className="w-full border border-slate-300 rounded-lg p-3 mb-4 text-slate-800 placeholder-slate-500"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold"
        >
          Submit Application
        </button>

      </div>
    </main>
  );
}