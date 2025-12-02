"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
    readonly variant?: "default" | "dropdown" | "icon-only";
    readonly className?: string;
}

export function ThemeToggle({
    variant = "default",
    className,
}: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className={className} disabled>
                <Sun className="h-5 w-5" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    const cycleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else if (theme === "dark") {
            setTheme("system");
        } else {
            setTheme("light");
        }
    };

    const getThemeIcon = () => {
        if (resolvedTheme === "dark") {
            return (
                <>
                    <Moon className="h-4 w-4" />
                    Dark
                </>
            );
        }
        if (theme === "system") {
            return (
                <>
                    <Monitor className="h-4 w-4" />
                    System
                </>
            );
        }
        return (
            <>
                <Sun className="h-4 w-4" />
                Light
            </>
        );
    };

    if (variant === "icon-only") {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={cycleTheme}
                className={className}
                title={`Current: ${theme} (click to change)`}
            >
                {resolvedTheme === "dark" ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    if (variant === "dropdown") {
        return (
            <div className={`flex items-center gap-1 ${className}`}>
                <Button
                    variant={theme === "light" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setTheme("light")}
                    title="Light mode"
                >
                    <Sun className="h-4 w-4" />
                    <span className="sr-only">Light mode</span>
                </Button>
                <Button
                    variant={theme === "dark" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setTheme("dark")}
                    title="Dark mode"
                >
                    <Moon className="h-4 w-4" />
                    <span className="sr-only">Dark mode</span>
                </Button>
                <Button
                    variant={theme === "system" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setTheme("system")}
                    title="System theme"
                >
                    <Monitor className="h-4 w-4" />
                    <span className="sr-only">System theme</span>
                </Button>
            </div>
        );
    }

    // Default: Button with label
    return (
        <Button
            variant="outline"
            onClick={cycleTheme}
            className={`gap-2 ${className}`}
        >
            {getThemeIcon()}
        </Button>
    );
}

export default ThemeToggle;
