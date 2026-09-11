
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

  const handlePhoneChange = (value: string) => {
  const cleaned = value.replace(/\D/g, "");

  setForm((prev) => ({
    ...prev,
    phone: cleaned,
  }));
};

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
      "https://routex-development.onrender.com//driver-application",
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
  <main className="min-h-screen bg-white text-[#111111]">
    <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[22px] font-extrabold tracking-tight">
          Route<span className="text-[#ff6a00]">X</span>
        </div>

        <span
          className="
            rounded-full
            bg-[#fff3eb]
            px-3
            py-1.5
            text-[10px]
            font-extrabold
            uppercase
            tracking-[0.08em]
            text-[#ff6a00]
          "
        >
          Driver
        </span>
      </div>

      {/* Intro */}
      <section className="mt-10">
        <div className="h-1 w-8 rounded-full bg-[#ff6a00]" />

        <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">
          Drive with RouteX
        </h1>

        <p className="mt-2 text-[14px] leading-6 text-[#777777]">
          Apply to become a RouteX driver and earn by helping people move around Upington.
        </p>
      </section>

      {/* Form */}
      <section className="mt-7 space-y-5">

        {/* Full Name */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Full name
          </label>

          <input
            type="text"
            placeholder="Your full name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              outline-none
              transition
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Phone number
          </label>

          <input
            type="tel"
            placeholder="0821234567"
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            inputMode="numeric"
            autoComplete="tel"
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              outline-none
              transition
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />

          <p className="mt-1.5 text-[11px] text-[#999999]">
            Enter your number without spaces.
          </p>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Vehicle
          </label>

          <input
            type="text"
            placeholder="e.g. Toyota Corolla"
            value={form.vehicle_type}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_type: e.target.value,
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              outline-none
              transition
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />
        </div>

        {/* Vehicle Colour */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Vehicle colour
          </label>

          <input
            type="text"
            placeholder="e.g. White"
            value={form.vehicle_color}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_color: e.target.value,
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              outline-none
              transition
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />
        </div>

        {/* License Plate */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Registration number
          </label>

          <input
            type="text"
            placeholder="e.g. CA 123-456"
            value={form.license_plate}
            onChange={(e) =>
              setForm({
                ...form,
                license_plate: e.target.value.toUpperCase(),
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              uppercase
              outline-none
              transition
              placeholder:normal-case
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />
        </div>

        {/* Vehicle Photo */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Vehicle photo
          </label>

          <label
            className="
              mt-2
              flex
              cursor-pointer
              items-center
              justify-between
              rounded-xl
              border
              border-dashed
              border-[#cccccc]
              px-4
              py-4
              transition
              hover:border-[#ff6a00]
            "
          >
            <div>
              <p className="text-[13px] font-bold">
                Upload vehicle photo
              </p>

              <p className="mt-0.5 text-[11px] text-[#999999]">
                Clear photo of the vehicle
              </p>
            </div>

            <span className="text-lg font-bold text-[#ff6a00]">
              +
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setVehiclePhoto(e.target.files?.[0] || null)
              }
              className="hidden"
            />
          </label>

          {vehiclePhoto && (
            <p className="mt-2 truncate text-[11px] text-[#777777]">
              Selected: {vehiclePhoto.name}
            </p>
          )}
        </div>

        {/* Profile Photo */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-[#333333]">
              Profile photo
            </label>

            <span className="text-[10px] font-medium text-[#999999]">
              Optional
            </span>
          </div>

          <label
            className="
              mt-2
              flex
              cursor-pointer
              items-center
              justify-between
              rounded-xl
              border
              border-dashed
              border-[#cccccc]
              px-4
              py-4
              transition
              hover:border-[#ff6a00]
            "
          >
            <div>
              <p className="text-[13px] font-bold">
                Upload profile photo
              </p>

              <p className="mt-0.5 text-[11px] text-[#999999]">
                Helps passengers recognise you
              </p>
            </div>

            <span className="text-lg font-bold text-[#ff6a00]">
              +
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setProfilePhoto(e.target.files?.[0] || null)
              }
              className="hidden"
            />
          </label>

          {profilePhoto && (
            <p className="mt-2 truncate text-[11px] text-[#777777]">
              Selected: {profilePhoto.name}
            </p>
          )}
        </div>

        {/* Referral */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-[#333333]">
              Referral code
            </label>

            <span className="text-[10px] font-medium text-[#999999]">
              Optional
            </span>
          </div>

          <input
            type="text"
            placeholder="Enter referral code"
            value={form.referral_code}
            onChange={(e) =>
              setForm({
                ...form,
                referral_code: e.target.value,
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[#dddddd]
              bg-white
              px-4
              py-3.5
              text-[15px]
              uppercase
              outline-none
              transition
              placeholder:normal-case
              placeholder:text-[#aaaaaa]
              focus:border-[#ff6a00]
            "
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="
            mt-2
            w-full
            rounded-xl
            bg-[#111111]
            px-4
            py-4
            text-[14px]
            font-extrabold
            text-white
            transition
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {submitting
            ? "Submitting application..."
            : "Apply to drive →"}
        </button>

      </section>

      {/* Driver Login */}
      <div className="mt-7 text-center">
        <p className="text-[13px] text-[#777777]">
          Already approved?{" "}
          <a
            href="/driver-login"
            className="font-bold text-[#ff6a00]"
          >
            Driver sign in
          </a>
        </p>
      </div>

    </div>
  </main>
);
}
