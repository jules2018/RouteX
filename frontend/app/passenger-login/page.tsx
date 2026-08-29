"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function PassengerLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const passenger = JSON.parse(
      localStorage.getItem("passenger") || "null"
    );

    if (passenger) {
      router.push("/passenger-portal");
    }
  }, [router]);

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
      localStorage.removeItem("passenger");

      localStorage.setItem(
        "passenger",
        JSON.stringify(data)
      );

      window.location.href = "/passenger-portal";
    } else {
      alert(data.error);
    }
  };

  return (
    <main
      className={`${jakarta.variable} min-h-[100dvh] bg-white text-[#111111]`}
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5">

        {/* ================================
            HEADER
        ================================= */}
        <header className="flex items-center py-5">

          <a
            href="/"
            className="text-[25px] font-extrabold tracking-[-0.06em]"
          >
            <span className="text-[#111111]">Route</span>
            <span className="text-teal-600">X</span>
          </a>

        </header>


        {/* ================================
            LOGIN
        ================================= */}
        <section className="flex flex-1 items-center">

          <div className="w-full">

            {/* RX Icon */}
            <div
              className="
                mb-6
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-[15px]
                bg-[#111111]
                text-[14px]
                font-extrabold
                text-white
              "
            >
              RX
            </div>


            {/* Heading */}
            <h1
              className="
                text-[32px]
                font-extrabold
                leading-[1.05]
                tracking-[-0.055em]
              "
            >
              Welcome back
            </h1>

            <p
              className="
                mt-3
                text-[14px]
                font-medium
                leading-relaxed
                text-[#6b6b6b]
              "
            >
              Access your bookings and trip information.
            </p>


            {/* ================================
                FORM
            ================================= */}
            <div className="mt-8">

              {/* Email */}
              <div className="mb-4">

                <label
                  className="
                    mb-2
                    block
                    text-[12px]
                    font-bold
                    text-[#333333]
                  "
                >
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="
                    w-full
                    rounded-[14px]
                    border
                    border-[#dddddd]
                    bg-white
                    px-4
                    py-3.5
                    text-[14px]
                    font-medium
                    text-[#111111]
                    outline-none
                    transition
                    placeholder:text-[#999999]
                    focus:border-[#111111]
                  "
                />

              </div>


              {/* Password */}
              <div className="mb-4">

                <label
                  className="
                    mb-2
                    block
                    text-[12px]
                    font-bold
                    text-[#333333]
                  "
                >
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="
                    w-full
                    rounded-[14px]
                    border
                    border-[#dddddd]
                    bg-white
                    px-4
                    py-3.5
                    text-[14px]
                    font-medium
                    text-[#111111]
                    outline-none
                    transition
                    placeholder:text-[#999999]
                    focus:border-[#111111]
                  "
                />

              </div>


              {/* Sign In */}
              <button
                onClick={login}
                className="
                  mt-2
                  w-full
                  rounded-[14px]
                  bg-[#111111]
                  py-3.5
                  text-[14px]
                  font-extrabold
                  text-white
                  transition
                  hover:bg-[#222222]
                  active:scale-[0.98]
                "
              >
                Sign In
              </button>

            </div>


            {/* ================================
                REGISTER
            ================================= */}
            <div className="mt-6 text-center">

              <p
                className="
                  text-[13px]
                  font-medium
                  text-[#777777]
                "
              >
                Don't have an account?
              </p>

              <a
                href="/passenger-register"
                className="
                  mt-1
                  inline-block
                  text-[13px]
                  font-extrabold
                  text-teal-600
                  transition
                  hover:text-teal-700
                "
              >
                Create Account
              </a>

            </div>

          </div>

        </section>


        {/* ================================
            FOOTER
        ================================= */}
        <footer className="pb-6 text-center">

          <p
            className="
              text-[11px]
              font-medium
              text-[#aaaaaa]
            "
          >
            Getting Upington Moving
          </p>

        </footer>

      </div>
    </main>
  );
}