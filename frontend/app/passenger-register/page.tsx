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
    <main className="p-6 min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 border border-slate-200">


        <h1 className="text-3xl font-bold mb-2 text-slate-900">

Create Account

</h1>

        <p className="text-slate-700 mb-6">
          Join RouteX and book your next ride.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >

          <input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
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
            className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
          />
<input
  type="password"
  placeholder="Password"
  value={form.password}
  onChange={(e) =>
    setForm({
      ...form,
      password: e.target.value,
    })
  }
  className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
/>
          <input
  type="password"
  placeholder="Confirm Password"
  value={form.confirmPassword}
  onChange={(e) =>
    setForm({
      ...form,
      confirmPassword: e.target.value,
    })
  }
  className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
/>

<input
  type="text"
  placeholder="Referral Code (Optional)"
  value={form.referral_code}
  onChange={(e) =>
    setForm({
      ...form,
      referral_code: e.target.value,
    })
  }
  className="border border-slate-300 rounded-xl p-3 shadow-sm text-slate-900 placeholder:text-slate-500 bg-white"
/>

<button
  type="submit"
  disabled={loading}
  className="bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-md transition"
>
  {loading ? "Creating Account..." : "Create Account"}
</button>

<p className="text-center text-sm text-slate-700">
  Already have an account?
</p>

<a href="/passenger-login"
  className="text-blue-600 text-center font-semibold hover:underline">
  Login
</a>
        </form>

      </div>
    </main>
  );
}