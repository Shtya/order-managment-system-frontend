"use client";

import { useRouter } from "next/navigation";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <div className="madar-404">
      <style>
        {`
          .madar-404 {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 40px 24px 32px;
            overflow: hidden;
            color: #27304d;
            color-scheme: light;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
              "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at 50% 42%, rgba(137, 132, 218, .14) 0, rgba(137, 132, 218, .07) 13%, transparent 34%),
              linear-gradient(180deg, #fcfcfd 0%, #f8f8fb 100%);
            box-sizing: border-box;
          }
          .madar-404 *, .madar-404 *::before, .madar-404 *::after { box-sizing: border-box; }
          .madar-404-hero {
            width: min(760px, 100%);
            text-align: center;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .madar-404-visual {
            position: relative;
            width: min(700px, 100%);
            height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .madar-404-visual::before {
            content: "";
            position: absolute;
            width: 390px;
            height: 230px;
            border-radius: 50%;
            background: rgba(117, 110, 203, .09);
            filter: blur(38px);
          }
          .madar-404-code {
            position: relative;
            z-index: 2;
            margin: 0;
            font-size: clamp(110px, 17vw, 176px);
            line-height: .8;
            letter-spacing: -0.075em;
            font-weight: 800;
            color: #8884d2;
            text-shadow:
              0 18px 35px rgba(93, 87, 181, .12),
              0 0 35px rgba(129, 124, 214, .18);
            user-select: none;
          }
          .madar-404-path {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
          }
          .madar-404-path svg {
            width: 100%;
            height: 100%;
            overflow: visible;
          }
          .madar-404-path-line {
            fill: none;
            stroke: #bcb9eb;
            stroke-width: 2.5;
            stroke-linecap: round;
            stroke-dasharray: 4 9;
            opacity: .85;
          }
          .madar-404-node {
            fill: #fbfbfd;
            stroke: #c5c2ed;
            stroke-width: 2;
          }
          .madar-404-node-x {
            stroke: #7a75cc;
            stroke-width: 2.5;
            stroke-linecap: round;
          }
          .madar-404-node-arrow {
            fill: none;
            stroke: #7a75cc;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .madar-404-signal {
            margin-top: -1px;
            display: flex;
            align-items: center;
            gap: 16px;
            color: #7b78a5;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .32em;
            text-transform: uppercase;
          }
          .madar-404-signal::before,
          .madar-404-signal::after {
            content: "";
            width: 24px;
            height: 1px;
            background: #c6c3e9;
          }
          .madar-404-title {
            margin: 34px 0 10px;
            font-size: clamp(25px, 3vw, 34px);
            line-height: 1.15;
            letter-spacing: -.025em;
            font-weight: 750;
            color: #27304d;
          }
          .madar-404-description {
            margin: 0;
            max-width: 520px;
            color: #6f7694;
            font-size: 15px;
            line-height: 1.75;
          }
          .madar-404-actions {
            display: flex;
            gap: 14px;
            margin-top: 34px;
            align-items: center;
            justify-content: center;
          }
          .madar-404-button {
            height: 48px;
            min-width: 145px;
            padding: 0 22px;
            border-radius: 999px;
            border: 1px solid #e9e9f2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font: inherit;
            font-size: 14px;
            font-weight: 650;
            text-decoration: none;
            cursor: pointer;
            transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
          }
          .madar-404-button:hover { transform: translateY(-2px); }
          .madar-404-button svg { width: 17px; height: 17px; flex: 0 0 auto; }
          .madar-404-button-secondary {
            color: #27304d;
            background: rgba(255,255,255,.9);
            box-shadow: 0 5px 16px rgba(30, 35, 65, .05);
          }
          .madar-404-button-secondary:hover {
            box-shadow: 0 9px 22px rgba(30, 35, 65, .09);
          }
          .madar-404-button-primary {
            color: white;
            border-color: transparent;
            background: linear-gradient(135deg, #726dd0, #625cc0);
            box-shadow: 0 12px 24px rgba(103, 97, 195, .24);
          }
          .madar-404-button-primary:hover {
            box-shadow: 0 15px 28px rgba(103, 97, 195, .3);
          }
          .madar-404-footer {
            position: absolute;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 16px;
            color: #aaa8c8;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .27em;
          }
          .madar-404-footer::before,
          .madar-404-footer::after {
            content: "";
            width: 74px;
            height: 1px;
            background: #e4e3ee;
          }
          .madar-404-brand {
            display: flex;
            align-items: center;
            gap: 9px;
          }
          .madar-404-brand-mark { width: 20px; height: 20px; }
          .madar-404-particle {
            position: absolute;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #d4d1f2;
            opacity: .65;
          }
          .madar-404-p1 { top: 17%; left: 25%; }
          .madar-404-p2 { top: 34%; right: 18%; width: 5px; height: 5px; }
          .madar-404-p3 { bottom: 25%; left: 20%; width: 9px; height: 9px; }
          .madar-404-p4 { bottom: 18%; right: 27%; width: 5px; height: 5px; }
          @media (max-width: 600px) {
            .madar-404 {
              overflow: auto;
              padding: 30px 20px 90px;
            }
            .madar-404-visual { height: 220px; }
            .madar-404-code { font-size: 110px; }
            .madar-404-path-line { stroke-width: 2; }
            .madar-404-title { margin-top: 28px; }
            .madar-404-description { font-size: 14px; line-height: 1.65; }
            .madar-404-actions { width: 100%; flex-direction: column-reverse; }
            .madar-404-button { width: min(320px, 100%); }
            .madar-404-footer { bottom: 22px; }
            .madar-404-footer::before,
            .madar-404-footer::after { width: 38px; }
          }
          @media (prefers-reduced-motion: no-preference) {
            .madar-404-particle { animation: madar-404-float 4s ease-in-out infinite; }
            .madar-404-p2 { animation-delay: -1s; }
            .madar-404-p3 { animation-delay: -2s; }
            .madar-404-p4 { animation-delay: -3s; }
            @keyframes madar-404-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-7px); }
            }
          }
        `}
      </style>

      <span className="madar-404-particle madar-404-p1" />
      <span className="madar-404-particle madar-404-p2" />
      <span className="madar-404-particle madar-404-p3" />
      <span className="madar-404-particle madar-404-p4" />

      <section className="madar-404-hero" aria-labelledby="madar-404-title">
        <div className="madar-404-visual">
          
          <div className="madar-404-code" aria-hidden="true">
            404
          </div>
        </div>

        <div className="madar-404-signal">Signal Lost</div>
        <h1 className="madar-404-title" id="madar-404-title">
          Page not found
        </h1>
        <p className="madar-404-description">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>

        <nav className="madar-404-actions" aria-label="404 recovery actions">
          <button
            type="button"
            className="madar-404-button madar-404-button-secondary"
            onClick={() => router.back()}
            aria-label="Go back to the previous page"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 12H5M11 18L5 12L11 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Go back
          </button>
          <a
            className="madar-404-button madar-404-button-primary"
            href="/dashboard"
            aria-label="Go to dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 10.5L12 4L20 10.5V20H4V10.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 20V14H14.5V20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </a>
        </nav>
      </section>
    </div>
  );
}
