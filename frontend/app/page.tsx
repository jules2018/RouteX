"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
const [installPrompt, setInstallPrompt] = useState<any>(null);

useEffect(() => {
  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    setInstallPrompt(event);
  };

  window.addEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );

  return () => {
    window.removeEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
  };
}, []);

const installRouteX = async () => {
  if (!installPrompt) {
    alert(
      "RouteX is already installed or your browser does not currently offer installation."
    );
    return;
  }

  installPrompt.prompt();

  await installPrompt.userChoice;

  setInstallPrompt(null);
  
};

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      setIntroReady(true);
    }, 100);

    const leaveTimer = window.setTimeout(() => {
      setIntroLeaving(true);
    }, 2100);

    const finishTimer = window.setTimeout(() => {
      setShowIntro(false);
    }, 2700);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  return (
    <>
      {/* =====================================================
          ROUTEX INTRO
      ====================================================== */}

      {showIntro && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#e7e9ee] transition-all duration-700 ${
            introLeaving
              ? "pointer-events-none scale-[1.04] opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          {/* BACKGROUND GLOWS */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-[#ff6846]/10 blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-[320px] w-[320px] rounded-full bg-white/80 blur-[100px]" />

          <div className="relative flex flex-col items-center">
            {/* NEO LOGO */}

            <div
              className={`relative flex h-[150px] w-[150px] items-center justify-center rounded-[42px] bg-[#e7e9ee] shadow-[14px_14px_30px_#c2c4c9,-14px_-14px_30px_#ffffff] transition-all duration-700 ${
                introReady
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-5 scale-75 opacity-0"
              }`}
            >
              <div className="flex h-[105px] w-[105px] items-center justify-center rounded-full bg-[#e7e9ee] shadow-[inset_7px_7px_14px_#c4c6cb,inset_-7px_-7px_14px_#ffffff]">
                <span
                  className={`text-[60px] font-semibold leading-none tracking-[-0.1em] text-[#ff6846] transition-all delay-300 duration-700 ${
                    introReady
                      ? "scale-100 opacity-100"
                      : "scale-50 opacity-0"
                  }`}
                >
                  X
                </span>
              </div>

              <div
                className={`absolute -bottom-2 h-4 w-4 rounded-full border-[3px] border-[#e7e9ee] bg-[#ff6846] shadow-[2px_2px_5px_#c4c6ca] transition-all delay-500 duration-500 ${
                  introReady
                    ? "scale-100 opacity-100"
                    : "scale-0 opacity-0"
                }`}
              />
            </div>

            {/* WORDMARK */}

            <div
              className={`mt-8 text-center transition-all delay-500 duration-700 ${
                introReady
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="text-[40px] font-semibold tracking-[-0.065em] text-[#17191f]">
                  Route
                </span>

                <span className="text-[40px] font-semibold tracking-[-0.065em] text-[#ff6846]">
                  X
                </span>
              </div>

              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#9699a1]">
                Getting Upington moving
              </p>
            </div>

            {/* LOADING BAR */}

            <div
              className={`mt-7 flex h-[9px] w-[150px] items-center rounded-full bg-[#e7e9ee] p-[2px] shadow-[inset_3px_3px_6px_#c5c7cc,inset_-3px_-3px_6px_#ffffff] transition-all delay-700 duration-500 ${
                introReady ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`h-full rounded-full bg-[#ff6846] transition-all delay-700 duration-[1200ms] ${
                  introReady ? "w-full" : "w-0"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LANDING PAGE
      ====================================================== */}

      <main className="min-h-[100svh] bg-[#e7e9ee] text-[#17191f]">
        <section className="relative mx-auto flex min-h-[100svh] max-w-[430px] flex-col overflow-hidden px-5 pb-4 pt-4">
          {/* BACKGROUND */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-28 -top-28 h-[270px] w-[270px] rounded-full bg-[#ff6846]/10 blur-[90px]" />

            <div className="absolute -bottom-28 -left-32 h-[280px] w-[280px] rounded-full bg-white/70 blur-[90px]" />
          </div>

          {/* =================================================
              NAV
          ================================================== */}

          <nav className="relative z-20 flex items-center justify-between">
            <a
              href="/"
              className="text-[24px] font-bold tracking-[-0.055em]"
            >
              Route<span className="text-[#ff6846]">X</span>
            </a>

            <div className="relative">
 <button
  type="button"
  onClick={installRouteX}
  aria-label="Install RouteX"
  className="flex h-10 items-center justify-center rounded-[14px] bg-[#e7e9ee] px-4 shadow-[5px_5px_11px_#c4c6ca,-5px_-5px_11px_#ffffff] transition-all duration-200 active:scale-95 active:shadow-[inset_3px_3px_7px_#c4c6ca,inset_-3px_-3px_7px_#ffffff]"
>
  <span className="text-[11px] font-bold text-[#ff6846]">
    Install
  </span>
</button>


</div>
          </nav>

          {/* =================================================
              HERO
          ================================================== */}

          <div className="relative z-20 mt-7">
            {/* LOCATION */}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7e9ee] shadow-[inset_3px_3px_6px_#c6c8cc,inset_-3px_-3px_6px_#ffffff]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#ff6846]" />
              </div>

              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#9699a1]">
                  Available in
                </p>

                <p className="mt-[1px] text-[12px] font-semibold">
                  Upington
                </p>
              </div>
            </div>

            {/* MESSAGE */}

            <div className="mt-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff6846]">
                Local rides. Made simple.
              </p>

              <h1 className="mt-1.5 text-[29px] font-semibold leading-tight tracking-[-0.05em]">
                Getting Upington moving.
              </h1>

              <p className="mt-2 text-[10px] font-medium text-[#7d8088]">
                Ride local. Drive local. RouteX.
              </p>
            </div>
          </div>

          {/* =================================================
              LOGIN / REGISTER
          ================================================== */}

          <div className="relative z-20 mt-7 rounded-[27px] bg-[#e7e9ee] p-5 shadow-[8px_8px_18px_#c3c5ca,-8px_-8px_18px_#ffffff]">
            {/* HEADER */}

            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#9a9da5]">
                Welcome to RouteX
              </p>

              <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.04em]">
                Let&apos;s get you moving.
              </h2>
            </div>

            {/* PASSENGER LOGIN */}

            <a
              href="/passenger-login"
              className="mt-5 flex h-[50px] items-center justify-between rounded-[16px] bg-[#e7e9ee] px-4 shadow-[inset_4px_4px_8px_#c5c7cc,inset_-4px_-4px_8px_#ffffff] transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="h-[7px] w-[7px] rounded-full bg-[#343740]" />

                <span className="text-[11px] font-semibold">
                  Passenger login
                </span>
              </div>

              <span className="text-[15px] text-[#ff6846]">
                →
              </span>
            </a>

            {/* CREATE ACCOUNT */}

            <a
              href="/passenger-register"
              className="mt-3 flex h-[50px] items-center justify-between rounded-[16px] bg-[#ff6846] px-4 text-white shadow-[5px_5px_11px_#c0c2c7,-4px_-4px_10px_#ffffff] transition-all active:scale-[0.985] active:shadow-[inset_4px_4px_8px_#d94e31,inset_-3px_-3px_7px_#ff8c72]"
            >
              <div className="flex items-center gap-3">
                <span className="h-[7px] w-[7px] rounded-full bg-white" />

                <span className="text-[11px] font-semibold">
                  Create an account
                </span>
              </div>

              <span className="text-[15px]">
                →
              </span>
            </a>

            {/* DRIVER DIVIDER */}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#d0d2d7]" />

              <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-[#a1a4ab]">
                Driver
              </span>

              <div className="h-px flex-1 bg-[#d0d2d7]" />
            </div>

            {/* DRIVER BUTTONS */}

            <div className="grid grid-cols-2 gap-3">
              <a
                href="/driver-login"
                className="flex h-[44px] items-center justify-center rounded-[15px] bg-[#e7e9ee] text-[10px] font-semibold shadow-[5px_5px_10px_#c4c6ca,-5px_-5px_10px_#ffffff] transition-all active:scale-[0.97] active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]"
              >
                Driver login
              </a>

              <a
                href="/become-a-driver"
                className="flex h-[44px] items-center justify-center rounded-[15px] bg-[#e7e9ee] text-[10px] font-semibold text-[#ff6846] shadow-[5px_5px_10px_#c4c6ca,-5px_-5px_10px_#ffffff] transition-all active:scale-[0.97] active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]"
              >
                Become a driver
              </a>
            </div>
          </div>

          {/* =================================================
              BOTTOM AREA
          ================================================== */}

          <div className="relative z-20 mt-auto pt-5">
            {/* SMALL SOCIAL BUTTONS */}

            <div className="flex justify-center gap-3">
              {/* FACEBOOK */}

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-[#e7e9ee] shadow-[4px_4px_8px_#c4c6ca,-4px_-4px_8px_#ffffff] transition-all duration-200 hover:-translate-y-[2px] active:translate-y-0 active:scale-95 active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[17px] w-[17px] fill-[#1877F2]"
                  aria-hidden="true"
                >
                  <path d="M13.5 22v-9h3l.45-3.5H13.5V7.25c0-1.01.28-1.7 1.73-1.7H17V2.42c-.31-.04-1.38-.13-2.62-.13-2.59 0-4.36 1.58-4.36 4.48V9.5H7v3.5h3.02v9h3.48Z" />
                </svg>
              </a>

              {/* WHATSAPP */}

              <a
  href="https://wa.me/27799132513"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="WhatsApp"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-[#e7e9ee] shadow-[4px_4px_8px_#c4c6ca,-4px_-4px_8px_#ffffff] transition-all duration-200 hover:-translate-y-[2px] active:translate-y-0 active:scale-95 active:shadow-[inset_3px_3px_6px_#c4c6ca,inset_-3px_-3px_6px_#ffffff]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[17px] w-[17px] fill-[#25D366]"
                  aria-hidden="true"
                >
                  <path d="M12.04 2a9.84 9.84 0 0 0-8.46 14.86L2 22l5.29-1.53A9.96 9.96 0 1 0 12.04 2Zm0 17.98a8.06 8.06 0 0 1-4.11-1.12l-.3-.18-3.14.91.92-3.06-.2-.31a7.93 7.93 0 1 1 6.83 3.76Zm4.42-5.94c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.19-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                </svg>
              </a>
            </div>

            {/* FOOTER */}

            <footer className="mt-4 border-t border-[#d1d3d8] pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[7px] font-semibold text-[#a0a3aa]">
                  RouteX · Upington
                </p>

                <div className="flex gap-3 text-[7px] font-semibold text-[#999ca4]">
                  <a href="/safety">
                    Safety
                  </a>

                  <a href="/privacy">
                    Privacy
                  </a>

                  <a href="/terms">
                    Terms
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}