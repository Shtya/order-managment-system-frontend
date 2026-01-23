"use client"

import * as React from "react"
import { X, CornerDownLeft } from "lucide-react"

import { cn } from "@/utils/cn"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import LANG from "./LANG"

export function TagInput({
	label = "قيمة المتغير",
	tags,
	onTagsChange,
	placeholder = "",
	dir = "rtl",
	className,
}) {
	const [value, setValue] = React.useState("")

	const addTag = (raw) => {
		const t = raw.trim()
		if (!t) return
		if (tags.includes(t)) return
		onTagsChange([...tags, t])
	}

	const removeTag = (t) => {
		onTagsChange(tags.filter((x) => x !== t))
	}

	return (
		<div className={cn("w-full space-y-2", className)} dir={dir}>
			{label ? (
				<div className={'text-sm text-gray-600 dark:text-slate-300'}>
					{label}
				</div>
			) : null}




			<div className="relative">
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder={label}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()
							addTag(value)
							setValue("")
						}
						if (e.key === "Backspace" && value.length === 0 && tags.length) {
							removeTag(tags[tags.length - 1])
						}
					}}
					className={cn(
						"rounded-xl h-[50px] bg-white dark:bg-slate-800",
						"border-gray-200 dark:border-slate-700",
						"focus:ring-2 focus:ring-primary/20 font-semibold",
						"pr-12 rtl:pl-12 rtl:pr-4" // مساحة للأيقونة
					)}
				/>

				{/* Enter hint */}
				<div className="pointer-events-none absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center gap-1 text-gray-400 dark:text-slate-400">
					<CornerDownLeft className="h-4 w-4" />
					<span className="text-xs !font-[Inter] ">Enter</span>
				</div>
			</div>



			<div
				className={cn("inline-flex w-full items-center gap-2  flex-wrap",)} >
				{tags.map((t) => (
					<Badge
						key={t}
						variant="secondary"
						className={cn(
							"rounded-full px-3 py-1 text-sm",
							"bg-primary/20 text-primary hover:bg-primary/15",
							"flex items-center gap-1"
						)}
					>
						<LANG>{t}</LANG>
						<button
							type="button"
							onClick={() => removeTag(t)}
							className="rounded-full p-0.5 hover:bg-black/10"
							aria-label={`Remove ${t}`}
						>
							<X className="h-3 w-3 rtl:ml-[-5px] " />
						</button>
					</Badge>
				))}
			</div>
		</div>
	)
}
