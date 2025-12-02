"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState, useEffect, type ReactNode } from "react";
import { useCategoryAPI } from "@/lib/hooks";

interface ProvidersProps {
    children: ReactNode;
}

// Category loader component
function CategoryLoader({ children }: { readonly children: ReactNode }) {
    const { data: session, status } = useSession();
    const { fetchCategories } = useCategoryAPI();

    useEffect(() => {
        // Only fetch when session status is not loading
        if (status !== "loading") {
            fetchCategories(session);
        }
    }, [session, status, fetchCategories]);

    return <>{children}</>;
}

export function Providers({ children }: Readonly<ProvidersProps>) {
    const [mounted, setMounted] = useState(false);
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading placeholder on server/initial render
    if (!mounted) {
        return (
            <div suppressHydrationWarning className="min-h-svh bg-background">
                <div className="flex items-center justify-center h-svh">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <SessionProvider
            refetchInterval={5 * 60}
            refetchOnWindowFocus={true}
            basePath="/api/auth"
        >
            <QueryClientProvider client={queryClient}>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    <CategoryLoader>{children}</CategoryLoader>
                </NextThemesProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
