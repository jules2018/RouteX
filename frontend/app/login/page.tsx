"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(
      "https://routex-smgu.onrender.com/login",
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
      localStorage.removeItem("passenger");
      localStorage.removeItem("driver");
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      router.push("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            RouteX
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            
Connecting Drivers, Passengers and Fleet Operations

          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-800">
              Welcome Back
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Manage trips, drivers, passengers and fleet operations.
            </p>
          </div>

          <form
            onSubmit={login}
            className="flex flex-col gap-4"
          >
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-500 bg-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-500 bg-white"
            />

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </main>
  );

}
