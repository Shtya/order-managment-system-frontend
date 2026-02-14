import React from "react";
export default function InfoCard({
	title,
	value,
	icon,
	bg,
	iconColor,
	iconBorder,
	editable,
	isAddCard,
	onEdit,
	onDelete,
	onClick,
	customStyles,
}) {
	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	const handleEdit = (e) => {
		e.stopPropagation();
		if (onEdit) onEdit();
	};

	const handleDelete = (e) => {
		e.stopPropagation();
		if (onDelete) onDelete();
	};
	const Icon = icon;
	if (isAddCard) {
		return (
			<button
				onClick={handleClick}
				className={[
					"relative w-full rounded-lg px-5 border-2 border-dashed h-[100px]",
					"border-[#CCCCCC] dark:border-[#374151]",
					"hover:border-primary dark:hover:border-primary",
					"hover:bg-primary/5 dark:hover:bg-primary/10",
					"transition-all duration-200",
					"cursor-pointer group",
				].join(" ")}
			>
				<div className="flex flex-col items-center justify-center gap-3 ">
					<div
						className={[
							"w-[40px] h-[40px] rounded-full",
							"border-2 border-dashed",
							"border-[#CCCCCC] dark:border-[#374151]",
							"group-hover:border-primary dark:group-hover:border-primary",
							"flex items-center justify-center",
							"transition-all duration-200",
						].join(" ")}
					>
						<Icon
							size={22}
							className="text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors"
						/>
					</div>
					<div className="text-[16px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
						{title}
					</div>
				</div>
			</button>
		);
	}

	return (
		<div
			className={[
				"relative w-full rounded-lg p-5 border group",
				"border-[#EEEEEE] dark:border-[#1F2937]",
				"shadow-[0_14px_30px_rgba(0,0,0,0.08)] dark:shadow-none",
				bg,
				editable && "cursor-pointer hover:shadow-xl transition-all duration-200",
			].join(" ")}
			onClick={editable ? handleClick : undefined}
		>
			<div className="flex items-start gap-3">
				<div
					className={[
						"w-[40px] h-[40px] rounded-full",
						"border-2 border-dashed flex-shrink-0",
						iconBorder || "",
						"flex items-center justify-center",
					].join(" ")}
					style={{
						borderColor: customStyles?.iconBorder || undefined,
					}}
				>
					<Icon
						size={22}
						className={`${iconColor} dark:opacity-90`}
						style={{
							color: customStyles?.iconColor || undefined,
						}}
					/>
				</div>

				<div className="flex-1 min-w-0">
					<div className="text-[18px] font-extrabold text-[#020024] dark:text-gray-100 truncate">
						{title}
					</div>
					<div className="mt-1 text-[18px] font-[600] text-[#637381] dark:text-gray-400">
						{value}
					</div>
				</div>

				{editable && (
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<button
							onClick={handleEdit}
							className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 transition-colors"
							title="Edit"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
								<path d="m15 5 4 4" />
							</svg>
						</button>
						<button
							onClick={handleDelete}
							className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
							title="Delete"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M3 6h18" />
								<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
								<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
							</svg>
						</button>
					</div>
				)}

				{/* {!editable && (
					<div className="flex-shrink-0">
						<div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
						</div>
					</div>
				)} */}
			</div>
		</div>
	);
}