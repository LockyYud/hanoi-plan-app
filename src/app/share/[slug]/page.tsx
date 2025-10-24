"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Users,
    DollarSign,
    Calendar,
    Share2,
    Download,
    Star,
    Navigation,
} from "lucide-react";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

interface SharedItineraryPageProps {
    params: { slug: string };
}

export default function SharedItineraryPage({
    params,
}: SharedItineraryPageProps) {
    const [itinerary, setItinerary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSharedItinerary = async () => {
            try {
                const response = await fetch(`/api/share/${params.slug}`);
                if (response.ok) {
                    const data = await response.json();
                    setItinerary(data);
                }
            } catch (error) {
                console.error("Error fetching shared itinerary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedItinerary();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải lộ trình...</p>
                </div>
            </div>
        );
    }

    if (!itinerary) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Không tìm thấy lộ trình
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Lộ trình này có thể đã bị xóa hoặc link không hợp lệ
                    </p>
                    <Link href="/">
                        <Button>Quay về trang chủ</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const categoryIcons = {
        cafe: "☕",
        food: "🍜",
        bar: "🍻",
        rooftop: "🏙️",
        activity: "🎯",
        landmark: "🏛️",
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {itinerary.title}
                            </h1>
                            <p className="text-gray-600">
                                {itinerary.description}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-1" />
                                Chia sẻ
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Tải về
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Tổng quan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {itinerary.stops.length}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Điểm đến
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {itinerary.schedule.totalDuration}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Thời gian
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {formatPrice(
                                                itinerary.budget.perPerson
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            / người
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {itinerary.sharing.viewCount}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Lượt xem
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {itinerary.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Itinerary Steps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Navigation className="h-5 w-5" />
                                    Lộ trình chi tiết
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {itinerary.stops.map(
                                        (stop: any, index: number) => (
                                            <div
                                                key={stop.id}
                                                className="flex gap-4 p-4 rounded-lg bg-gray-50"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                                                {stop.name}
                                                                <span className="text-lg">
                                                                    {
                                                                        categoryIcons[
                                                                            stop.category as keyof typeof categoryIcons
                                                                        ]
                                                                    }
                                                                </span>
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                {
                                                                    stop.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2"
                                                        >
                                                            {stop.time}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            {stop.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Group Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Thông tin nhóm
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Tên nhóm
                                    </span>
                                    <span className="font-medium">
                                        {itinerary.group.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Thành viên
                                    </span>
                                    <span className="font-medium">
                                        {itinerary.group.memberCount} người
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Ngày tạo
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(
                                            new Date(
                                                itinerary.sharing.createdAt
                                            )
                                        )}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Budget Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Chi phí ước tính
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Tổng chi phí
                                    </span>
                                    <span className="font-medium text-green-600">
                                        {formatPrice(
                                            itinerary.budget.estimated
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Chi phí/người
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(
                                            itinerary.budget.perPerson
                                        )}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    * Ước tính không bao gồm di chuyển và mua
                                    sắm cá nhân
                                </div>
                            </CardContent>
                        </Card>

                        {/* Call to Action */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6 text-center">
                                <h3 className="font-medium text-blue-900 mb-2">
                                    Thích lộ trình này?
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Tạo lộ trình của riêng bạn với Pinory
                                </p>
                                <Link href="/">
                                    <Button className="w-full">
                                        Bắt đầu lên kế hoạch
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

