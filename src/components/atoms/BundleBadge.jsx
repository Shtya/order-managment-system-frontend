import { Package } from "lucide-react";


export function BundleBadge({ bundleName }) {
	if (!bundleName) return null;

	return (
		<div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
			<Package size={10} />
			<span className="text-[10px] font-medium tracking-wide">
				{bundleName}
			</span>
		</div>
	);
}