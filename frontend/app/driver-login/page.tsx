"use client";

import { useState } from "react";

export default function DriverLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const response = await fetch(
      "http://localhost:5000/driver-login",
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

    if (response.ok) {
      localStorage.setItem(
        "driver",
        JSON.stringify(data)
      );

      alert(
        `Welcome ${data.full_name}`
      );

      window.location.href =
        "/driver-portal";
    } else {
      alert(data.error);
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-4xl font-bold mb-6">
        Driver Login
      </h1>

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value)
        }
        className="border p-2 w-full mb-4"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={login}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Login
      </button>
    </main>
  );
}
