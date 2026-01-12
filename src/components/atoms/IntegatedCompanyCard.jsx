import { Settings } from "lucide-react";
import { Switch } from "../ui/switch";
import { useTranslations } from "next-intl";

export default function IntegratedCompanyCard({
	company,
	onToggle,
	onEditSettings,
}) {
	const t = useTranslations("")
	return (
		<div
			className="relative rounded-2xl p-5 shadow-sm border border-border"
			style={{
				background: company.bg?.replace("background:", ""),
			}}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className=" ">
					<h3 className="font-semibold text-base"> {t("integrated.link")}</h3>
					<a
						href={`https://${company.website}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-primary  underline"
					>
						{company.website}
					</a>
				</div>
				<img
					src={company.logo}
					alt={company.name}
					className="w-full max-w-[150px] h-[60px] object-contain"
				/>
			</div>

			{/* Description */}
			<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
				{company.description}
			</p>

			{/* Footer */}
			<div className="mt-5 flex justify-between items-center">
				<button
					onClick={() => onEditSettings(company)}
					className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted transition"
				>
					<Settings size={16} />
					{t("integrated.edit_settings")}
				</button>

				{/* Toggle (shadcn) */}
				<Switch
					checked={company.enabled}
					onCheckedChange={() => onToggle(company.id)}
				/>
			</div>
		</div>
	);
}
