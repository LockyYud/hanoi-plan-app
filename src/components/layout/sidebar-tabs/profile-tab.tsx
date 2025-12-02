"use client";

import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/common";
import type { Pinory } from "@/lib/types";

interface ProfileTabProps {
    session: any;
    status: "loading" | "authenticated" | "unauthenticated";
    pinories: any[];
    filteredPlaces: Pinory[];
}

export function ProfileTab({
    session,
    status,
    pinories,
    filteredPlaces,
}: ProfileTabProps) {
    return (
        <div className="p-6 space-y-6">
            {status === "loading" ? (
                <div className="text-center py-12">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand/30 border-t-brand mx-auto mb-4"></div>
                        <div className="absolute inset-0 rounded-full bg-brand/10 blur-xl animate-pulse"></div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Đang tải...
                    </p>
                </div>
            ) : session ? (
                <>
                    {/* Profile Card - Enhanced */}
                    <div className="relative bg-card/90 rounded-3xl p-6 border border-border/60 shadow-2xl overflow-hidden">
                        {/* Decorative top gradient */}
                        <div className="absolute top-0 left-0 right-0 h-20 bg-brand/10"></div>

                        <div className="relative text-center">
                            <div className="relative w-24 h-24 bg-brand rounded-3xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-neutral-700/50 p-0.5">
                                <div className="w-full h-full rounded-3xl overflow-hidden bg-card">
                                    {session.user?.image ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={session.user.image}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-brand">
                                            <User className="h-12 w-12 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="font-bold text-xl text-foreground mb-1.5">
                                {session.user?.name || "Người dùng"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-5">
                                {session.user?.email}
                            </p>

                            {/* Enhanced Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group bg-brand/15 border border-brand/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-brand/20 transition-all duration-300">
                                    <div className="font-black text-2xl text-brand mb-1">
                                        {pinories.length}
                                    </div>
                                    <div className="text-xs text-brand-accent font-semibold">
                                        Ghi chú
                                    </div>
                                </div>
                                <div className="relative group bg-green-500/15 border border-green-500/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
                                    <div className="font-black text-2xl text-green-400 mb-1">
                                        {
                                            filteredPlaces.filter(
                                                (p) =>
                                                    p.images &&
                                                    p.images.length > 0
                                            ).length
                                        }
                                    </div>
                                    <div className="text-xs text-green-300 font-semibold">
                                        Có ảnh
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - Enhanced */}
                    <div className="space-y-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3 px-1">
                            Thao tác nhanh
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card/60 border border-border/50 rounded-2xl">
                            <span className="text-sm font-medium text-foreground">
                                Giao diện
                            </span>
                            <ThemeToggle variant="dropdown" />
                        </div>

                        <Button
                            variant="outline"
                            className="w-full justify-start h-14 bg-red-900/60 border-red-800/60 text-red-400 hover:bg-red-800/80 hover:border-red-700 hover:shadow-lg hover:shadow-red-900/30 rounded-2xl group transition-all duration-300 hover:scale-[1.02]"
                            onClick={() => signOut()}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900/50 mr-3 group-hover:bg-red-800/70 transition-colors">
                                        <LogOut className="h-5 w-5 group-hover:text-red-300 transition-colors" />
                                    </div>
                                    <span className="font-bold">Đăng xuất</span>
                                </div>
                            </div>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 px-4">
                    <div className="relative w-24 h-24 bg-secondary rounded-3xl mx-auto mb-6 flex items-center justify-center ring-4 ring-neutral-600/50 overflow-hidden group hover:scale-105 transition-transform duration-300">
                        <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <User className="h-12 w-12 text-muted-foreground relative z-10" />
                    </div>
                    <h3 className="font-bold text-2xl text-foreground mb-3">
                        Chào mừng đến với Pinory! 👋
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto">
                        Đăng nhập để bắt đầu ghim câu chuyện của bạn
                    </p>

                    {/* Login Button - Enhanced */}
                    <Button
                        onClick={() => (window.location.href = "/auth/signin")}
                        className="w-full h-14 bg-brand hover:bg-brand-hover text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-brand/40 transition-all duration-300 transform hover:scale-[1.03] mb-4 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <div className="flex items-center justify-center relative z-10">
                            <User className="h-5 w-5 mr-2" />
                            Đăng nhập
                        </div>
                    </Button>

                    {/* Quick info */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>📝 Lưu ghi chú</span>
                        <span>•</span>
                        <span>👥 Tạo nhóm</span>
                        <span>•</span>
                        <span>🔗 Chia sẻ</span>
                    </div>
                </div>
            )}
        </div>
    );
}
