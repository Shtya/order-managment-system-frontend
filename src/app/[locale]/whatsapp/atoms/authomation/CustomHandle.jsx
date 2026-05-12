// components/flow/CustomHandle.tsx
import { Handle, Connection, HandleProps } from '@xyflow/react';
import { cn } from '@/utils/cn';

export function CustomHandle({ isConnected, position, noOffset, className, ...props }) {
    return (
        <Handle
            position={position}
            {...props}
            className={cn(
                "!w-3 !h-3 !border-2 !border-white transition-all duration-200",
                // Glowing effect if connected
                isConnected ? "!bg-primary !ring-4 !ring-primary/20" : "!bg-slate-400",
                // Position-based styling
                !noOffset && (position === 'top' ? "!-top-1.5" : "!-bottom-1.5"),
                "hover:!scale-150 hover:!bg-primary cursor-crosshair",
                className
            )}
            style={{ ...props.style }}
        />
    );
}