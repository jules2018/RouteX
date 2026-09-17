"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

function DriverSetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This password setup link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/driver-set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to create your password."
        );
        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        "DRIVER PASSWORD SETUP ERROR:",
        error
      );

      setError(
        "Unable to connect to RouteX. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-white px-6">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff6a00]">
            RouteX Driver
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-black">
            Password created
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Your RouteX driver account is ready.
            You can now sign in to your Driver Portal.
          </p>

          <button
            type="button"
            onClick={() => router.push("/driver-login")}
            className="mt-8 w-full rounded-xl bg-black px-5 py-4 text-sm font-bold text-white"
          >
            Sign in to RouteX
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff6a00]">
          RouteX Driver
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-black">
          Create your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#666666]">
          Your driver application has been approved.
          Create a password to access your Driver Portal.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <div>
            <label className="text-sm font-semibold text-black">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-[#dddddd] px-4 py-4 text-black outline-none focus:border-[#ff6a00]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-black">
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
              className="mt-2 w-full rounded-xl border border-[#dddddd] px-4 py-4 text-black outline-none focus:border-[#ff6a00]"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ff6a00] px-5 py-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Creating password..."
              : "Create Password"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#999999]">
          RouteX • Getting Upington Moving
        </p>
      </div>
    </main>
  );
}
export default function DriverSetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-sm text-[#666666]">
            Loading RouteX...
          </p>
        </main>
      }
    >
      <DriverSetPasswordContent />
    </Suspense>
  );
}