"use client";

import { useState } from "react";

export default function PassengerRegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
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
    <main className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">

        <h1 className="text-3xl font-bold mb-2">
          Create Account
        </h1>

        <p className="text-slate-500 mb-6">
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
            className="border rounded-xl p-3 shadow-sm"
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
            className="border rounded-xl p-3 shadow-sm"
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
            className="border rounded-xl p-3 shadow-sm"
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
            className="border rounded-xl p-3 shadow-sm"
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
            className="border rounded-xl p-3 shadow-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

<p className="text-center text-sm text-slate-600">
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