"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const messages = [
  "Where to today?",
  "Heading to work?",
  "Need a quick ride?",
  "Let's get you there.",
];

export default function PassengerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const passenger = JSON.parse(
      localStorage.getItem("passenger") || "null"
    );

    if (passenger) {
      router.push("/passenger-portal");
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://routex-1-z1hf.onrender.com/passenger-login",
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
        localStorage.removeItem("passenger");

        localStorage.setItem(
          "passenger",
          JSON.stringify(data)
        );

        window.location.href = "/passenger-portal";
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Unable to connect to RouteX.");
    } finally {
      setLoading(false);
    }
  };

 return (
  <main
    className={`${jakarta.variable} min-h-[100dvh] bg-white text-[#111111]`}
    style={{
      fontFamily: "var(--font-jakarta)",
    }}
  >
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">

      {/* =================================
          HEADER
      ================================= */}
      <header className="flex items-center justify-between py-5">

        <a
          href="/"
          className="text-[24px] font-extrabold tracking-[-0.055em]"
        >
          Route<span className="text-[#ff6a00]">X</span>
        </a>

        <span
          className="
            text-[9px]
            font-extrabold
            uppercase
            tracking-[0.14em]
            text-[#999999]
          "
        >
          Passenger
        </span>

      </header>


      {/* =================================
          MAIN
      ================================= */}
      <section className="flex flex-1 flex-col justify-center pb-8">

        {/* INTRO */}
        <div className="mb-6">

          <div
            className="
              mb-3
              h-1
              w-8
              rounded-full
              bg-[#ff6a00]
            "
          />

          <h1
            className="
              text-[26px]
              font-extrabold
              leading-tight
              tracking-[-0.045em]
            "
          >
            Welcome back
          </h1>

          <p
            className="
              mt-2
              text-[13px]
              font-medium
              text-[#777777]
            "
          >
            Sign in to book and manage your rides.
          </p>

        </div>


        {/* =================================
            LOGIN CARD
        ================================= */}
        <div
          className="
            rounded-[22px]
            border
            border-[#eeeeee]
            bg-white
            p-5
            shadow-[0_8px_30px_rgba(0,0,0,0.04)]
          "
        >

          {/* EMAIL */}
          <div>

            <label
              className="
                mb-2
                block
                text-[11px]
                font-bold
                text-[#333333]
              "
            >
              Email address
            </label>

            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                h-[50px]
                w-full
                rounded-[12px]
                border
                border-[#dedede]
                bg-white
                px-4
                text-[14px]
                font-medium
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
          <div className="mt-4">

            <label
              className="
                mb-2
                block
                text-[11px]
                font-bold
                text-[#333333]
              "
            >
              Password
            </label>

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="
                h-[50px]
                w-full
                rounded-[12px]
                border
                border-[#dedede]
                bg-white
                px-4
                text-[14px]
                font-medium
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


          {/* LOGIN BUTTON */}
          <button
            onClick={login}
            disabled={loading}
            className="
              mt-5
              flex
              h-[50px]
              w-full
              items-center
              justify-center
              rounded-[12px]
              bg-[#111111]
              text-[13px]
              font-extrabold
              text-white
              transition
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              "Signing in..."
            ) : (
              <span className="flex items-center gap-2">
                Sign in
                <span className="text-[16px]">→</span>
              </span>
            )}
          </button>

        </div>


        {/* =================================
            REGISTER
        ================================= */}
        <div
          className="
            mt-5
            flex
            items-center
            justify-center
            gap-1.5
            text-[12px]
          "
        >

          <span className="font-medium text-[#888888]">
            Don't have an account?
          </span>

          <a
            href="/passenger-register"
            className="font-extrabold text-[#ff6a00]"
          >
            Register
          </a>

        </div>

      </section>


      {/* =================================
          FOOTER
      ================================= */}
      <footer className="pb-5 text-center">

        <p className="text-[10px] font-medium text-[#b0b0b0]">
          RouteX • Getting Upington Moving
        </p>

      </footer>

    </div>
  </main>
);
}