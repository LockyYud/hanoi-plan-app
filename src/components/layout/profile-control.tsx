"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

// Custom hook to detect mobile viewport
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
}

// Profile Content Component - extracted to avoid nested component definition
interface ProfileContentProps {
    readonly session: any;
    readonly theme: string | undefined;
    readonly onToggleTheme: () => void;
    readonly onSignIn: () => void;
    readonly onSignOut: () => void;
}

function ProfileContent({
    session,
    theme,
    onToggleTheme,
    onSignIn,
    onSignOut,
}: ProfileContentProps) {
    return (
        <div className="p-4 space-y-4">
            {session ? (
                <>
                    {/* User Info */}
                    <div
                        className="flex items-center gap-3 pb-3 border-b"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <div
                            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                            style={{
                                backgroundColor: "var(--color-primary-500)",
                            }}
                        >
                            {session.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                                {session.user?.name || "Người dùng"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {session.user?.email}
                            </p>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {theme === "dark" ? (
                                <Moon className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <Sun className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-foreground">
                                Giao diện
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
                            {theme === "dark" ? "Tối" : "Sáng"}
                        </span>
                    </button>

                    {/* Sign Out */}
                    <button
                        onClick={onSignOut}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                </>
            ) : (
                <>
                    {/* Not logged in */}
                    <div className="text-center py-4">
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ backgroundColor: "var(--secondary)" }}
                        >
                            <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">
                            Chào mừng đến Pinory!
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Đăng nhập để lưu kỷ niệm của bạn
                        </p>
                        <Button
                            onClick={onSignIn}
                            className="w-full"
                            style={{
                                backgroundColor: "var(--color-primary-500)",
                                color: "var(--primary-foreground)",
                            }}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Đăng nhập
                        </Button>
                    </div>

                    {/* Theme Toggle for non-logged in users */}
                    <button
                        onClick={onToggleTheme}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors border-t"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <div className="flex items-center gap-3">
                            {theme === "dark" ? (
                                <Moon className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <Sun className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-foreground">
                                Giao diện
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
                            {theme === "dark" ? "Tối" : "Sáng"}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}

export function ProfileControl() {
    const { data: session } = useSession();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-profile-control]")) {
                setIsOpen(false);
            }
        };

        if (isOpen && !isMobile) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [isOpen, isMobile]);

    if (!mounted) return null;

    const handleSignIn = () => {
        router.push("/auth/signin");
        setIsOpen(false);
    };

    const handleSignOut = () => {
        signOut();
        setIsOpen(false);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <>
            {/* Toggle Button */}
            <div className="absolute top-4 right-4 z-[10]" data-profile-control>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsOpen(!isOpen)}
                        className="shadow-lg rounded-full w-12 h-12 border-2 overflow-hidden"
                        style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--card)",
                        }}
                    >
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User
                                className="w-5 h-5"
                                style={{ color: "var(--muted-foreground)" }}
                            />
                        )}
                    </Button>
                </motion.div>

                {/* Desktop Dropdown */}
                {!isMobile && (
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                className="absolute right-0 top-14 w-72 rounded-xl border overflow-hidden"
                                style={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    boxShadow: "var(--shadow-lg)",
                                }}
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25,
                                }}
                            >
                                <ProfileContent
                                    session={session}
                                    theme={theme}
                                    onToggleTheme={toggleTheme}
                                    onSignIn={handleSignIn}
                                    onSignOut={handleSignOut}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Mobile Bottom Sheet */}
            {isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-[100]"
                                style={{
                                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl border-t flex flex-col"
                                style={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    boxShadow:
                                        "0 -4px 20px rgba(0, 0, 0, 0.15)",
                                    height: "50vh",
                                    maxHeight: "70vh",
                                }}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.5 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 100) {
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {/* Drag Handle */}
                                <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
                                    <div
                                        className="w-10 h-1 rounded-full"
                                        style={{
                                            backgroundColor:
                                                "var(--muted-foreground)",
                                            opacity: 0.4,
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div
                                    className="flex-1 overflow-y-auto"
                                    style={{
                                        paddingBottom:
                                            "env(safe-area-inset-bottom, 20px)",
                                    }}
                                >
                                    <ProfileContent
                                        session={session}
                                        theme={theme}
                                        onToggleTheme={toggleTheme}
                                        onSignIn={handleSignIn}
                                        onSignOut={handleSignOut}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
