
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-md px-6 py-8">

        {/* Header */}
        <div className="mb-10">
          <a
            href="/"
            className="inline-block text-3xl font-bold tracking-tight"
          >
            Route<span className="text-teal-600">X</span>
          </a>

          <h1 className="mt-10 text-3xl font-bold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-slate-500">
            Sign up to book rides with RouteX.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Referral */}
          <div className="pt-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              className="h-14 w-full rounded-xl border border-slate-300
              bg-white px-4 text-slate-900 placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 h-14 w-full rounded-xl
            bg-teal-600 font-semibold text-white
            transition duration-200
            hover:bg-teal-700
            disabled:cursor-not-allowed
            disabled:bg-teal-400
            active:scale-[0.99]"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Login */}
        <div className="mt-8 text-center">
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
        <p className="mt-10 text-center text-xs text-slate-400">
          By creating an account, you agree to use RouteX responsibly.
        </p>

      </div>
    </main>
  );
}
