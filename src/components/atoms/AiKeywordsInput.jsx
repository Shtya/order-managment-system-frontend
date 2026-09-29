"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// One-line keywords input: type + Enter or + adds, X on each badge removes.
// Duplicates and blank entries are ignored.
export function AiKeywordsInput({ value = [], onChange, placeholder = "" }) {
	const [draft, setDraft] = useState("");

	const add = (raw) => {
		const keyword = (raw ?? "").toString().trim();
		if (!keyword) return;
		if ((value || []).includes(keyword)) {
			setDraft("");
			return;
		}
		onChange([...(value || []), keyword]);
		setDraft("");
	};

	return (
		<div>
			<div className="flex gap-2">
				<Input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							add(draft);
						}
					}}
					placeholder={placeholder}
					className="flex-1 h-[46px]"
				/>
				<Button
					type="button"
					onClick={() => add(draft)}
					disabled={!draft.trim()}
					className="h-[36px] w-[46px] shrink-0"
					aria-label="Add keyword"
				>
					<Plus size={18} />
				</Button>
			</div>
			{(value || []).length > 0 && (
				<div className="flex flex-wrap gap-2 mt-2">
					{(value || []).map((keyword) => (
						<Badge
							key={keyword}
							variant="outline"
							className="rounded-full px-3 py-1 text-[13px] bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
						>
							{keyword}
							<button
								type="button"
								onClick={() => onChange((value || []).filter((k) => k !== keyword))}
								className="rounded-full p-0.5 hover:bg-black/10"
								aria-label={`Remove ${keyword}`}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
