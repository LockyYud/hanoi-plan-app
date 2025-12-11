"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Camera, Heart, Share2, Map as MapIcon } from "lucide-react";

export function LandingPage() {
    const router = useRouter();

    const handleSignIn = () => {
        router.push("/auth/signin");
    };

    return (
        <div className="min-h-screen bg-[#f8f1e5]">
            {/* Header */}
            <header className="container mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/pinory-icon-simple.svg"
                            alt="Pinory"
                            width={40}
                            height={40}
                            className="animate-float"
                            priority
                            unoptimized
                        />
                        <Image
                            src="/pinory-logo-full.svg"
                            alt="Pinory"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                            unoptimized
                        />
                    </div>
                    <button
                        onClick={handleSignIn}
                        className="px-6 py-2 bg-brand text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in">
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Drop a pin,
                                <span className="text-transparent bg-clip-text bg-brand">
                                    {" "}
                                    keep a memory
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Like a personal pinboard for your life. Pin your
                                favorite places with photos, notes, and mood.
                                Rediscover your journey anytime.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSignIn}
                                className="px-8 py-4 bg-brand text-white rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" />
                                Start Your Journey
                            </button>
                            <a
                                href="#features"
                                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold text-lg hover:border-brand transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Learn More
                            </a>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-gray-200">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    1000+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Memories Pinned
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    500+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Users
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="relative animate-slide-up">
                        <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                            {/* Map Visual */}
                            <div className="aspect-[4/3] bg-blue-100 rounded-2xl overflow-hidden relative">
                                {/* Map grid pattern */}
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(#94a3b8 1px, transparent 1px),
                                            linear-gradient(90deg, #94a3b8 1px, transparent 1px)
                                        `,
                                        backgroundSize: "40px 40px",
                                    }}
                                />

                                {/* Demo pins */}
                                <div className="absolute top-1/4 left-1/4 animate-bounce delay-100">
                                    <div className="w-12 h-12 bg-brand rounded-full shadow-lg flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 right-1/3 animate-bounce delay-300">
                                    <div className="w-12 h-12 bg-brand rounded-full shadow-lg flex items-center justify-center">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-1/4 left-1/2 animate-bounce delay-500">
                                    <div className="w-12 h-12 bg-brand rounded-full shadow-lg flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Journey lines */}
                                <svg
                                    className="absolute inset-0 w-full h-full"
                                    style={{ pointerEvents: "none" }}
                                >
                                    <path
                                        d="M 25% 25% Q 40% 40%, 50% 50%"
                                        stroke="#ff6b6b"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray="5,5"
                                        opacity="0.5"
                                    />
                                    <path
                                        d="M 50% 50% Q 60% 40%, 66% 33%"
                                        stroke="#ff6b6b"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray="5,5"
                                        opacity="0.5"
                                    />
                                </svg>
                            </div>

                            {/* Floating photo cards */}
                            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-2 rotate-6 animate-float">
                                <div className="w-20 h-20 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-yellow-600" />
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-2 -rotate-6 animate-float delay-300">
                                <div className="w-20 h-20 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <Heart className="w-8 h-8 text-pink-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                id="features"
                className="container mx-auto px-6 py-20 bg-white/50 backdrop-blur-sm rounded-3xl my-20"
            >
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Features
                    </h2>
                    <p className="text-xl text-gray-600">
                        Everything you need to save your memories
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mb-6">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Pin Places
                        </h3>
                        <p className="text-gray-600">
                            Mark every place you've been on an interactive map
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
                            <Camera className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Photos & Notes
                        </h3>
                        <p className="text-gray-600">
                            Add photos, mood, and stories to each location
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-6">
                            <MapIcon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Explore Your Map
                        </h3>
                        <p className="text-gray-600">
                            Look back at all the places you've visited
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-6">
                            <Share2 className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Share Memories
                        </h3>
                        <p className="text-gray-600">
                            Share your pinned places with friends
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600">
                        Just 3 simple steps to get started
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-brand rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                1
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Sign In
                        </h3>
                        <p className="text-gray-600">
                            Quick sign in with your Google account
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                2
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Drop a Pin
                        </h3>
                        <p className="text-gray-600">
                            Select a location on the map and add photos, notes
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                3
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Rediscover
                        </h3>
                        <p className="text-gray-600">
                            Explore your journey and memories anytime
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="bg-brand rounded-3xl p-12 md:p-16 text-center shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Start pinning your story
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Every place is a memory, every pin tells a story. Create
                        your own memory map today.
                    </p>
                    <button
                        onClick={handleSignIn}
                        className="px-10 py-5 bg-white text-brand rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                    >
                        <MapPin className="w-6 h-6" />
                        Get Started Free
                    </button>
                    <p className="text-white/80 mt-4">
                        No credit card required • Free forever
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/pinory-icon-simple.svg"
                            alt="Pinory"
                            width={32}
                            height={32}
                            unoptimized
                        />
                        <div>
                            <div className="font-bold text-gray-900">
                                Pinory
                            </div>
                            <div className="text-sm text-gray-600">
                                Drop a pin, keep a memory
                            </div>
                        </div>
                    </div>
                    <div className="text-gray-600 text-sm">
                        © 2025 Pinory. Every pin tells a story.
                    </div>
                </div>
            </footer>
        </div>
    );
}
