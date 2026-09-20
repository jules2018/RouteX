"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

type NoticeType = "error" | "success";

export default function PassengerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState<{
    message: string;
    type: NoticeType;
  } | null>(null);

  // =========================================
  // EXISTING PASSENGER SESSION
  // =========================================

  useEffect(() => {
    const passenger = JSON.parse(
      localStorage.getItem("passenger") || "null"
    );

    if (passenger) {
      router.push("/passenger-portal");
    }
  }, [router]);

  // =========================================
  // ROUTEX NOTICE
  // =========================================

  const showNotice = (
    message: string,
    type: NoticeType = "error"
  ) => {
    setNotice({
      message,
      type,
    });

    window.setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

  // =========================================
  // REAL ROUTEX LOGIN
  // =========================================

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      showNotice("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/passenger-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotice(
          data.error || "Unable to sign in."
        );
        return;
      }

      // Make sure only the passenger session remains
      localStorage.removeItem("driver");
      localStorage.removeItem("user");
      localStorage.removeItem("passenger");

      localStorage.setItem(
        "passenger",
        JSON.stringify(data)
      );

      showNotice(
        "Login successful.",
        "success"
      );

      window.setTimeout(() => {
        window.location.href = "/passenger-portal";
      }, 500);

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      showNotice(
        "Unable to connect to RouteX."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[#e7e9ee] text-[#17191f]">

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden px-5 pb-5 pt-4">

        {/* BACKGROUND */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-28 -top-28 h-[270px] w-[270px] rounded-full bg-[#ff6846]/10 blur-[90px]" />

          <div className="absolute -bottom-28 -left-28 h-[280px] w-[280px] rounded-full bg-white/70 blur-[90px]" />
        </div>

        {/* =========================================
            ROUTEX IN-APP NOTICE
        ========================================= */}

        <div
          className={`
            pointer-events-none
            fixed
            left-1/2
            top-5
            z-[999]
            w-[calc(100%-40px)]
            max-w-[390px]
            -translate-x-1/2
            transition-all
            duration-300
            ${
              notice
                ? "translate-y-0 opacity-100"
                : "-translate-y-5 opacity-0"
            }
          `}
        >
          {notice && (
            <div
              className="
                flex
                items-center
                gap-3
                rounded-[18px]
                bg-[#e7e9ee]
                px-4
                py-3.5
                shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]
              "
            >
              {/* STATUS CIRCLE */}

              <div
                className="
                  flex h-9 w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#e7e9ee]
                  shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]
                "
              >
                <span
                  className={`
                    h-[8px]
                    w-[8px]
                    rounded-full
                    ${
                      notice.type === "success"
                        ? "bg-[#22c55e]"
                        : "bg-[#ff6846]"
                    }
                  `}
                />
              </div>

              {/* MESSAGE */}

              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#9a9da5]">
                  {notice.type === "success"
                    ? "Success"
                    : "RouteX"}
                </p>

                <p className="mt-[2px] text-[11px] font-semibold text-[#17191f]">
                  {notice.message}
                </p>
              </div>

              <span
                className={`
                  text-[17px]
                  font-semibold
                  ${
                    notice.type === "success"
                      ? "text-[#22c55e]"
                      : "text-[#ff6846]"
                  }
                `}
              >
                {notice.type === "success"
                  ? "✓"
                  : "!"}
              </span>
            </div>
          )}
        </div>

        {/* =========================================
            HEADER
        ========================================= */}

        <header className="relative z-20 flex items-center justify-between">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[24px] font-bold tracking-[-0.055em]"
          >
            Route<span className="text-[#ff6846]">X</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-[14px]
              bg-[#e7e9ee]
              text-[17px]
              text-[#ff6846]
              shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff]
              transition-all
              active:scale-95
              active:shadow-[inset_3px_3px_7px_#c4c6ca,inset_-3px_-3px_7px_#ffffff]
            "
          >
            ←
          </button>

        </header>

        {/* =========================================
            MAIN
        ========================================= */}

        <div className="relative z-20 flex flex-1 flex-col justify-center">

          {/* ROUTEX MARK */}

          <div className="mb-6 flex justify-center">
            <div
              className="
                flex h-[82px] w-[82px]
                items-center justify-center
                rounded-[25px]
                bg-[#e7e9ee]
                shadow-[7px_7px_16px_#c4c6ca,-7px_-7px_16px_#ffffff]
              "
            >
              <div
                className="
                  flex h-[56px] w-[56px]
                  items-center justify-center
                  rounded-full
                  bg-[#e7e9ee]
                  shadow-[inset_4px_4px_8px_#c5c7cc,inset_-4px_-4px_8px_#ffffff]
                "
              >
                <span className="text-[30px] font-semibold tracking-[-0.08em] text-[#ff6846]">
                  X
                </span>
              </div>
            </div>
          </div>

          {/* INTRO */}

          <div className="mb-5 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#ff6846]">
              Passenger
            </p>

            <h1 className="mt-1.5 text-[29px] font-semibold tracking-[-0.05em]">
              Welcome back.
            </h1>

            <p className="mt-2 text-[10px] font-medium text-[#7d8088]">
              Sign in to continue with RouteX.
            </p>
          </div>

          {/* =========================================
              LOGIN CARD
          ========================================= */}

          <div
            className="
              rounded-[27px]
              bg-[#e7e9ee]
              p-5
              shadow-[8px_8px_18px_#c3c5ca,-8px_-8px_18px_#ffffff]
            "
          >

            {/* EMAIL */}

            <div>
              <label className="mb-2 block pl-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#989ba3]">
                Email address
              </label>

              <div
                className="
                  flex h-[52px]
                  items-center
                  rounded-[16px]
                  bg-[#e7e9ee]
                  px-4
                  shadow-[inset_4px_4px_8px_#c5c7cc,inset_-4px_-4px_8px_#ffffff]
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-3 h-[16px] w-[16px] shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6.5h16v11H4v-11Z"
                    stroke="#8f9299"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />

                  <path
                    d="m4.5 7 7.5 6 7.5-6"
                    stroke="#8f9299"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="
                    h-full
                    min-w-0
                    flex-1
                    bg-transparent
                    text-[12px]
                    font-medium
                    text-[#17191f]
                    outline-none
                    placeholder:text-[#9b9ea5]
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="mt-4">
              <label className="mb-2 block pl-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#989ba3]">
                Password
              </label>

              <div
                className="
                  flex h-[52px]
                  items-center
                  rounded-[16px]
                  bg-[#e7e9ee]
                  px-4
                  shadow-[inset_4px_4px_8px_#c5c7cc,inset_-4px_-4px_8px_#ffffff]
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-3 h-[16px] w-[16px] shrink-0"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="#8f9299"
                    strokeWidth="1.7"
                  />

                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="#8f9299"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      login();
                    }
                  }}
                  className="
                    h-full
                    min-w-0
                    flex-1
                    bg-transparent
                    text-[12px]
                    font-medium
                    text-[#17191f]
                    outline-none
                    placeholder:text-[#9b9ea5]
                  "
                />

                {/* SHOW / HIDE PASSWORD */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    ml-2
                    flex h-8 w-8
                    shrink-0
                    items-center justify-center
                    rounded-[10px]
                    bg-[#e7e9ee]
                    text-[#8f9299]
                    shadow-[3px_3px_6px_#c5c7cc,-3px_-3px_6px_#ffffff]
                    transition-all
                    active:scale-95
                    active:shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]
                  "
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[15px] w-[15px]"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <path
                        d="M10.6 10.7a2 2 0 0 0 2.7 2.7"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <path
                        d="M9.5 5.4A9.5 9.5 0 0 1 12 5c5 0 8.5 4.2 9 7-.2 1.1-.9 2.4-2 3.6M6.2 6.2C4.4 7.5 3.3 9.3 3 12c.5 2.8 4 7 9 7 1.4 0 2.7-.3 3.8-.8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[15px] w-[15px]"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* SIGN IN */}

            <button
              type="button"
              onClick={login}
              disabled={loading}
              className="
                mt-5
                flex h-[52px]
                w-full
                items-center
                justify-between
                rounded-[16px]
                bg-[#ff6846]
                px-5
                text-white
                shadow-[5px_5px_11px_#c0c2c7,-4px_-4px_10px_#ffffff]
                transition-all
                active:scale-[0.985]
                active:shadow-[inset_4px_4px_8px_#d94e31,inset_-3px_-3px_7px_#ff8c72]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <span className="text-[11px] font-semibold">
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </span>

              {!loading && (
                <span className="text-[16px]">
                  →
                </span>
              )}
            </button>

          </div>

          {/* CREATE ACCOUNT */}

          <div className="mt-5 text-center">
            <p className="text-[9px] font-medium text-[#8f9299]">
              New to RouteX?
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/passenger-register")
              }
              className="
                mt-2
                inline-flex
                h-[38px]
                items-center
                justify-center
                rounded-[12px]
                bg-[#e7e9ee]
                px-5
                text-[9px]
                font-semibold
                text-[#ff6846]
                shadow-[4px_4px_8px_#c4c6ca,-4px_-4px_8px_#ffffff]
                transition-all
                active:scale-95
                active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]
              "
            >
              Create an account
            </button>
          </div>

        </div>

        {/* FOOTER */}

        <footer className="relative z-20 mt-auto border-t border-[#d1d3d8] pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[7px] font-semibold text-[#a0a3aa]">
              RouteX · Upington
            </p>

            <div className="flex gap-3 text-[7px] font-semibold text-[#999ca4]">
              <a href="/privacy">
                Privacy
              </a>

              <a href="/terms">
                Terms
              </a>
            </div>
          </div>
        </footer>

      </section>
    </main>
  );
}