import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error-boundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Pinory — Pin Your Story",
    description:
        "Ghim lại những kỷ niệm của bạn trên bản đồ. Khám phá hành trình của chính mình. Every pin tells a story.",
    keywords: [
        "Pinory",
        "travel",
        "memories",
        "photography",
        "journey",
        "map",
        "stories",
        "Vietnam",
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
        title: "Pinory — Pin Your Story",
        description:
            "Ghim lại những kỷ niệm của bạn trên bản đồ. Every pin tells a story.",
        url: "/",
        siteName: "Pinory",
        locale: "vi_VN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pinory — Pin Your Story",
        description: "Your memories, mapped. Every pin tells a story.",
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
        <html lang="vi" suppressHydrationWarning>
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
                className={`${inter.variable} font-sans antialiased`}
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
