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

        {/* HEADER */}
        <header className="flex items-center justify-between py-5">

          <a
            href="/"
            className="text-[26px] font-extrabold tracking-[-0.06em]"
          >
            <span className="text-[#111111]">Route</span>
            <span className="text-teal-600">X</span>
          </a>

          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999999]">
            Passenger
          </span>

        </header>


        {/* MAIN CONTENT */}
        <section className="flex flex-1 flex-col justify-center pb-10">

          {/* HERO */}
          <div>

          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
  Your ride starts here
</p>

          <h1
  key={messageIndex}
  className="
    mt-3
    min-h-[44px]
    text-[30px]
    font-bold
    leading-[1.08]
    tracking-[-0.045em]
  "
>
  {messages[messageIndex]}
</h1>

           <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#666666]">
  Sign in and get moving with RouteX.
</p>

          </div>


          {/* ROUTE ANIMATION */}
          <div className="relative mt-9 h-[95px]">

            {/* Route line */}
            <div className="absolute left-3 right-3 top-[47px] h-[2px] bg-[#e8e8e8]" />

            {/* Start point */}
            <div className="absolute left-0 top-[38px]">

              <div className="h-[18px] w-[18px] rounded-full border-[5px] border-[#111111] bg-white" />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#999999]">
                You
              </p>

            </div>


            {/* Destination */}
            <div className="absolute right-0 top-[38px] flex flex-col items-end">

              <div className="h-[18px] w-[18px] rounded-full border-[5px] border-teal-600 bg-white" />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#999999]">
                Destination
              </p>

            </div>


            {/* Moving car */}
            <div
              className="
                absolute
                left-[22px]
                top-[24px]
                animate-[routeCar_5s_ease-in-out_infinite]
              "
            >
             <div className="scale-110">
  <CarIcon />
</div>
            </div>

          </div>


          {/* LOGIN CARD */}
          <div className="mt-8">

            <h2 className="text-[22px] font-extrabold tracking-[-0.04em]">
              Welcome back
            </h2>

            <p className="mt-2 text-[13px] font-medium text-[#777777]">
              Sign in to access your bookings.
            </p>


            {/* EMAIL */}
            <div className="mt-7">

              <label className="mb-2 block text-[12px] font-bold text-[#333333]">
                Email
              </label>

             <input
  type="email"
  inputMode="email"
  autoComplete="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="
    h-[56px]
    w-full
    rounded-[14px]
    border
    border-transparent
    bg-[#f4f4f4]
    px-4
    text-[15px]
    font-medium
    text-[#111111]
    outline-none
    transition
    placeholder:text-[#999999]
    focus:border-[#111111]
    focus:bg-white
  "
/>

            </div>


            {/* PASSWORD */}
            <div className="mt-4">

              <label className="mb-2 block text-[12px] font-bold text-[#333333]">
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
  h-[56px]
  w-full
  rounded-[14px]
  border
  border-transparent
  bg-[#f4f4f4]
  px-4
  text-[15px]
  font-medium
  text-[#111111]
  outline-none
  transition
  placeholder:text-[#999999]
  focus:border-[#111111]
  focus:bg-white
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
                h-[56px]
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-[14px]
                bg-[#111111]
                px-4
                text-[15px]
                font-extrabold
                text-white
                transition
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-80
              "
            >

              {loading ? (
                <div className="flex items-center gap-3">

                  <div className="animate-[loadingCar_1.2s_ease-in-out_infinite]">
                    <SmallCarIcon />
                  </div>

                  <span>Signing in...</span>

                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Continue</span>
                  <span className="text-[18px]">→</span>
                </div>
              )}

            </button>


            {/* REGISTER */}
            <div className="mt-7 text-center">

              <p className="text-[13px] font-medium text-[#777777]">
                New to RouteX?
              </p>

              <a
                href="/passenger-register"
                className="
                  mt-1
                  inline-block
                  text-[13px]
                  font-extrabold
                  text-[#111111]
                  underline
                  underline-offset-4
                "
              >
                Create an account
              </a>

            </div>

          </div>

        </section>


        {/* FOOTER */}
        <footer className="pb-6 text-center">

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bbbbbb]">
            Getting Upington Moving
          </p>

        </footer>

      </div>


      {/* PAGE ANIMATIONS */}
     
    </main>
  );
}


/* =================================
   ROUTEX CAR ICON
================================= */

function CarIcon() {
  return (
    <svg
      width="58"
      height="30"
      viewBox="0 0 58 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <path
        d="M6 19C6 17.5 7 16.3 8.5 15.8L13.5 14L18 8.5C19.2 7 21 6 23 6H34C36.2 6 38.3 6.9 39.8 8.5L45 14L50 15.5C51.8 16 53 17.5 53 19.3V22H49.5C49.2 18.8 46.8 16.5 43.5 16.5C40.2 16.5 37.8 18.8 37.5 22H20.5C20.2 18.8 17.8 16.5 14.5 16.5C11.2 16.5 8.8 18.8 8.5 22H5V20C5 19.6 5.3 19.2 6 19Z"
        fill="#111111"
      />

      {/* Windows */}
      <path
        d="M20 9H26V14H16.2L20 9Z"
        fill="white"
      />

      <path
        d="M28 9H34C35.5 9 36.7 9.5 37.8 10.7L40.8 14H28V9Z"
        fill="white"
      />

      {/* Wheels */}
      <circle cx="14.5" cy="22" r="4.5" fill="#111111" />
      <circle cx="43.5" cy="22" r="4.5" fill="#111111" />

      <circle cx="14.5" cy="22" r="2" fill="white" />
      <circle cx="43.5" cy="22" r="2" fill="white" />

      {/* Small headlight */}
      <rect
        x="48"
        y="16"
        width="3"
        height="1.5"
        rx="0.75"
        fill="white"
      />
    </svg>
  );
}

function SmallCarIcon() {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 52 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 18L11 11C12 9 14 8 17 8H31C34 8 36 9 38 11L42 18H45C47 18 48 19 48 21V23H44C44 20 42 18 39 18C36 18 34 20 34 23H18C18 20 16 18 13 18C10 18 8 20 8 23H4V21C4 19 5 18 8 18Z"
        fill="white"
      />

      <circle cx="13" cy="23" r="4" fill="white" />
      <circle cx="39" cy="23" r="4" fill="white" />

      <circle cx="13" cy="23" r="1.7" fill="#111111" />
      <circle cx="39" cy="23" r="1.7" fill="#111111" />
    </svg>
  );
}