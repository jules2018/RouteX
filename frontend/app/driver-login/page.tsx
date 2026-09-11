
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
  "https://routex-1-z1hf.onrender.com/driver-login",
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
  <main className="min-h-screen bg-white text-[#111111]">
    <div className="mx-auto w-full max-w-md px-5 py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <a
          href="/"
          className="text-[24px] font-extrabold tracking-tight"
        >
          Route<span className="text-[#ff6a00]">X</span>
        </a>

        <span
          className="
            rounded-full
            bg-[#fff3e8]
            px-3
            py-1.5
            text-[10px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-[#ff6a00]
          "
        >
          Driver
        </span>
      </div>


      {/* INTRO */}
      <div className="mt-12">
        <div className="mb-4 h-1 w-10 rounded-full bg-[#ff6a00]" />

        <h1 className="text-[30px] font-extrabold tracking-tight">
          Welcome back
        </h1>

        <p className="mt-2 text-[14px] leading-6 text-[#777777]">
          Sign in to manage your rides and availability.
        </p>
      </div>


      {/* LOGIN CARD */}
      <div
        className="
          mt-8
          rounded-[22px]
          border
          border-[#eeeeee]
          bg-white
          p-5
          shadow-[0_12px_35px_rgba(0,0,0,0.05)]
        "
      >

        <div className="space-y-5">

          {/* PHONE */}
          <div>
            <label className="mb-2 block text-[12px] font-bold text-[#444444]">
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
              className="
                h-14
                w-full
                rounded-xl
                border
                border-[#dddddd]
                bg-white
                px-4
                text-[14px]
                text-[#111111]
                outline-none
                transition
                placeholder:text-[#aaaaaa]
                focus:border-[#ff6a00]
                focus:ring-2
                focus:ring-[#ff6a00]/10
              "
            />
          </div>


          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-[12px] font-bold text-[#444444]">
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
              className="
                h-14
                w-full
                rounded-xl
                border
                border-[#dddddd]
                bg-white
                px-4
                text-[14px]
                text-[#111111]
                outline-none
                transition
                placeholder:text-[#aaaaaa]
                focus:border-[#ff6a00]
                focus:ring-2
                focus:ring-[#ff6a00]/10
              "
            />
          </div>


          {/* SIGN IN */}
          <button
            onClick={login}
            disabled={loading}
            className="
              mt-1
              flex
              h-14
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[#111111]
              text-[14px]
              font-bold
              text-white
              transition
              hover:bg-[#222222]
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>

        </div>
      </div>


      {/* BECOME A DRIVER */}
      <div className="mt-8 text-center">
        <p className="text-[13px] text-[#777777]">
          Not a RouteX driver yet?{" "}
          <a
            href="/driver-register"
            className="font-bold text-[#ff6a00]"
          >
            Become a driver
          </a>
        </p>
      </div>


      {/* PASSENGER */}
      <div className="mt-4 text-center">
        <p className="text-[13px] text-[#777777]">
          Looking to book a ride?{" "}
          <a
            href="/passenger-login"
            className="font-bold text-[#111111] hover:text-[#ff6a00]"
          >
            Passenger login
          </a>
        </p>
      </div>


      {/* FOOTER */}
      <p className="mt-12 text-center text-[10px] font-medium text-[#aaaaaa]">
        RouteX Driver Portal
      </p>

    </div>
  </main>
);
}
