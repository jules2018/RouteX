"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AmbassadorLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const response = await fetch(
      "https://routex-smgu.onrender.com/ambassador-login",
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

    if (!response.ok) {
      alert("Invalid credentials");
      return;
    }

    const data = await response.json();

    localStorage.setItem(
      "ambassador",
      JSON.stringify(data)
    );

    router.push("/ambassador-dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">
          Ambassador Login
        </h1>

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          className="w-full border rounded-lg p-3 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border rounded-lg p-3 mb-4"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-teal-600 text-white py-3 rounded-lg"
        >
          Login
        </button>
      </div>
    </main>
  );
}