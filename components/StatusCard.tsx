import { cn } from "@/lib/utils"; // Assumes you have a utility for merging class names
import React from "react";

interface StatusCardProps {
    title: string;
    description?: string;
    className?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export default function StatusCard({
    title,
    description,
    className,
    action,
    children,
}: StatusCardProps) {
    return (
        <div
            className={cn(
                "min-h-screen w-full flex flex-col items-center justify-center p-4",
                className
            )}
        >
            <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
                {/* Icon or Spinner */}
                <div className="mb-6">{children}</div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

                {/* Optional Description */}
                {description && (
                    <p className="mt-2 text-muted-foreground">{description}</p>
                )}

                {/* Optional Action Button */}
                {action && <div className="mt-8 w-full">{action}</div>}
            </div>
        </div>
    );
}