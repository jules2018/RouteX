
"use client";

import { useState } from "react";

export default function PassengerRegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referral_code: "",
  });

  const [loading, setLoading] = useState(false);
  
  const handlePhoneChange = (value: string) => {
  const cleaned = value.replace(/\s/g, "");

  setForm((prev) => ({
    ...prev,
    phone: cleaned,
  }));
};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://routex-1-z1hf.onrender.com/passenger-register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.full_name,
            phone: form.phone,
            email: form.email,
            password: form.password,
            referral_code: form.referral_code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      alert("Account created successfully");

      window.location.href = "/passenger-login";
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
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
          Passenger
        </span>
      </div>

      {/* Intro */}
      <section className="mt-10">
        <div className="h-1 w-8 rounded-full bg-[#ff6a00]" />

        <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">
          Create your account
        </h1>

        <p className="mt-2 text-[14px] leading-6 text-[#777777]">
          Join RouteX and start booking local rides in Upington.
        </p>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">

        {/* Full Name */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Full name
          </label>

          <input
            type="text"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            placeholder="Your full name"
            required
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
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="0821234567"
            inputMode="numeric"
            autoComplete="tel"
            required
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

        {/* Email */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Email address
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            placeholder="you@example.com"
            required
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

        {/* Password */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Password
          </label>

          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            placeholder="Create a password"
            required
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

        {/* Confirm Password */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Confirm password
          </label>

          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Repeat your password"
            required
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

        {/* Referral */}
        <div>
          <label className="text-[12px] font-bold text-[#333333]">
            Referral code
            <span className="ml-1 font-medium text-[#999999]">
              Optional
            </span>
          </label>

          <input
            type="text"
            value={form.referral_code}
            onChange={(e) =>
              setForm({
                ...form,
                referral_code: e.target.value,
              })
            }
            placeholder="Enter referral code"
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

        {/* Create Account */}
        <button
          type="submit"
          disabled={loading}
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
            disabled:opacity-60
          "
        >
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>

      {/* Login */}
      <div className="mt-7 text-center">
        <p className="text-[13px] text-[#777777]">
          Already have an account?{" "}
          <a
            href="/passenger-login"
            className="font-bold text-[#ff6a00]"
          >
            Sign in
          </a>
        </p>
      </div>

    </div>
  </main>
);
}
