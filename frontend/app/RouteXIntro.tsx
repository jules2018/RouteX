"use client";

import { useEffect, useState } from "react";

export default function RouteXIntro({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("routex-intro-shown")) { setVisible(false); onComplete(); return; }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("routex-intro-shown", "1");
      setVisible(false); onComplete();
      return;
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false); onComplete();
      sessionStorage.setItem("routex-intro-shown", "1");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;


  return (
    <div className="rx-intro" aria-label="RouteX introduction">
      <div className="rx-intro-content">
        <div className="rx-intro-logo">
          route<span>x</span>
        </div>

        <div className="rx-intro-tagline">
          GETTING YOU MOVING.
        </div>

        <div className="rx-intro-track">
          <div className="rx-intro-progress" />
          <div className="rx-intro-arrow">➤</div>
        </div>

        <div className="rx-intro-footer">
          YOUR JOURNEY STARTS HERE
        </div>
      </div>

      <style jsx>{`
        .rx-intro {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #17191f;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          animation: introExit 0.5s ease 2.1s forwards;
        }

        .rx-intro-content {
          text-align: center;
        }

        .rx-intro-logo {
          font-size: clamp(58px, 12vw, 82px);
          font-weight: 900;
          letter-spacing: -5px;
          line-height: 1;
          animation: reveal 0.7s both;
        }

        .rx-intro-logo span {
          color: #ff6846;
          display: inline-block;
          animation: glow 0.9s 0.65s both;
        }

        .rx-intro-tagline {
          margin-top: 24px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #c1c4cb;
          animation: reveal 0.7s 0.35s both;
        }

        .rx-intro-track {
          position: relative;
          width: 185px;
          height: 3px;
          margin: 35px auto 0;
          background: #3a3e47;
          border-radius: 5px;
        }

        .rx-intro-progress {
          height: 100%;
          background: #ff6846;
          border-radius: 5px;
          animation: load 1.5s 0.55s both;
        }

        .rx-intro-arrow {
          position: absolute;
          top: -23px;
          color: #ff6846;
          font-size: 18px;
          animation: drive 1.5s 0.55s both;
        }

        .rx-intro-footer {
          margin-top: 25px;
          font-size: 9px;
          letter-spacing: 3px;
          color: #858b96;
          animation: reveal 0.7s 0.5s both;
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(16px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes glow {
          50% { filter: drop-shadow(0 0 17px #ff6846); }
        }

        @keyframes load {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes drive {
          from { left: 0; }
          to { left: calc(100% - 15px); }
        }

        @keyframes introExit {
          to { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rx-intro { animation: none; }
          .rx-intro * { animation: none; }
        }
      `}</style>
    </div>
  );
}
