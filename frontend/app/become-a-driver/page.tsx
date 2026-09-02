
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

  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

 const handleSubmit = async () => {
  if (
    !form.full_name ||
    !form.phone ||
    !form.vehicle_type ||
    !form.vehicle_color ||
    !form.license_plate
  ) {
    alert("Please complete all required fields.");
    return;
  }

  if (!vehiclePhoto) {
    alert("Please upload a photo of your vehicle.");
    return;
  }

  try {
    setSubmitting(true);

    const formData = new FormData();

    formData.append("full_name", form.full_name);
    formData.append("phone", form.phone);
    formData.append("vehicle_type", form.vehicle_type);
    formData.append("vehicle_color", form.vehicle_color);
    formData.append("license_plate", form.license_plate);
    formData.append("referral_code", form.referral_code);

    formData.append("vehicle_photo", vehiclePhoto);

    if (profilePhoto) {
      formData.append("profile_photo", profilePhoto);
    }

    const response = await fetch(
      "https://routex-smgu.onrender.com/driver-application",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      alert("Failed to submit application.");
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

    setVehiclePhoto(null);
    setProfilePhoto(null);
  } catch (error) {
    console.error("Driver application error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">

        <h1 className="text-2xl font-bold text-slate-800">
          Become a RouteX Driver
        </h1>

        <p className="mt-2 mb-6 text-slate-600">
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
          className="mb-3 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value,
            })
          }
          className="mb-3 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
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
          className="mb-3 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
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
          className="mb-3 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
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
          className="mb-4 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
        />

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Vehicle Photo
          </label>

          <input
            type="file"
            accept="image/*"
           onChange={(e) =>
  setVehiclePhoto(e.target.files?.[0] || null)
}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700"
          />

         {vehiclePhoto && (
  <p className="mt-2 text-sm text-slate-500">
    Selected: {vehiclePhoto.name}
  </p>
)}
        </div>

        <input
          placeholder="Referral Code (Optional)"
          value={form.referral_code}
          onChange={(e) =>
            setForm({
              ...form,
              referral_code: e.target.value,
            })
          }
          className="mb-4 w-full rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-500"
        />
<div>
  <label className="block text-sm font-medium mb-1">
    Profile Photo (Optional)
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
    className="w-full border rounded-lg p-2"
  />
  {profilePhoto && (
  <p className="mt-2 text-sm text-slate-500">
    Selected: {profilePhoto.name}
  </p>
)}

</div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>

      </div>
    </main>
  );
}
