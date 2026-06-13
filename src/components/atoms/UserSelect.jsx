"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { useTranslations } from "use-intl";

const PAGE_SIZE = 10;

export function avatarSrc(url) {
	if (!url) return "";
	if (url.startsWith("blob")) return url;
	if (url.startsWith("data:")) return url;
	if (url.startsWith("http")) return url;
	const base = process.env.NEXT_PUBLIC_BASE_URL || "";
	return `${base.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}


export default function UserSelect({ value, onSelect, placeholder = "Select user", className, contentClassName, allowAll = false, allLabel = "All", allowNone = false, noneLabel }) {
	const t = useTranslations("common");
	const finalNoneLabel = noneLabel ?? t("common.none");
	const [users, setUsers] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [initialized, setInitialized] = useState(false);
	const [open, setOpen] = useState(false);

	const fetchPage = useCallback(async (cursor = null) => {
		const isFirst = cursor == null;
		if (isFirst) setLoading(true);
		else setLoadingMore(true);

		try {
			const params = { limit: PAGE_SIZE, active: "true" };
			if (cursor != null) params.cursor = cursor;

			const res = await api.get("/users/list", { params });
			const data = res.data?.data ?? [];
			const next = res.data?.nextCursor ?? null;

			if (isFirst) {
				setUsers(data);
				setNextCursor(next);
			} else {
				setUsers((prev) => [...prev, ...data]);
				setNextCursor(next);
			}
		} catch (err) {
			console.error("UserSelect fetch error:", err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
			setInitialized(true)
		}
	}, []);

	// 2. Simplify the effect dependencies
	useEffect(() => {
		if (!initialized && !loading) {
			fetchPage();
		}
	}, [initialized, loading, fetchPage]);

	const handleSelect = (user) => {
		onSelect?.(user);
		setOpen(false);
	};

	const selectedUser = value && value !== "all" && value !== "none" ? users.find((u) => Number(u.id) === Number(value)) : null;
	const showAll = allowAll;
	const showNone = allowNone;

	const displayValue = value === "none" ? finalNoneLabel : value === "all" ? allLabel : selectedUser?.name;

	return (
		<Select
			value={value}
			onValueChange={(v) => {

				if (v === "all") onSelect?.(null);
				else if (v === "none") onSelect?.("none");
				else {
					const user = users.find(u => String(u.id) === v);
					if (user) handleSelect(user);
				}
			}}
			open={open}
			onOpenChange={setOpen}
		>
			<SelectTrigger className={className} style={{}} >
				<SelectValue placeholder={placeholder}>
					{displayValue && (
						<div className="flex items-center gap-2">
							{selectedUser && (
								<Avatar className="h-7 w-7 shrink-0">
									<AvatarFallback className="text-[10px]">
										{(selectedUser.name || "?").slice(0, 2).toUpperCase()}
									</AvatarFallback>
									<AvatarImage src={avatarSrc(selectedUser.avatarUrl)} alt={selectedUser.name} />
								</Avatar>
							)}
							<span className="truncate">{displayValue}</span>
						</div>
					)}
				</SelectValue>
			</SelectTrigger>

			<SelectContent className={`bg-card-select max-h-[300px] ${contentClassName}`}>
				{showNone && (
					<SelectItem value="none">
						{finalNoneLabel}
					</SelectItem>
				)}
				{showAll && (
					<SelectItem value="all">
						{allLabel}
					</SelectItem>
				)}

				{loading && users.length === 0 ? (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					users.map((user) => (
						<SelectItem key={user.id} value={String(user.id)}>
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7 shrink-0">
									<AvatarFallback className="text-[10px]">
										{(user.name || "?").slice(0, 2).toUpperCase()}
									</AvatarFallback>
									<AvatarImage src={avatarSrc(user.avatarUrl)} alt={user.name} />
								</Avatar>
								<span className="truncate">{user.name}</span>
							</div>
						</SelectItem>
					))
				)}

				{nextCursor && (
					<div className="border-t p-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full h-8 text-xs"
							onClick={(e) => {
								e.stopPropagation(); // Prevent select closing
								fetchPage(nextCursor);
							}}
							disabled={loadingMore}
						>
							{loadingMore ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								t("loadMore")
							)}
						</Button>
					</div>
				)}
			</SelectContent>
		</Select>
	);
}