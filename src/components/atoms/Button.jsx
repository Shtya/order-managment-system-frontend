"use client";

import React from "react";

export default function Button_({ href, size = "md", label, tone = "primary", variant = "solid", icon, onClick }) {
	const isLink = !!href;

	const Tag = isLink ? "a" : "button";
	const props = isLink ? { href } : { onClick };

	return (
		<Tag
			{...props}
			className={`btn-_ btn-_--${variant} btn-_--${size}`}
			data-tone={tone}
		>
			<span className="btn-_-shine" aria-hidden="true" />

			{icon && <span className="btn-_-icon">{icon}</span>}
			<span className="btn-_-label">{label}</span>



			<style>{`
        /* ── Bring in the user's CSS variables ── */
        :root {
          --primary: #ff8b00;
          --secondary: #ffb703;
          --third: #ff5c2b;
          --primary-from: 255 180 64;
          --primary-to:   255 139 0;
          --primary-shadow: 255 139 0 / 0.45;
        }
        .dark {
          --primary: #5b4bff;
          --secondary: #8b7cff;
          --third: #3be7ff;
          --primary-from: 140 130 255;
          --primary-to:   100 90 255;
          --primary-shadow: 91 75 255 / 0.6;
        }

        /* ── Base ── */
        .btn-_ {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 650;
          letter-spacing: 0.01em;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          border: none;
          outline: none;
          overflow: hidden;
          isolation: isolate;
          transition:
            transform   0.22s cubic-bezier(.34,1.56,.64,1),
            box-shadow  0.22s ease,
            filter      0.22s ease;
        }

        /* ── Sizes ── */
        .btn-_--sm {
          padding: 0 16px;
          height: 36px;
          font-size: 13px;
          border-radius: 9px;
        }
        .btn-_--md {
          padding: 0 20px;
          height: 42px;
          font-size: 14px;
        }
        .btn-_--lg {
          padding: 0 26px;
          height: 50px;
          font-size: 15px;
        }

        /* ── Solid variant ── */
        .btn-_--solid {
          background-image: linear-gradient(
            135deg,
            rgb(var(--primary-from)),
            rgb(var(--primary-to))
          );
          color: #fff;
          box-shadow:
            0 4px 14px -4px rgb(var(--primary-shadow)),
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.10);
        }
        .btn-_--solid:hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow:
            0 10px 28px -8px rgb(var(--primary-shadow)),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -1px 0 rgba(0,0,0,0.12);
          filter: brightness(1.06);
        }
        .btn-_--solid:active {
          transform: translateY(0) scale(0.985);
          filter: brightness(0.97);
        }

        /* ── Outline variant ── */
        .btn-_--outline {
          background: transparent;
          color: var(--primary);
          box-shadow:
            inset 0 0 0 1.5px var(--primary),
            0 2px 8px -4px rgb(var(--primary-shadow));
        }
        .btn-_--outline:hover {
          transform: translateY(-2px) scale(1.015);
          background: rgb(var(--primary-from) / 0.08);
          box-shadow:
            inset 0 0 0 1.5px var(--primary),
            0 8px 22px -8px rgb(var(--primary-shadow));
        }
        .btn-_--outline:active {
          transform: translateY(0) scale(0.985);
        }

        /* ── Ghost variant ── */
        .btn-_--ghost {
          background: rgb(var(--primary-from) / 0.10);
          color: var(--primary);
          box-shadow: none;
        }
        .btn-_--ghost:hover {
          transform: translateY(-2px) scale(1.015);
          background: rgb(var(--primary-from) / 0.18);
          box-shadow: 0 6px 16px -6px rgb(var(--primary-shadow));
        }
        .btn-_--ghost:active {
          transform: scale(0.985);
        }

        /* ── Shine sweep ── */
        .btn-_-shine {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 30%,
            rgba(255,255,255,0.30) 50%,
            transparent 70%
          );
          transform: translateX(-100%) skewX(-12deg);
          transition: transform 0.55s ease;
        }
        .btn-_:hover .btn-_-shine {
          transform: translateX(160%) skewX(-12deg);
        }

        /* ── Icon ── */
        .btn-_-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.92;
          transition: transform 0.2s ease;
        }
        .btn-_:hover .btn-_-icon {
          transform: scale(1.12) rotate(-4deg);
        }

        /* ── Label ── */
        .btn-_-label {
          white-space: nowrap;
        }

        /* ── Focus ring ── */
        .btn-_:focus-visible {
          outline: 2.5px solid var(--primary);
          outline-offset: 3px;
        }

         
      `}</style>
		</Tag>
	);
}