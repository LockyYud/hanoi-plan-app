import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error-boundary";
import { DebugSession } from "@/components/debug-session";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hanoi Plan - Discover & Plan Hangouts in Hanoi",
  description:
    "A lightweight app that helps individuals and friend groups plan hangouts in Hà Nội. Save favorite places, create group plans, and get optimal itineraries.",
  keywords: [
    "Hanoi",
    "Vietnam",
    "travel",
    "planning",
    "hangout",
    "itinerary",
    "places",
  ],
  authors: [{ name: "Hanoi Plan Team" }],
  creator: "Hanoi Plan",
  publisher: "Hanoi Plan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    title: "Hanoi Plan - Discover & Plan Hangouts in Hanoi",
    description:
      "Plan the perfect hangout in Hanoi with friends. Discover places, create itineraries, and explore the city together.",
    url: "/",
    siteName: "Hanoi Plan",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hanoi Plan - Discover & Plan Hangouts in Hanoi",
    description: "Plan the perfect hangout in Hanoi with friends.",
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
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hanoi Plan" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
          <Toaster />
          {process.env.NODE_ENV === "development" && <DebugSession />}
        </ErrorBoundary>
      </body>
    </html>
  );
}
