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
        <div className="min-h-screen bg-gradient-to-br from-[#f8f1e5] via-white to-[#f8f1e5]">
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
                        className="px-6 py-2 bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Đăng nhập
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
                                Ghim lại những
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53]">
                                    {" "}
                                    khoảnh khắc{" "}
                                </span>
                                của bạn
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Như một chiếc bảng bản đồ, nơi bạn có thể ghim
                                lại từng kỷ niệm tại mọi địa điểm bạn đã đi qua.
                                Nhìn lại hành trình của chính mình.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSignIn}
                                className="px-8 py-4 bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" />
                                Bắt đầu hành trình
                            </button>
                            <a
                                href="#features"
                                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold text-lg hover:border-[#ff6b6b] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Tìm hiểu thêm
                            </a>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-gray-200">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    1000+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Kỷ niệm đã ghim
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">
                                    500+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Người dùng
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="relative animate-slide-up">
                        <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                            {/* Map Visual */}
                            <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl overflow-hidden relative">
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] rounded-full shadow-lg flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 right-1/3 animate-bounce delay-300">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] rounded-full shadow-lg flex items-center justify-center">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-1/4 left-1/2 animate-bounce delay-500">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] rounded-full shadow-lg flex items-center justify-center">
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
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-yellow-600" />
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-2 -rotate-6 animate-float delay-300">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
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
                        Tính năng nổi bật
                    </h2>
                    <p className="text-xl text-gray-600">
                        Mọi thứ bạn cần để lưu giữ kỷ niệm
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] rounded-2xl flex items-center justify-center mb-6">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Ghim địa điểm
                        </h3>
                        <p className="text-gray-600">
                            Đánh dấu mọi nơi bạn đã đến trên bản đồ tương tác
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <Camera className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Lưu ảnh & ghi chú
                        </h3>
                        <p className="text-gray-600">
                            Thêm ảnh, cảm xúc và câu chuyện cho từng địa điểm
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                            <MapIcon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Xem hành trình
                        </h3>
                        <p className="text-gray-600">
                            Nhìn lại toàn bộ những nơi bạn đã đi qua
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                            <Share2 className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Chia sẻ kỷ niệm
                        </h3>
                        <p className="text-gray-600">
                            Chia sẻ hành trình của bạn với bạn bè
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Cách hoạt động
                    </h2>
                    <p className="text-xl text-gray-600">
                        Chỉ 3 bước đơn giản để bắt đầu
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                1
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Đăng nhập
                        </h3>
                        <p className="text-gray-600">
                            Đăng nhập nhanh chóng với tài khoản Google
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                2
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Thêm địa điểm
                        </h3>
                        <p className="text-gray-600">
                            Chọn vị trí trên bản đồ và thêm ảnh, ghi chú
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center">
                        <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                3
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Nhìn lại
                        </h3>
                        <p className="text-gray-600">
                            Khám phá lại hành trình và kỷ niệm của bạn
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] rounded-3xl p-12 md:p-16 text-center shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Bắt đầu ghim câu chuyện của bạn
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Mỗi địa điểm là một kỷ niệm, mỗi ghim kể một câu chuyện.
                        Hãy tạo bản đồ kỷ niệm của riêng bạn.
                    </p>
                    <button
                        onClick={handleSignIn}
                        className="px-10 py-5 bg-white text-[#ff6b6b] rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                    >
                        <MapPin className="w-6 h-6" />
                        Bắt đầu miễn phí
                    </button>
                    <p className="text-white/80 mt-4">
                        Không cần thẻ tín dụng • Miễn phí mãi mãi
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
                                Pin Your Story
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
