"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function Home() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installNotice, setInstallNotice] = useState(false);

  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const installRouteX = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      setInstallNotice(true);
    }
  };

  return (
    <>
      <div className="routex-home app">
        <header className="hero">
          <div className="top">
            <div className="logo">ROUTE<span>X</span></div>
            <button className="install" onClick={installRouteX} type="button">Install app ↗</button>
          </div>
          <div className="welcome">
            <div className="eyebrow">WELCOME TO ROUTEX</div>
            <h1>Getting Upington<br />moving.</h1>
            <p>Local rides and package deliveries,<br />all in one simple app.</p>
          </div>
        </header>
        <main>
          <section className="section">
            <div className="sectionhead"><strong>YOUR SERVICES</strong><small>UPINGTON ●</small></div>
            <a className="service" href="/passenger-login">
              <div className="icon"><svg viewBox="0 0 24 24"><path d="M5 11 7 5.5A2 2 0 0 1 8.9 4h6.2A2 2 0 0 1 17 5.5L19 11M5 11h14a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2ZM5 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2m8 0v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M7 14h.01M17 14h.01"/></svg></div>
              <div className="copy"><b>Book a ride</b><p>Travel anywhere in Upington</p></div><span className="arrow">→</span>
            </a>
            <a className="service" href="/passenger-login">
              <div className="icon"><svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7ZM3 7l9 5 9-5M12 12v9"/></svg></div>
              <div className="copy"><b>Send a package</b><p>Collection and local delivery</p></div><span className="arrow">→</span>
            </a>
            <a className="service" href="/monthly-transport" aria-label="Register interest in upcoming monthly transport">
              <div className="icon"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 12h16M8 7h3m2 0h3M7 19v2m10-2v2M8 15h.01M16 15h.01"/></svg></div>
              <div className="copy"><div className="monthly-title"><b>Monthly transport</b><span className="coming-soon">COMING SOON</span></div><p>Work or school? Help us plan shared routes</p><span className="monthly-hint">Register your interest · No payment needed</span></div><span className="arrow">→</span>
            </a>
          </section>
          <section className="access">
            <div className="title">GET STARTED</div>
            <a className="primary" href="/passenger-register">Create an account &nbsp; →</a>
            <div className="two"><a className="secondary" href="/passenger-login">Passenger login</a><a className="secondary" href="/driver-login">Driver login</a></div>
            <div className="driver"><div><strong>Drive with RouteX</strong><p>Join our local driver network</p></div><a href="/become-a-driver">Apply →</a></div>
            <a className="routex-support-inline" href="https://wa.me/27799132513?text=Hello%20RouteX%2C%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" aria-label="Contact RouteX support on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.84 9.84 0 0 0-8.46 14.86L2 22l5.29-1.53A9.96 9.96 0 1 0 12.04 2Zm0 17.98a8.06 8.06 0 0 1-4.11-1.12l-.3-.18-3.14.91.92-3.06-.2-.31a7.93 7.93 0 1 1 6.83 3.76Zm4.42-5.94c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.19-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg><span>WhatsApp Support</span><span aria-hidden="true">→</span></a>
          </section>
        </main>
        <footer className="foot"><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer>
      </div>
      {installNotice && (
        <div className="install-overlay" onClick={() => setInstallNotice(false)}>
          <div className="install-dialog" role="dialog" aria-modal="true" aria-label="Install RouteX" onClick={(event) => event.stopPropagation()}>
            <h2>Install RouteX</h2><p>Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>
            <button type="button" onClick={() => setInstallNotice(false)}>Got it</button>
          </div>
        </div>
      )}
      <style jsx global>{`
:root{--bg:#e9edf5;--navy:#1d344b;--orange:#ff684b;--muted:#8494ac;--shadow:9px 10px 20px #cbd1dc,-8px -8px 20px #fff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#17283c;font-family:Inter,"Segoe UI",Arial,sans-serif}a{text-decoration:none;color:inherit}.app{max-width:490px;min-height:100dvh;margin:auto;padding:0 0 28px}.hero{background:linear-gradient(115deg,#1a344c 0%,#273e55 42%,#bd5f4c 100%);border-radius:0 0 35px 35px;color:#fff;padding:25px 25px 27px;box-shadow:0 18px 26px #1d344b22;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;width:195px;height:195px;border:27px solid #ffffff0c;border-radius:50%;right:-98px;bottom:-110px}.top{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}.logo{font-size:19px;font-weight:850;letter-spacing:2px}.logo span{color:#ff7358}.install{border:1px solid #ffffff65;border-radius:13px;padding:10px 13px;background:#ffffff18;color:white;font-size:11px;font-weight:750;cursor:pointer}.welcome{margin-top:32px;position:relative;z-index:1}.welcome .eyebrow{font-size:10px;letter-spacing:2px;font-weight:750;color:#ffb09d}.welcome h1{font-size:29px;line-height:1.13;letter-spacing:-1.3px;margin:12px 0 10px}.welcome p{font-size:13px;line-height:1.5;color:#e4eaf0;margin:0}.section{padding:22px 24px 0}.sectionhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.sectionhead strong{font-size:11px;color:#8595aa;letter-spacing:2px}.sectionhead small{font-size:11px;color:#ff684b}.service{display:flex;align-items:center;gap:13px;padding:12px 15px;background:var(--bg);border:1px solid #fff;border-radius:20px;box-shadow:var(--shadow);margin-bottom:13px;min-height:74px;transition:transform .2s}.service:hover{transform:translateY(-2px)}.icon{display:grid;place-items:center;width:45px;height:45px;flex-shrink:0;border-radius:18px;box-shadow:5px 6px 13px #cbd1dc,-5px -5px 13px white;color:#ff684b}.icon svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.service .copy{flex:1;min-width:0}.service b{font-size:15px}.service p{font-size:11px;color:#8796ad;margin:4px 0 0}.arrow{font-size:23px;color:#a3aec0}.access{padding:10px 24px 0}.access .title{font-size:11px;letter-spacing:2px;color:#8595aa;font-weight:800;margin:8px 0 16px}.primary{display:flex;justify-content:center;align-items:center;padding:17px;background:var(--orange);color:#fff;border-radius:17px;font-size:14px;font-weight:800;box-shadow:6px 8px 16px #dbb3ad,-5px -5px 16px white}.secondary{display:flex;justify-content:center;align-items:center;padding:16px;background:var(--bg);border:1px solid #fff;border-radius:17px;font-size:13px;font-weight:750;box-shadow:5px 6px 13px #cbd1dc,-5px -5px 13px white}.two{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:15px}.driver{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding:18px 18px;background:#dfe5ee;border:1px solid #f9fbff;border-radius:19px}.driver strong{font-size:13px}.driver p{font-size:11px;color:#7889a0;margin:6px 0 0}.driver a{font-size:12px;font-weight:800;color:#f26046;white-space:nowrap}.foot{display:flex;justify-content:center;gap:22px;padding-top:22px;font-size:11px;color:#8c9bb0}.foot a:hover{color:var(--orange)}@media(min-width:700px){body{padding:0}.app{min-height:100dvh;border-radius:0;overflow:hidden;box-shadow:0 18px 55px #aab3c055;background:var(--bg);padding:0 0 28px}.hero{border-radius:0 0 35px 35px}}@media(prefers-reduced-motion:reduce){.service{transition:none}}
.routex-support-inline{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:17px;padding:14px;border-radius:17px;background:var(--bg);border:1px solid #fff;box-shadow:5px 6px 13px #cbd1dc,-5px -5px 13px white;color:#1d344b;font-size:13px;font-weight:750}.routex-support-inline svg{width:23px;height:23px;color:#25D366}.routex-support-inline span:last-child{margin-left:auto;color:#93a2b6}.routex-support-inline:hover{transform:translateY(-1px)}
.install-overlay{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:#12253b8c;padding:22px}.install-dialog{width:min(100%,370px);background:#e9edf5;padding:27px;border-radius:25px;box-shadow:12px 15px 30px #11233855,-6px -6px 20px #ffffff80;color:#17283c}.install-dialog h2{font-size:21px;margin:0 0 10px}.install-dialog p{font-size:14px;line-height:1.6;color:#667990}.install-dialog button{background:#ff684b;color:white;border:0;border-radius:13px;padding:13px 22px;font-weight:750;cursor:pointer;margin-top:10px}
.monthly-title{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.coming-soon{font-size:8px;letter-spacing:.4px;font-weight:850;color:#ff684b;background:#dfe5ee;border:1px solid #f9fbff;border-radius:7px;padding:4px 5px}.monthly-hint{display:block;margin-top:6px;font-size:10px;font-weight:750;color:#ff684b}
      `}</style>
    </>
  );
}
