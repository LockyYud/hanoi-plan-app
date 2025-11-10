"use client";

import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ExtendedPlace } from "./places-tab";

interface ProfileTabProps {
  session: any;
  status: "loading" | "authenticated" | "unauthenticated";
  places: any[];
  filteredPlaces: any[];
}

export function ProfileTab({
  session,
  status,
  places,
  filteredPlaces,
}: ProfileTabProps) {
  return (
    <div className="p-6 space-y-6">
      {status === "loading" ? (
        <div className="text-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#FF6B6B]/30 border-t-[#FF6B6B] mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-[#FF6B6B]/10 blur-xl animate-pulse"></div>
          </div>
          <p className="text-[#A0A0A0] text-sm font-medium">Đang tải...</p>
        </div>
      ) : session ? (
        <>
          {/* Profile Card - Enhanced */}
          <div className="relative bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 rounded-3xl p-6 border border-neutral-700/60 shadow-2xl overflow-hidden">
            {/* Decorative top gradient */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#FF6B6B]/10 to-transparent"></div>

            <div className="relative text-center">
              <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FFD6A5] rounded-3xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-neutral-700/50 p-0.5">
                <div className="w-full h-full rounded-3xl overflow-hidden bg-neutral-900">
                  {session.user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={session.user.image}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53]">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-xl text-[#EDEDED] mb-1.5">
                {session.user?.name || "Người dùng"}
              </h3>
              <p className="text-sm text-[#A0A0A0] mb-5">
                {session.user?.email}
              </p>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group bg-gradient-to-br from-[#FF6B6B]/20 via-[#FF6B6B]/10 to-transparent border border-[#FF6B6B]/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all duration-300">
                  <div className="font-black text-2xl text-[#FF6B6B] mb-1">
                    {places.length}
                  </div>
                  <div className="text-xs text-[#FFD6A5] font-semibold">
                    Ghi chú
                  </div>
                </div>
                <div className="relative group bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border border-green-500/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
                  <div className="font-black text-2xl text-green-400 mb-1">
                    {
                      filteredPlaces.filter(
                        (p) =>
                          (p as ExtendedPlace).images &&
                          (p as ExtendedPlace).images.length > 0
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
            <div className="text-xs text-[#A0A0A0] uppercase tracking-wider font-bold mb-3 px-1">
              Thao tác nhanh
            </div>

            <Button
              variant="outline"
              className="w-full justify-start h-14 bg-gradient-to-r from-red-950/60 to-red-900/60 border-red-800/60 text-red-400 hover:bg-gradient-to-r hover:from-red-900/80 hover:to-red-800/80 hover:border-red-700 hover:shadow-lg hover:shadow-red-900/30 rounded-2xl group transition-all duration-300 hover:scale-[1.02]"
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
          <div className="relative w-24 h-24 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-3xl mx-auto mb-6 flex items-center justify-center ring-4 ring-neutral-600/50 overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8E53]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <User className="h-12 w-12 text-[#A0A0A0] relative z-10" />
          </div>
          <h3 className="font-bold text-2xl text-[#EDEDED] mb-3">
            Chào mừng đến với Pinory! 👋
          </h3>
          <p className="text-sm text-[#A0A0A0] mb-8 leading-relaxed max-w-sm mx-auto">
            Đăng nhập để bắt đầu ghim câu chuyện của bạn
          </p>

          {/* Login Button - Enhanced */}
          <Button
            onClick={() => (window.location.href = "/auth/signin")}
            className="w-full h-14 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FF6B6B] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-[#FF6B6B]/40 transition-all duration-300 transform hover:scale-[1.03] mb-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <div className="flex items-center justify-center relative z-10">
              <User className="h-5 w-5 mr-2" />
              Đăng nhập
            </div>
          </Button>

          {/* Quick info */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
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
