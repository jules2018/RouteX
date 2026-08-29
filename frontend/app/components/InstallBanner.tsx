"use client";

import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already running as an installed app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Detect iPhone / iPad
    const ios =
      /iPhone|iPad|iPod/i.test(navigator.userAgent);

    setIsIOS(ios);

    // Android / Chrome / supported browsers
    const handler = (e: any) => {
      e.preventDefault();

      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handler
    );

    // iOS doesn't fire beforeinstallprompt
    if (ios) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );
    };
  }, []);

  const install = async () => {
    // Android / Chrome
    if (deferredPrompt) {
      deferredPrompt.prompt();

      const { outcome } =
        await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowBanner(false);
      }

      setDeferredPrompt(null);

      return;
    }

    // iPhone / iPad
    if (isIOS) {
      alert(
        "To install RouteX:\n\n" +
        "1. Open RouteX in Safari\n" +
        "2. Tap the Share button\n" +
        "3. Select 'Add to Home Screen'\n" +
        "4. Tap 'Add'"
      );
    }
  };

  const dismiss = () => {
    setShowBanner(false);

    sessionStorage.setItem(
      "routex-install-dismissed",
      "true"
    );
  };

  useEffect(() => {
    const dismissed = sessionStorage.getItem(
      "routex-install-dismissed"
    );

    if (dismissed) {
      setShowBanner(false);
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-3">

        <div className="flex items-center gap-3">

          {/* RouteX icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              X
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">

            <p className="font-semibold text-sm">
              Get RouteX on your phone
            </p>

            <p className="text-xs text-slate-400 mt-0.5">
              {isIOS
                ? "Add RouteX to your Home Screen"
                : "Install RouteX for quick access"}
            </p>

          </div>

          {/* Install */}
          <button
            onClick={install}
            className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            Install
          </button>

          {/* Close */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ×
          </button>

        </div>

      </div>
    </div>
  );
}