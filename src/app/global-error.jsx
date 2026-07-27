"use client";

// import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./[locale]/globals.css";
import { RotateCcw, Home, MessageCircle } from "lucide-react";

export default function GlobalError({ error, reset }) {

  function handleReset() {
    if(!!reset){
      reset?.();
    } else {
      window.location.reload();
    }
  }
  useEffect(() => {
    console.error(error);
    // Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--background)",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            padding: "48px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* soft radial glow */}
          <div
            style={{
              position: "absolute",
              width: "700px",
              height: "700px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--third) 14%, transparent), transparent 70%)",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />

          {/* decorative dot grids */}
          <DotGrid style={{ top: "18%", left: "6%" }} />
          <DotGrid style={{ top: "48%", right: "6%" }} />

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "560px",
              textAlign: "center",
            }}
          >
            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(52px, 10vw, 84px)",
                fontWeight: 700,
                color: "var(--primary)",
                margin: "0 0 12px",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Oops...
            </h1>

            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.6,
                color: "var(--foreground)",
                opacity: 0.85,
                margin: "0 0 36px",
                fontWeight: 500,
              }}
            >
              Looks like something went wrong.
              <br />
              We&apos;re working on it.
            </p>

            {/* Action row */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "28px",
                marginBottom: "44px",
                flexWrap: "wrap",
              }}
            >
              <ActionButton
                label="Try Again"
                onClick={() => handleReset()}
                icon={RotateCcw}
              />
              <ActionButton label="Go Home" href="/dashboard" icon={Home} />
           
            </div>

            {/* Illustration */}
            <div
              style={{
                margin: "0 auto 40px",
                width: "220px",
                animation: "ge-float 4s ease-in-out infinite",
              }}
            >
              <svg
                viewBox="0 0 220 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 40 C40 20, 55 50, 78 35"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />

                <path
                  d="M220 40 C180 20, 165 50, 142 35"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>

            {/* Error ID card */}
            {/* <div
              style={{
                textAlign: "left",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                boxShadow:
                  "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--foreground)",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Error ID: </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--primary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {error?.digest || generateFallbackId()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "var(--muted-foreground)",
                  }}
                >
                  This helps us identify and fix the issue faster.
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </body>
    </html>
  );
}


function ActionButton({ label, onClick, href, icon: Icon, target, rel }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      onClick={onClick}
      target={target}
      rel={rel}
      className="ge-action"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        background: "none",
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
        padding: 0,
      }}
    >
      <span
        className="ge-action-circle"
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "var(--card)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <Icon size={22} strokeWidth={1.8} color="var(--primary)" />
      </span>
      <span
        style={{
          fontSize: "13.5px",
          fontWeight: 600,
          color: "var(--foreground)",
        }}
      >
        {label}
      </span>
    </Tag>
  );
}


function DotGrid({ style }) {
  const dots = Array.from({ length: 9 });
  return (
    <div
      style={{
        position: "absolute",
        display: "grid",
        gridTemplateColumns: "repeat(3, 6px)",
        gap: "6px",
        opacity: 0.5,
        ...style,
      }}
    >
      {dots.map((_, i) => (
        <span
          key={i}
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "var(--primary)",
          }}
        />
      ))}
    </div>
  );
}

function generateFallbackId() {
  // Simple client-side fallback if no digest is present
  const s = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return s.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

