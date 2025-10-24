"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to home if already logged in
  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#A0A0A0] text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0C0C] via-[#1a0f0f] to-[#0C0C0C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations with Pinory colors */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient spotlights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FF6B6B]/10 via-[#FFD6A5]/8 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-[#FF8E53]/10 via-[#FF6B6B]/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Subtle map background */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF6B6B 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Floating heart pins */}
        <div className="absolute top-20 left-[15%] text-[#FF6B6B]/20 animate-float">❤️</div>
        <div className="absolute top-40 right-[20%] text-[#FF6B6B]/15 animate-float" style={{ animationDelay: '2s' }}>❤️</div>
        <div className="absolute bottom-32 left-[25%] text-[#FF6B6B]/20 animate-float" style={{ animationDelay: '4s' }}>❤️</div>
        <div className="absolute bottom-20 right-[15%] text-[#FF6B6B]/15 animate-float" style={{ animationDelay: '3s' }}>❤️</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex justify-center mb-2">
            <img 
              src="/pinory-logo-full.svg" 
              alt="Pinory - Pin Your Story" 
              className="h-20 w-auto"
            />
          </div>
        </div>

        <Card className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 border border-neutral-700/50 backdrop-blur-xl shadow-2xl p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Pinory icon with pulsing glow */}
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center animate-glow">
              <img 
                src="/pinory-icon-simple.svg" 
                alt="Pinory Icon" 
                className="w-full h-full"
              />
              {/* Spotlight behind icon */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] blur-2xl opacity-40 -z-10"></div>
            </div>

            <h1 className="text-2xl font-bold text-[#EDEDED] mb-2">
              Chào mừng bạn trở lại 🌍
            </h1>
            <p className="text-[#EDEDED]/80 leading-relaxed mb-1">
              Tiếp tục hành trình của bạn với Pinory
            </p>
            <p className="text-sm text-[#A0A0A0] italic">
              Pin lại những nơi bạn đã đi qua, và câu chuyện bạn đã sống.
            </p>
          </div>

          {/* Benefits with hover effects */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-[#EDEDED]/90 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 border border-[#FF6B6B]/30 rounded-xl p-4 transition-all duration-300 hover:border-[#FF6B6B]/60 hover:shadow-lg hover:shadow-[#FF6B6B]/20 hover:translate-x-1 group cursor-default">
              <div className="w-2 h-2 bg-[#FF6B6B] rounded-full flex-shrink-0 group-hover:animate-ping"></div>
              <span className="group-hover:text-[#EDEDED]">📝 Lưu trữ ghi chú không giới hạn</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#EDEDED]/90 bg-gradient-to-r from-[#FFD6A5]/20 to-[#FF8E53]/20 border border-[#FFD6A5]/30 rounded-xl p-4 transition-all duration-300 hover:border-[#FFD6A5]/60 hover:shadow-lg hover:shadow-[#FFD6A5]/20 hover:translate-x-1 group cursor-default">
              <div className="w-2 h-2 bg-[#FFD6A5] rounded-full flex-shrink-0 group-hover:animate-ping"></div>
              <span className="group-hover:text-[#EDEDED]">👥 Tạo nhóm và chia sẻ với bạn bè</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#EDEDED]/90 bg-gradient-to-r from-[#FF8E53]/20 to-[#FF6B6B]/20 border border-[#FF8E53]/30 rounded-xl p-4 transition-all duration-300 hover:border-[#FF8E53]/60 hover:shadow-lg hover:shadow-[#FF8E53]/20 hover:translate-x-1 group cursor-default">
              <div className="w-2 h-2 bg-[#FF8E53] rounded-full flex-shrink-0 group-hover:animate-ping"></div>
              <span className="group-hover:text-[#EDEDED]">🔄 Đồng bộ trên mọi thiết bị</span>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
              "demo-google-client-id" ? (
              <Button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full h-14 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#FF6B6B]/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-base">Đăng nhập với Google</span>
                </div>
              </Button>
            ) : (
              <div className="p-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-xl">
                <p className="text-sm text-amber-400 mb-3 font-medium">
                  🔧 Cần cấu hình Google OAuth
                </p>
                <p className="text-xs text-amber-300 mb-3">
                  Để sử dụng đăng nhập, vui lòng:
                </p>
                <ol className="text-xs text-amber-200 ml-4 space-y-1 list-decimal">
                  <li>Tạo Google OAuth app</li>
                  <li>Cập nhật .env.local</li>
                  <li>Restart dev server</li>
                </ol>
              </div>
            )}
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#A0A0A0]">
              Chưa có tài khoản?{" "}
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="text-[#FF6B6B] hover:text-[#FF8E53] font-medium transition-colors hover:underline"
              >
                Bắt đầu hành trình của bạn ngay hôm nay
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-neutral-700/50 text-center">
            <p className="text-xs text-[#A0A0A0]">
              Bằng việc đăng nhập, bạn đồng ý với{" "}
              <Link
                href="/terms"
                className="text-[#FF8E53] hover:text-[#FF6B6B] transition-colors"
              >
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                className="text-[#FF8E53] hover:text-[#FF6B6B] transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
