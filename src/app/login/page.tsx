"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-sm">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (session) {
        return null; // Will redirect to home
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-card via-[#111111] to-[#0C0C0C] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Back button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">Quay lại trang chủ</span>
                </Link>

                <Card className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/80 border border-neutral-700/50 backdrop-blur-xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center ring-2 ring-neutral-700 shadow-lg">
                            <User className="h-10 w-10 text-white" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20"></div>
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Đăng nhập vào Pinory 🔐
                        </h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Bắt đầu ghim câu chuyện của bạn
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/30 rounded-xl p-4">
                            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                            <span>Lưu trữ ghi chú không giới hạn</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700/30 rounded-xl p-4">
                            <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                            <span>Tạo nhóm và chia sẻ với bạn bè</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/30 rounded-xl p-4">
                            <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                            <span>Đồng bộ trên mọi thiết bị</span>
                        </div>
                    </div>

                    {/* Login Button */}
                    <div className="space-y-4">
                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
                            "demo-google-client-id" ? (
                            <Button
                                onClick={() => signIn("google")}
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                    >
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
                                    <span className="text-base">
                                        Đăng nhập với Google
                                    </span>
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

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-neutral-700/50 text-center">
                        <p className="text-xs text-muted-foreground">
                            Bằng việc đăng nhập, bạn đồng ý với{" "}
                            <Link
                                href="/terms"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Điều khoản sử dụng
                            </Link>{" "}
                            và{" "}
                            <Link
                                href="/privacy"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
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
