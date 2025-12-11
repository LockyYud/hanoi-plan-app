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
            <div className="dark min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-3 border-brand/30 border-t-brand mx-auto mb-4"></div>
                        <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl animate-pulse"></div>
                    </div>
                    <p className="text-[#fafafa]/80 text-sm font-medium">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (session) {
        return null; // Will redirect to home
    }

    return (
        <div
            className="dark min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background:
                    "radial-gradient(circle at center, #121212 0%, #0A0A0A 60%, #050505 100%)",
            }}
        >
            {/* Enhanced Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-gradient-to-br from-brand/20 to-transparent rounded-full blur-[180px] opacity-70"></div>
                <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-brand-secondary/20 to-transparent rounded-full blur-[180px] opacity-70"></div>

                {/* Orb glow right behind card */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-br from-brand/15 via-brand-secondary/10 to-transparent blur-[140px]" />
                </div>

                {/* Subtle floating pin decoration */}
                <div className="absolute top-20 right-[15%] text-4xl opacity-20 animate-float">
                    📍
                </div>
            </div>

            <div className="relative w-full max-w-md z-10">
                {/* Logo section */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={() => router.push("/")}
                            className="transition-opacity hover:opacity-80"
                            aria-label="Go to home page"
                        >
                            <img
                                src="/pinory-logo-full.svg"
                                alt="Pinory - Pin Your Story"
                                className="h-16 w-auto"
                            />
                        </button>
                    </div>
                </div>

                <Card className="relative bg-[rgba(20,20,20,0.6)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden">
                    {/* Enhanced top accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80"></div>

                    {/* Subtle glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/10 via-brand-accent/10 to-brand-secondary/10 rounded-2xl blur-xl -z-10 opacity-60"></div>

                    <div className="relative p-6">
                        {/* Header */}
                        <div className="text-center mb-6">
                            {/* Enhanced icon */}
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand/30 to-brand-secondary/30 rounded-2xl flex items-center justify-center border border-[#262626] shadow-lg shadow-brand/20">
                                <img
                                    src="/pinory-icon-simple.svg"
                                    alt="Pinory Icon"
                                    className="w-10 h-10"
                                />
                            </div>

                            <h1 className="text-2xl font-bold text-[#fafafa] mb-2">
                                Welcome to Pinory
                            </h1>
                            <p className="text-[#a3a3a3] text-sm leading-relaxed">
                                Pin your story, share your world
                            </p>
                        </div>

                        {/* Login Button - Priority #1 */}
                        <div className="mb-6">
                            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
                                "demo-google-client-id" ? (
                                <Button
                                    onClick={() =>
                                        signIn("google", { callbackUrl: "/" })
                                    }
                                    className="w-full h-14 bg-white hover:bg-gray-100 text-neutral-800 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group border-0"
                                >
                                    {/* Subtle shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                                    <div className="flex items-center justify-center gap-3 relative z-10">
                                        {/* Google colored logo */}
                                        <svg
                                            className="w-5 h-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span className="text-base">
                                            Sign in with Google
                                        </span>
                                    </div>
                                </Button>
                            ) : (
                                <div className="relative p-6 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-600/60 rounded-2xl backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl"></div>
                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                                                <span className="text-xl">
                                                    🔧
                                                </span>
                                            </div>
                                            <p className="text-base text-amber-300 font-semibold">
                                                Google OAuth setup required
                                            </p>
                                        </div>
                                        <p className="text-sm text-amber-200/90 mb-4">
                                            To enable sign in, please:
                                        </p>
                                        <ol className="text-sm text-amber-100/90 ml-5 space-y-2 list-decimal">
                                            <li>Create Google OAuth app</li>
                                            <li>Update .env.local</li>
                                            <li>Restart dev server</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Simple benefits list */}
                        <div className="space-y-3 py-6 border-y border-[#262626]">
                            <div className="flex items-center gap-3 text-sm text-[#fafafa]">
                                <svg
                                    className="w-5 h-5 text-brand flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Unlimited storage for your memories</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#fafafa]">
                                <svg
                                    className="w-5 h-5 text-brand flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Sync across all your devices</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#fafafa]">
                                <svg
                                    className="w-5 h-5 text-brand flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Share and collaborate with friends</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-[#737373]">
                                By signing in, you agree to our{" "}
                                <Link
                                    href="/terms"
                                    className="text-brand hover:text-brand-secondary transition-colors"
                                >
                                    Terms
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href="/privacy"
                                    className="text-brand hover:text-brand-secondary transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
