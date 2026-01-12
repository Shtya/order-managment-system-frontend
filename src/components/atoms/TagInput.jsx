"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/utils/cn"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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




			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)} // whatever you type shows here
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
					"rounded-full !h-[45px] bg-[#fafafa] border py-2 px-5 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700")}
			/>


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
						<span>{t}</span>
						<button
							type="button"
							onClick={() => removeTag(t)}
							className="rounded-full p-0.5 hover:bg-black/10"
							aria-label={`Remove ${t}`}
						>
							<X className="h-4 w-4" />
						</button>
					</Badge>
				))}
			</div>
		</div>
	)
}
