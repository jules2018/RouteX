"use client";

import { useState } from "react";

export default function PassengerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const response = await fetch(
      "https://routex-smgu.onrender.com/passenger-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      localStorage.removeItem("driver");
      localStorage.removeItem("user");
      localStorage.setItem(
        "passenger",
        JSON.stringify(data)
      );

      window.location.href =
        "/passenger-portal";
    } else {
      
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-teal-100 p-6">
    <div className="relative w-full max-w-md">

  <div className="absolute inset-0 bg-teal-300/20 blur-3xl rounded-full"></div>

  <div className="relative bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
    
<div className="text-center mb-8">
  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-xl">
  RX
</div>

  <h1 className="text-3xl font-bold text-slate-800">
    RouteX
  </h1>

  <p className="text-sm text-slate-500 mt-2">
    Move People. Manage Operations.
  </p>
</div>
  <h2 className="text-2xl font-semibold text-slate-800 mb-2">
  Welcome Back
</h2>

  <p className="text-sm text-slate-500 mb-6">
    Access your bookings and trip information.
  </p>

  <input
    placeholder="Email"
    value={email}
    onChange={(e) =>
      setEmail(e.target.value)
    }
    className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4"
  />

  <input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) =>
      setPassword(e.target.value)
    }
    className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4"
  />

  <button
    onClick={login}
    className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition"
  >
    Sign In
  </button>

</div>
</div>
    </main>
  );
}