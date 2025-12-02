"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This is a simple landing page that tests the auto-redirect
export default function PublicLanding() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to main app
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // This should not be reached due to middleware redirect
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-2xl mb-4">Redirecting to login...</h1>
        <p className="text-muted-foreground">
          If you see this, middleware is not working
        </p>
      </div>
    </div>
  );
}
