"use client";

import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } else {
      alert(
        "iPhone: Open in Safari → Share → Add to Home Screen"
      );
    }
  };

  return (
    <div
      style={{
        background: "#0f172a",
        padding: "6px",
        textAlign: "center",
      }}
    >
      <button
        onClick={install}
        style={{
          background: "transparent",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        ⬇ Install RouteX
      </button>
    </div>
  );
}
