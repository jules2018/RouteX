
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const driver = JSON.parse(
      localStorage.getItem("driver") || "null"
    );

   if (driver) {
  router.push("/driver-portal");
}

  }, [router]);

  const login = async () => {
    if (!phone || !password) {
      alert("Please enter your phone number and password.");
      return;
    }

    setLoading(true);

    try {
     const response = await fetch(
  "https://routex-smgu.onrender.com/driver-login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone,
      password,
    }),
  }
);

      const data = await response.json();
      console.log("Driver login response:", data);

      if (response.ok) {
        localStorage.removeItem("passenger");

        localStorage.setItem(
          "driver",
          JSON.stringify(data)
        );

        window.location.href = "/driver-portal";
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to RouteX. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="w-full max-w-md mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-12">

          <a
            href="/"
            className="inline-block text-3xl font-bold tracking-tight"
          >
            Route<span className="text-teal-600">X</span>
          </a>

          <h1 className="text-3xl font-bold tracking-tight mt-12">
            Welcome back
          </h1>

          <p className="text-slate-500 mt-2">
            Sign in to manage your RouteX trips.
          </p>

        </div>

        {/* Login Form */}
        <div className="space-y-5">

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone number
            </label>

            <input
              type="tel"
              placeholder="e.g. 082 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full h-14 px-4 rounded-xl
              border border-slate-300
              bg-white
              text-slate-900
              placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600
              focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full h-14 px-4 rounded-xl
              border border-slate-300
              bg-white
              text-slate-900
              placeholder:text-slate-400
              outline-none transition
              focus:border-teal-600
              focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Sign In */}
          <button
            onClick={login}
            disabled={loading}
            className="w-full h-14 mt-2 rounded-xl
            bg-teal-600
            hover:bg-teal-700
            disabled:bg-teal-400
            text-white
            font-semibold
            transition duration-200
            active:scale-[0.99]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </div>

        {/* Driver Application */}
        <div className="mt-10 pt-8 border-t border-slate-200 text-center">

          <p className="text-sm text-slate-500">
            Not a RouteX driver yet?
          </p>

          <a
            href="/driver-register"
            className="inline-block mt-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Become a driver
          </a>

        </div>

        {/* Passenger Login */}
        <div className="text-center mt-6">

          <span className="text-sm text-slate-500">
            Looking to book a ride?
          </span>

          <a
            href="/passenger-login"
            className="ml-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Passenger login
          </a>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-12">
          RouteX Driver Portal
        </p>

      </div>
    </main>
  );
}
