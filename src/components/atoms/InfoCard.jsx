import React from "react";

export default function InfoCard({ title, value, icon: Icon, bg, iconColor, iconBorder }) {
	return (
		<div
			className={[
				"relative w-full rounded-lg p-5   border",
				"border-[#EEEEEE] dark:border-[#1F2937]",
				"shadow-[0_14px_30px_rgba(0,0,0,0.08)] dark:shadow-none",
				bg,
			].join(" ")}
 		>
 			<div className="flex items-start gap-3">
 				<div
					className={[
						"w-[40px] h-[40px] rounded-full",
						"border-2 border-dashed",
						iconBorder,
						"flex items-center justify-center",
					].join(" ")}
				>
					<Icon
						size={22}
						className={`${iconColor} dark:opacity-90`}
					/>
				</div>

				{/* Text */}
				<div>
					<div className="text-[18px] font-extrabold text-[#020024] dark:text-gray-100">
						{title}
					</div>
					<div className="mt-1 text-[18px] font-[600] text-[#637381] dark:text-gray-400">
						{value}
					</div>
				</div>
			</div>
		</div>
	);
}
