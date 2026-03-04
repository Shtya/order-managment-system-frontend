import { cn } from "@/utils/cn";

export function Bone({ className }) {
    return <div className={cn("rounded-lg bg-muted/50 animate-pulse", className)} />;
}

export function BannerSkeleton() {
    return (
        <div className="p-4 rounded-xl bg-[var(--secondary)]/60 border border-border/40 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <Bone className="h-2.5 w-14" />
                    <Bone className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}