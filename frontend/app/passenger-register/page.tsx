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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://routex-smgu.onrender.com/passenger-register",
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
      console.error(error);
      alert("Registration failed");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="w-full max-w-md mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-10">
          <a
            href="/"
            className="inline-block text-3xl font-bold tracking-tight"
          >
            Route<span className="text-teal-600">X</span>
          </a>

          <h1 className="text-3xl font-bold tracking-tight mt-10">
            Create your account
          </h1>

          <p className="text-slate-500 mt-2">
            Sign up to book rides with RouteX.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={form.full_name}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  full_name: e.target.value,
                })
              }
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone number
            </label>

            <input
              type="tel"
              placeholder="e.g. 082 123 4567"
              value={form.phone}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              value={form.password}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm password
            </label>

            <input
              type="password"
              placeholder="Enter your password again"
              value={form.confirmPassword}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Referral */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Referral code
              <span className="font-normal text-slate-400"> (optional)</span>
            </label>

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
              className="w-full h-14 px-4 rounded-xl border border-slate-300
              bg-white text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-4 rounded-xl
            bg-teal-600 hover:bg-teal-700
            disabled:bg-teal-400
            text-white font-semibold
            transition duration-200
            active:scale-[0.99]"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

        </form>

        {/* Login */}
        <div className="text-center mt-8">
          <span className="text-sm text-slate-500">
            Already have an account?
          </span>

          <a
            href="/passenger-login"
            className="ml-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Log in
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-10">
          By creating an account, you agree to use RouteX responsibly.
        </p>

      </div>
    </main>
  );
}