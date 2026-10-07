"use client";

import { Poppins } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function ResetPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedPhone = sessionStorage.getItem("passwordResetPhone");

    if (!savedPhone) {
      router.replace("/forgot-password");
      return;
    }

    setPhone(savedPhone);
  }, [router]);

  const handleCodeChange = (
    index: number,
    value: string
  ) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const digits = code.split("");

    while (digits.length < 6) {
      digits.push("");
    }

    digits[index] = digit;

    const newCode = digits.join("").slice(0, 6);

    setCode(newCode);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Backspace" &&
      !code[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    setCode(pasted);
    setError("");

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const verifyCode = async () => {
    setError("");
    setMessage("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-reset-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Invalid or expired verification code."
        );
        return;
      }

      setVerified(true);
      setMessage("Code verified.");
    } catch (error) {
      console.error("VERIFY CODE ERROR:", error);
      setError(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send a new verification code."
        );
        return;
      }

      setCode("");
      setMessage("A new verification code has been sent.");

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("RESEND CODE ERROR:", error);
      setError(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            code,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to reset password."
        );
        return;
      }

      sessionStorage.removeItem("passwordResetPhone");

     router.push("/passenger-login?reset=success");
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
      setError(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
   <main className={`${poppins.className} min-h-[100svh] bg-[#e7e9ee] px-5 text-[#17191f]`}>
      <section className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col justify-center py-8">

        {/* RouteX */}
        <div className="mb-5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff6846]">
            RouteX
          </p>
        </div>

        {/* Embossed card */}
       <div className="relative rounded-[32px] bg-white border-[2px] border-[#ff6846] bg-white px-6 py-8 shadow-[0_0_0_1px_rgba(255,104,70,0.35),8px_8px_20px_#c5c7cc,-8px_-8px_20px_#ffffff]">
        <div className="pointer-events-none absolute left-[-2px] top-[35px] h-[180px] w-[2px] rounded-full bg-gradient-to-b from-[#ff6846] via-[#ff6846]/40 to-transparent" />

<div className="pointer-events-none absolute right-[-2px] bottom-[35px] h-[180px] w-[2px] rounded-full bg-gradient-to-t from-[#ff6846] via-[#ff6846]/30 to-transparent" />
          {/* Lock */}
          <div className="mx-auto mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#e7e9ee] shadow-[6px_6px_14px_#c5c7cc,-6px_-6px_14px_#ffffff]">
            <span className="text-[26px]">
              🔐
            </span>
          </div>

          {!verified ? (
            <>
              <div className="text-center">
                <h1 className="text-[26px] font-semibold tracking-[-0.04em]">
                  Verify your OTP
                </h1>

                <p className="mx-auto mt-3 max-w-[280px] text-[12px] font-medium leading-5 text-[#555960]">
                  We've sent a 6-digit OTP
                  to your registered email.
                </p>
              </div>

              {/* OTP boxes */}
              <div className="mt-7 flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[index] || ""}
                    onChange={(e) =>
                      handleCodeChange(
                        index,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      handleCodeKeyDown(index, e)
                    }
                    onPaste={handleCodePaste}
                    className="h-[52px] w-[44px] rounded-[14px] bg-[#e7e9ee] text-center text-[20px] font-semibold text-[#ff6846] outline-none shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] focus:ring-2 focus:ring-[#ff6846]/30"
                  />
                ))}
              </div>

              {error && (
                <p className="mt-4 text-center text-[11px] font-semibold text-[#ff6846]">
                  {error}
                </p>
              )}

              {message && (
                <p className="mt-4 text-center text-[11px] font-semibold text-[#777b82]">
                  {message}
                </p>
              )}

              {/* Verify */}
              <button
                type="button"
                onClick={verifyCode}
                disabled={loading}
               className="mt-6 w-full rounded-[22px] bg-[#ffffff] px-4 py-4 text-[12px] font-black text-[#17191f] shadow-[7px_7px_14px_#c5c7cc,-7px_-7px_14px_#ffffff] transition-all duration-200 hover:scale-[1.015] hover:shadow-[10px_10px_20px_#c5c7cc,-10px_-10px_20px_#ffffff] active:scale-[0.97] active:shadow-[inset_4px_4px_8px_#d0d2d7,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50"
              >
                {loading
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>

              {/* Resend */}
              <button
                type="button"
                onClick={resendCode}
                disabled={resending}
                className="mx-auto mt-5 block text-[11px] font-black uppercase tracking-[0.12em] text-[#ff6846] disabled:opacity-50"
              >
                {resending
                  ? "Sending..."
                  : "Resend OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-[26px] font-black tracking-[-0.04em]">
                  Create new password
                </h1>

                <p className="mx-auto mt-3 max-w-[280px] text-[12px] font-medium leading-5 text-[#555960]">
                  Your OTP has been verified. Choose a
                  new password for your RouteX account.
                </p>
              </div>

              {/* New password */}
              <div className="mt-7">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-[#777b82]">
                  New password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-[18px] bg-[#e7e9ee] px-4 py-4 text-[14px] font-semibold outline-none shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] placeholder:text-[#a0a3a9]"
                />

                <label className="mb-2 mt-5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#777b82]">
                  Confirm password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  className="w-full rounded-[18px] bg-[#e7e9ee] px-4 py-4 text-[14px] font-semibold outline-none shadow-[inset_3px_3px_7px_#c5c7cc,inset_-3px_-3px_7px_#ffffff] placeholder:text-[#a0a3a9]"
                />
              </div>

              {error && (
                <p className="mt-4 text-center text-[11px] font-semibold text-[#ff6846]">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={resetPassword}
                disabled={loading}
                className="mt-6 w-full rounded-[22px] bg-[#ffffff] px-4 py-4 text-[12px] font-black text-[#17191f] shadow-[7px_7px_14px_#c5c7cc,-7px_-7px_14px_#ffffff] transition-all duration-200 hover:scale-[1.015] hover:shadow-[10px_10px_20px_#c5c7cc,-10px_-10px_20px_#ffffff] active:scale-[0.97] active:shadow-[inset_4px_4px_8px_#d0d2d7,inset_-4px_-4px_8px_#ffffff] disabled:opacity-50"
              >
                {loading
                  ? "Saving password..."
                  : "Set new password"}
              </button>
            </>
          )}
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mx-auto mt-6 text-[11px] font-bold text-[#777b82]"
        >
          ← Back to login
        </button>

        <p className="mt-6 text-center text-[9px] font-semibold text-[#a0a3a9]">
          RouteX • Getting Upington Moving
        </p>

      </section>
    </main>
  );
}