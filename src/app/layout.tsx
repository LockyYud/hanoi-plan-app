import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Providers, ErrorBoundary } from "@/components/common";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
});

const caveat = Caveat({
    subsets: ["latin", "vietnamese"],
    variable: "--font-caveat",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Pinory — Drop a pin, keep a memory",
    description:
        "Pin your favorite places on the map with photos, notes, and mood. Save memories, share with friends, and rediscover your journey.",
    keywords: [
        "Pinory",
        "memory map",
        "pin memories",
        "photo journal",
        "travel memories",
        "location diary",
        "share moments",
        "place memories",
        "travel",
        "photography",
        "lifestyle",
    ],
    authors: [{ name: "Pinory" }],
    creator: "Pinory",
    publisher: "Pinory",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            "http://localhost:3000"
    ),
    openGraph: {
        title: "Pinory — Drop a pin, keep a memory",
        description:
            "Pin your favorite places on the map with photos, notes, and mood. Save memories and share with friends.",
        url: "/",
        siteName: "Pinory",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pinory — Drop a pin, keep a memory",
        description:
            "Pin your favorite places on the map with photos and notes. Every pin tells a story.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
                    rel="stylesheet"
                />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#f8f1e5" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="Pinory" />
                <link rel="apple-touch-icon" href="/icon.svg" />
                <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            </head>
            <body
                className={`${inter.variable} ${caveat.variable} font-sans antialiased`}
                suppressHydrationWarning
            >
                <ErrorBoundary>
                    <Providers>
                        {children}
                        {/* {process.env.NODE_ENV === "development" && (
                            <DebugSession />
                        )} */}
                    </Providers>
                    <Toaster />
                </ErrorBoundary>
                <SpeedInsights />
            </body>
        </html>
    );
}
