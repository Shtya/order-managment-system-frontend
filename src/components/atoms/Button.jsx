"use client";

import { Loader2 } from "lucide-react";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTutorial } from "@/context/TutorialContext";
import { TutorialSpotlight } from "./TutorialSpotlight";


export default function Button_({
	href,
	size = "md",
	label,
	tone = "",
	variant = "solid",
	icon,
	onClick,
	onMouseDown,
	disabled,
	className = "",
	type = "button",
	permission,
	description,
	example,
	...props
}) {
	const { hasPermission } = useAuth();
	const { isTutorialMode } = useTutorial();

	if (permission && !hasPermission(permission)) {
		return null;
	}

	const isLink = !!href;
	const Tag = isLink ? "a" : "button";
	const extra = isLink 
		? { href, onClick, onMouseDown, ...props } 
		: { onClick, onMouseDown, disabled, type, ...props };

	const classes = [
		"btn",
		`btn-${variant}`,
		`btn-${size}`,
		tone && `btn-${tone}`,
		className,
	]
		.filter(Boolean)
		.join(" ");

	const buttonContent = (
		<Tag {...extra} className={classes}>
			{icon && icon}
			{label}
		</Tag>
	);

	const btn = description ? (
		<TutorialSpotlight 
			title={label} 
			description={description} 
			example={example} 
			style={{ borderRadius: "var(--radius)" }}
			card="sm"
		>
			{buttonContent}
		</TutorialSpotlight>
	) : buttonContent;

	const wrapperStyle = isTutorialMode && description ? {
		zIndex: 40,
		position: "relative",
		display: "inline-flex",
	} : { display: "inline-flex" };

	return <span style={wrapperStyle}>{btn}</span>;
}

/**
 * PrimaryBtn — raw children pattern, same btn classes.
 */
export function PrimaryBtn({
	children,
	onClick,
	disabled,
	loading,
	className = "",
	permission,
	...props
}) {
	const { hasPermission } = useAuth();

	if (permission && !hasPermission(permission)) {
		return null;
	}

	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			{...props}
			className={`btn btn-solid btn-md ${className}`.trim()}
		>
			{loading && <Loader2 size={14} className="animate-spin" />}
			{children}
		</button>
	);
}

export function GhostBtn({ children, onClick, className = "", permission }) {
	const { hasPermission } = useAuth();

	if (permission && !hasPermission(permission)) {
		return null;
	}

	return (
		<button
			onClick={onClick}
			className={`flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all ${className}`}
		>
			{children}
		</button>
	);
}