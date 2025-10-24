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
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#FF6B6B]/30 border-t-[#FF6B6B] mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-[#FF6B6B]/20 blur-xl animate-pulse"></div>
          </div>
          <p className="text-[#EDEDED]/80 text-sm font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0f0f] to-[#0C0C0C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-[#FF6B6B]/15 via-[#FFD6A5]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-[#FF8E53]/15 via-[#FF6B6B]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-[#FFD6A5]/8 to-[#FF8E53]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(#FF6B6B 1px, transparent 1px),
            linear-gradient(90deg, #FF6B6B 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Radial dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #FF8E53 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Floating elements with stagger */}
        <div className="absolute top-20 left-[12%] text-3xl opacity-20 animate-float">📍</div>
        <div className="absolute top-32 right-[18%] text-2xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🗺️</div>
        <div className="absolute bottom-28 left-[20%] text-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}>❤️</div>
        <div className="absolute bottom-16 right-[15%] text-2xl opacity-15 animate-float" style={{ animationDelay: '2.5s' }}>✨</div>
        <div className="absolute top-1/3 left-[8%] text-xl opacity-10 animate-float" style={{ animationDelay: '4s' }}>🌍</div>
        <div className="absolute top-1/2 right-[10%] text-xl opacity-10 animate-float" style={{ animationDelay: '3.5s' }}>📸</div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo with enhanced entrance */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-3">
            <div className="relative group">
              <img 
                src="/pinory-logo-full.svg" 
                alt="Pinory - Pin Your Story" 
                className="h-24 w-auto transition-all duration-500 group-hover:scale-105"
                onClick={() => router.push("/")}
              />
              {/* Glow behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/30 to-[#FF8E53]/30 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>

        <Card className="relative bg-gradient-to-br from-neutral-900/95 via-neutral-800/95 to-neutral-900/95 border border-neutral-700/60 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden animate-slide-up">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B6B] via-[#FFD6A5] to-[#FF8E53]"></div>
          
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6B6B]/20 via-[#FFD6A5]/20 to-[#FF8E53]/20 rounded-3xl blur-xl opacity-50 -z-10"></div>
          
          <div className="relative p-10">
            {/* Header with enhanced icon */}
            <div className="text-center mb-10">
              {/* Animated icon container */}
              <div className="relative w-28 h-28 mx-auto mb-7 flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/30 to-[#FF8E53]/30 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD6A5]/30 to-[#FF6B6B]/30 rounded-3xl -rotate-6 group-hover:-rotate-12 transition-transform duration-500"></div>
                <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-5 border border-neutral-700/50">
                  <img 
                    src="/pinory-icon-simple.svg" 
                    alt="Pinory Icon" 
                    className="w-16 h-16 transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {/* Pulsing glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] blur-2xl opacity-40 animate-pulse -z-10"></div>
              </div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#EDEDED] via-[#FFD6A5] to-[#EDEDED] bg-clip-text text-transparent mb-3 animate-gradient">
                Chào mừng đến với Pinory
              </h1>
              <p className="text-[#EDEDED]/90 text-base leading-relaxed mb-2 font-medium">
                Bắt đầu hành trình khám phá của bạn
              </p>
              <p className="text-sm text-[#A0A0A0] italic max-w-sm mx-auto leading-relaxed">
                Pin lại những nơi bạn đã đi qua, và câu chuyện bạn đã sống 🗺️✨
              </p>
            </div>

            {/* Enhanced benefits grid */}
            <div className="space-y-3 mb-10">
              <div className="group flex items-start gap-4 text-sm bg-gradient-to-br from-[#FF6B6B]/10 via-[#FF6B6B]/5 to-transparent border border-[#FF6B6B]/30 rounded-2xl p-4 transition-all duration-500 hover:border-[#FF6B6B]/70 hover:shadow-lg hover:shadow-[#FF6B6B]/25 hover:translate-x-2 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/10 to-[#FF6B6B]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B]/30 to-[#FF8E53]/30 flex items-center justify-center border border-[#FF6B6B]/40 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">📝</span>
                </div>
                <div className="relative flex-1 pt-1">
                  <p className="text-[#EDEDED] font-medium group-hover:text-[#FFD6A5] transition-colors">Lưu trữ ghi chú không giới hạn</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">Ghi lại mọi khoảnh khắc đáng nhớ</p>
                </div>
              </div>

              <div className="group flex items-start gap-4 text-sm bg-gradient-to-br from-[#FFD6A5]/10 via-[#FFD6A5]/5 to-transparent border border-[#FFD6A5]/30 rounded-2xl p-4 transition-all duration-500 hover:border-[#FFD6A5]/70 hover:shadow-lg hover:shadow-[#FFD6A5]/25 hover:translate-x-2 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD6A5]/0 via-[#FFD6A5]/10 to-[#FFD6A5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD6A5]/30 to-[#FF8E53]/30 flex items-center justify-center border border-[#FFD6A5]/40 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">👥</span>
                </div>
                <div className="relative flex-1 pt-1">
                  <p className="text-[#EDEDED] font-medium group-hover:text-[#FFD6A5] transition-colors">Tạo nhóm và chia sẻ với bạn bè</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">Lên kế hoạch cùng nhau dễ dàng</p>
                </div>
              </div>

              <div className="group flex items-start gap-4 text-sm bg-gradient-to-br from-[#FF8E53]/10 via-[#FF8E53]/5 to-transparent border border-[#FF8E53]/30 rounded-2xl p-4 transition-all duration-500 hover:border-[#FF8E53]/70 hover:shadow-lg hover:shadow-[#FF8E53]/25 hover:translate-x-2 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF8E53]/0 via-[#FF8E53]/10 to-[#FF8E53]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8E53]/30 to-[#FF6B6B]/30 flex items-center justify-center border border-[#FF8E53]/40 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">🔄</span>
                </div>
                <div className="relative flex-1 pt-1">
                  <p className="text-[#EDEDED] font-medium group-hover:text-[#FFD6A5] transition-colors">Đồng bộ trên mọi thiết bị</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">Truy cập mọi lúc, mọi nơi</p>
                </div>
              </div>
            </div>

            {/* Enhanced Login Button */}
            <div className="space-y-5">
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
              process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
                "demo-google-client-id" ? (
                <Button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="w-full h-16 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FF6B6B] bg-size-200 hover:bg-right-bottom text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-[#FF6B6B]/60 transition-all duration-500 transform hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                  
                  <div className="flex items-center justify-center gap-4 relative z-10">
                    <svg className="w-6 h-6 group-hover:rotate-[360deg] transition-transform duration-700" viewBox="0 0 24 24">
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
                    <span className="text-lg tracking-wide">Đăng nhập với Google</span>
                  </div>
                </Button>
              ) : (
                <div className="relative p-6 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-600/60 rounded-2xl backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                        <span className="text-xl">🔧</span>
                      </div>
                      <p className="text-base text-amber-300 font-semibold">
                        Cần cấu hình Google OAuth
                      </p>
                    </div>
                    <p className="text-sm text-amber-200/90 mb-4">
                      Để sử dụng đăng nhập, vui lòng:
                    </p>
                    <ol className="text-sm text-amber-100/90 ml-5 space-y-2 list-decimal">
                      <li>Tạo Google OAuth app</li>
                      <li>Cập nhật .env.local</li>
                      <li>Restart dev server</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Sign up link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#A0A0A0]">
                Chưa có tài khoản?{" "}
                <button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="text-transparent bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] bg-clip-text hover:from-[#FF8E53] hover:to-[#FFD6A5] font-semibold transition-all hover:underline decoration-2 underline-offset-4"
                >
                  Bắt đầu hành trình ngay hôm nay →
                </button>
              </p>
            </div>

            {/* Enhanced Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-700/50 text-center">
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Bằng việc đăng nhập, bạn đồng ý với{" "}
                <Link
                  href="/terms"
                  className="text-[#FF8E53] hover:text-[#FFD6A5] transition-colors font-medium underline-offset-2 hover:underline"
                >
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link
                  href="/privacy"
                  className="text-[#FF8E53] hover:text-[#FFD6A5] transition-colors font-medium underline-offset-2 hover:underline"
                >
                  Chính sách bảo mật
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Tagline */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-[#A0A0A0] text-sm italic">
            ✨ Biến mọi chuyến đi thành kỷ niệm vĩnh cửu
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% 100%;
        }
        .bg-right-bottom {
          background-position: right bottom;
        }
      `}</style>
    </div>
  );
}
