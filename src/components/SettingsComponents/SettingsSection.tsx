import React from "react";

interface SettingsSectionProps {
    title: string;
    description: string | string[];
    children: React.ReactNode;
    titleClassName?: string;
    className?: string;
}

export function SettingsSection({
    title,
    description,
    children,
    titleClassName = "",
    className = "space-y-4",
}: SettingsSectionProps) {
    const descriptions = Array.isArray(description) ? description : [description];

    return (
        <div className={`w-full bg-card border border-border rounded-xl p-6 shadow-sm ${className}`}>
            <div className="space-y-1.5">
                <h2
                    className={`text-xl font-semibold leading-none tracking-tight ${titleClassName}`}
                    style={{ fontFamily: "Bahnschrift, sans-serif" }}
                >
                    {title}
                </h2>
                {descriptions.map((desc, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                        {desc}
                    </p>
                ))}
            </div>
            <div className="pt-2">{children}</div>
        </div>
    );
}