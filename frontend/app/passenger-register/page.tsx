"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

type NoticeType = "error" | "success";

export default function PassengerRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referral_code: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState<{
    message: string;
    type: NoticeType;
  } | null>(null);

  /* =========================================
     UPDATE FORM
  ========================================== */

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =========================================
     ROUTEX NOTICE
  ========================================== */

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

  /* =========================================
     REGISTER
  ========================================== */

 const register = async () => {
  if (
    !form.full_name.trim() ||
    !form.phone.trim() ||
    !form.email.trim() ||
    !form.password ||
    !form.confirmPassword
  ) {
    showNotice("Please complete all required fields.");
    return;
  }

  if (!/^\d+$/.test(form.phone)) {
    showNotice("Phone number must contain numbers only.");
    return;
  }

  if (!form.email.includes("@")) {
    showNotice("Please enter a valid email address.");
    return;
  }

  if (form.password.length < 6) {
    showNotice("Password must be at least 6 characters.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    showNotice("Your passwords do not match.");
    return;
  }

  if (!acceptedTerms || !acceptedPrivacy) {
    showNotice(
      "Please accept the Terms and Privacy Policy."
    );
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/passenger-register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
          referral_code: form.referral_code.trim(),
          acceptedTerms,
          acceptedPrivacy,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showNotice(
        data.error || "Registration failed."
      );
      return;
    }

    showNotice(
      "Your RouteX account is ready.",
      "success"
    );

    window.setTimeout(() => {
      window.location.href = "/passenger-login";
    }, 1000);

  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    showNotice(
      "Unable to create your RouteX account. Please try again."
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
            ROUTEX NOTICE
        ========================================== */}

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

            <div className="flex items-center gap-3 rounded-[18px] bg-[#e7e9ee] px-4 py-3.5 shadow-[7px_7px_16px_#c3c5ca,-7px_-7px_16px_#ffffff]">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff]">

                <span
                  className={`h-[8px] w-[8px] rounded-full ${
                    notice.type === "success"
                      ? "bg-[#22c55e]"
                      : "bg-[#ff6846]"
                  }`}
                />

              </div>


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
                className={`text-[17px] font-semibold ${
                  notice.type === "success"
                    ? "text-[#22c55e]"
                    : "text-[#ff6846]"
                }`}
              >
                {notice.type === "success" ? "✓" : "!"}
              </span>

            </div>

          )}

        </div>


        {/* =========================================
            HEADER
        ========================================== */}

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
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7e9ee] text-[17px] text-[#ff6846] shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff] transition-all active:scale-95 active:shadow-[inset_3px_3px_7px_#c4c6ca,inset_-3px_-3px_7px_#ffffff]"
          >
            ←
          </button>

        </header>


        {/* =========================================
            INTRO
        ========================================== */}

        <div className="relative z-20 mt-7">

          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#ff6846]">
            Passenger
          </p>

          <h1 className="mt-1.5 text-[29px] font-semibold tracking-[-0.05em]">
            Join RouteX.
          </h1>

          <p className="mt-2 text-[10px] font-medium text-[#7d8088]">
            Create your account and get moving.
          </p>

        </div>


        {/* =========================================
            REGISTER CARD
        ========================================== */}

        <div className="relative z-20 mt-6 rounded-[27px] bg-[#e7e9ee] p-5 shadow-[8px_8px_18px_#c3c5ca,-8px_-8px_18px_#ffffff]">

          {/* FULL NAME */}

          <FieldLabel>
            Full name
          </FieldLabel>

          <NeoInput>
            <PersonIcon />

            <input
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.full_name}
              onChange={(e) =>
                updateField(
                  "full_name",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </NeoInput>


          {/* PHONE */}

          <div className="mt-4">

            <FieldLabel>
              Phone number
            </FieldLabel>

            <NeoInput>

              <PhoneIcon />

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0821234567"
                value={form.phone}
                onChange={(e) => {
                  const digits =
                    e.target.value.replace(/\D/g, "");

                  updateField(
                    "phone",
                    digits
                  );
                }}
                className={inputClass}
              />

            </NeoInput>

          </div>


          {/* EMAIL */}

          <div className="mt-4">

            <FieldLabel>
              Email address
            </FieldLabel>

            <NeoInput>

              <EmailIcon />

              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
                className={inputClass}
              />

            </NeoInput>

          </div>


          {/* PASSWORD */}

          <div className="mt-4">

            <FieldLabel>
              Password
            </FieldLabel>

            <NeoInput>

              <LockIcon />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={(e) =>
                  updateField(
                    "password",
                    e.target.value
                  )
                }
                className={inputClass}
              />


              <EyeButton
                visible={showPassword}
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
              />

            </NeoInput>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="mt-4">

            <FieldLabel>
              Confirm password
            </FieldLabel>

            <NeoInput>

              <LockIcon />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateField(
                    "confirmPassword",
                    e.target.value
                  )
                }
                className={inputClass}
              />


              <EyeButton
                visible={showConfirmPassword}
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
              />

            </NeoInput>

          </div>


          {/* REFERRAL */}

          <div className="mt-4">

            <div className="mb-2 flex items-center justify-between px-1">

              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#989ba3]">
                Referral code
              </span>

              <span className="text-[7px] font-semibold text-[#a6a9af]">
                Optional
              </span>

            </div>


            <NeoInput>

              <TicketIcon />

              <input
                type="text"
                placeholder="Referral code"
                value={form.referral_code}
                onChange={(e) =>
                  updateField(
                    "referral_code",
                    e.target.value
                  )
                }
                className={inputClass}
              />

            </NeoInput>

          </div>


          {/* =========================================
              TERMS
          ========================================== */}

          <div className="mt-5 space-y-3">

            <CheckRow
              checked={acceptedTerms}
              onClick={() =>
                setAcceptedTerms(
                  (current) => !current
                )
              }
            >
              I agree to the{" "}
              <a
                href="/terms"
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="font-semibold text-[#ff6846]"
              >
                Terms & Conditions
              </a>
            </CheckRow>


            <CheckRow
              checked={acceptedPrivacy}
              onClick={() =>
                setAcceptedPrivacy(
                  (current) => !current
                )
              }
            >
              I agree to the{" "}
              <a
                href="/privacy"
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="font-semibold text-[#ff6846]"
              >
                Privacy Policy
              </a>
            </CheckRow>

          </div>


          {/* CREATE ACCOUNT */}

          <button
            type="button"
            onClick={register}
            disabled={loading}
            className="mt-5 flex h-[52px] w-full items-center justify-between rounded-[16px] bg-[#ff6846] px-5 text-white shadow-[5px_5px_11px_#c0c2c7,-4px_-4px_10px_#ffffff] transition-all active:scale-[0.985] active:shadow-[inset_4px_4px_8px_#d94e31,inset_-3px_-3px_7px_#ff8c72] disabled:cursor-not-allowed disabled:opacity-60"
          >

            <span className="text-[11px] font-semibold">
              {loading
                ? "Creating account..."
                : "Create account"}
            </span>


            {!loading && (
              <span className="text-[16px]">
                →
              </span>
            )}

          </button>

        </div>


        {/* =========================================
            LOGIN LINK
        ========================================== */}

        <div className="relative z-20 mt-5 text-center">

          <p className="text-[9px] font-medium text-[#8f9299]">
            Already have an account?
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/passenger-login")
            }
            className="mt-2 inline-flex h-[38px] items-center justify-center rounded-[12px] bg-[#e7e9ee] px-5 text-[9px] font-semibold text-[#ff6846] shadow-[4px_4px_8px_#c4c6ca,-4px_-4px_8px_#ffffff] transition-all active:scale-95 active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]"
          >
            Sign in
          </button>

        </div>


        {/* FOOTER */}

        <footer className="relative z-20 mt-6 border-t border-[#d1d3d8] pt-3">

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


/* =====================================================
   SMALL COMPONENTS
===================================================== */

const inputClass = `
  h-full
  min-w-0
  flex-1
  bg-transparent
  text-[12px]
  font-medium
  text-[#17191f]
  outline-none
  placeholder:text-[#9b9ea5]
`;


function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 block pl-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#989ba3]">
      {children}
    </label>
  );
}


function NeoInput({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[50px] items-center rounded-[16px] bg-[#e7e9ee] px-4 shadow-[inset_4px_4px_8px_#c5c7cc,inset_-4px_-4px_8px_#ffffff]">
      {children}
    </div>
  );
}


function CheckRow({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3"
    >

      <div
        className={`
          flex h-[20px] w-[20px]
          shrink-0
          items-center
          justify-center
          rounded-[7px]
          transition-all
          ${
            checked
              ? "bg-[#ff6846] shadow-[inset_2px_2px_4px_#d95035,inset_-2px_-2px_4px_#ff8b72]"
              : "bg-[#e7e9ee] shadow-[inset_2px_2px_5px_#c5c7cc,inset_-2px_-2px_5px_#ffffff]"
          }
        `}
      >

        {checked && (
          <span className="text-[11px] font-bold text-white">
            ✓
          </span>
        )}

      </div>


      <p className="text-[8px] font-medium text-[#858890]">
        {children}
      </p>

    </div>
  );
}


function EyeButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        visible
          ? "Hide password"
          : "Show password"
      }
      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e7e9ee] text-[#8f9299] shadow-[3px_3px_6px_#c5c7cc,-3px_-3px_6px_#ffffff] transition-all active:scale-95"
    >

      {visible ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[15px] w-[15px]"
        >
          <path
            d="M3 3l18 18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />

          <path
            d="M9.5 5.4A9.5 9.5 0 0 1 12 5c5 0 8.5 4.2 9 7M6.2 6.2C4.4 7.5 3.3 9.3 3 12c.5 2.8 4 7 9 7 1.4 0 2.7-.3 3.8-.8"
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
        >
          <path
            d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"
            stroke="currentColor"
            strokeWidth="1.7"
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
  );
}


/* =====================================================
   ICONS
===================================================== */

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mr-3 h-[16px] w-[16px] shrink-0"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="#8f9299"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 20c.5-4 3-6 6.5-6s6 2 6.5 6"
        stroke="#8f9299"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mr-3 h-[16px] w-[16px] shrink-0"
    >
      <path
        d="M7 3h3l1 4-2 1.5a14 14 0 0 0 6.5 6.5L17 13l4 1v3c0 2-1 4-4 4C9 21 3 15 3 7c0-3 2-4 4-4Z"
        stroke="#8f9299"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mr-3 h-[16px] w-[16px] shrink-0"
    >
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="#8f9299"
        strokeWidth="1.7"
      />

      <path
        d="m4.5 7 7.5 6 7.5-6"
        stroke="#8f9299"
        strokeWidth="1.7"
      />
    </svg>
  );
}


function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mr-3 h-[16px] w-[16px] shrink-0"
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
      />
    </svg>
  );
}


function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mr-3 h-[16px] w-[16px] shrink-0"
    >
      <path
        d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z"
        stroke="#8f9299"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 8.5v7"
        stroke="#8f9299"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}