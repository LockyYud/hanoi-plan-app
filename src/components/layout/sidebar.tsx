"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GroupForm } from "@/components/groups/group-form";
import { GroupCard } from "@/components/groups/group-card";
import { RouteGenerator } from "@/components/itinerary/route-generator";
import {
    Heart,
    MapPin,
    Users,
    Settings,
    User,
    Search,
    Filter,
    Plus,
    LogOut,
    X,
} from "lucide-react";
import { useUIStore, usePlaceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export function Sidebar() {
    const { data: session, status } = useSession();
    const { sidebarOpen } = useUIStore();
    const { places, filter, setFilter, setPlaces, setSelectedPlace } =
        usePlaceStore();
    const [activeTab, setActiveTab] = useState<"places" | "groups" | "profile">(
        "places"
    );
    const [mounted, setMounted] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [groups, setGroups] = useState<
        Array<{
            id: string;
            name: string;
            description?: string;
            startTime: Date;
            endTime: Date;
            createdAt: Date;
        }>
    >([]);
    const [showRouteGenerator, setShowRouteGenerator] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Define fetchGroups function
    const fetchGroups = async () => {
        try {
            const response = await fetch("/api/groups");
            const result = await response.json();
            if (result.data) {
                setGroups(result.data);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    // Define fetchPlaces function with useCallback
    const fetchPlaces = useCallback(async () => {
        try {
            console.log("🔍 Fetching places with filter:", filter);

            const searchParams = new URLSearchParams();
            if (filter.query) {
                searchParams.append("query", filter.query);
            }
            if (filter.category?.length) {
                searchParams.append("category", filter.category.join(","));
            }
            if (filter.district?.length) {
                searchParams.append("district", filter.district.join(","));
            }

            const url = `/api/places${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
            console.log("🌐 API URL:", url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("📍 Places response:", result);

            if (result.data) {
                setPlaces(result.data);
                console.log("✅ Places loaded:", result.data.length, "places");
            } else if (result.error) {
                console.error("API Error:", result.error);
                // Set empty places array as fallback
                setPlaces([]);
            }
        } catch (error) {
            console.error("❌ Error fetching places:", error);
            // Set empty places array as fallback
            setPlaces([]);
        }
    }, [filter, setPlaces]);

    // Load initial data
    useEffect(() => {
        setMounted(true);
        fetchGroups();
        fetchPlaces();
    }, [fetchPlaces]);

    // Refetch places when filter changes
    useEffect(() => {
        if (mounted) {
            fetchPlaces();
        }
    }, [filter, mounted, fetchPlaces]);

    const handleCreateGroup = async (data: {
        name: string;
        description?: string;
        startTime: Date;
        endTime: Date;
    }) => {
        try {
            const response = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newGroup = await response.json();
                setGroups((prev) => [newGroup, ...prev]);
                setShowGroupForm(false);
            }
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    };

    const tabs = [
        { id: "places", label: "Địa điểm", icon: MapPin },
        { id: "groups", label: "Nhóm", icon: Users },
        { id: "profile", label: "Cá nhân", icon: User },
    ];

    const filteredPlaces = places.filter((place) => {
        if (filter.category && !filter.category.includes(place.category))
            return false;
        if (filter.district && !filter.district.includes(place.district || ""))
            return false;
        if (
            filter.query &&
            !place.name.toLowerCase().includes(filter.query.toLowerCase())
        )
            return false;
        return true;
    });

    if (!mounted) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 transition-transform duration-300 z-20",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            suppressHydrationWarning
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">
                        Hanoi Plan
                    </h1>
                    <p className="text-sm text-gray-600">
                        Khám phá Hà Nội cùng bạn bè
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "places" && (
                        <div className="p-4 space-y-4">
                            {/* Search and Filter */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm địa điểm..."
                                        value={filter.query || ""}
                                        onChange={(e) =>
                                            setFilter({ query: e.target.value })
                                        }
                                        className="pl-10"
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Bộ lọc nâng cao
                                </Button>
                            </div>

                            {/* Quick Categories */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Danh mục
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                    {CATEGORIES.map((category) => (
                                        <Badge
                                            key={category}
                                            variant={
                                                filter.category?.includes(
                                                    category
                                                )
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const currentCategories =
                                                    filter.category || [];
                                                const newCategories =
                                                    currentCategories.includes(
                                                        category
                                                    )
                                                        ? currentCategories.filter(
                                                              (c) =>
                                                                  c !== category
                                                          )
                                                        : [
                                                              ...currentCategories,
                                                              category,
                                                          ];
                                                setFilter({
                                                    category:
                                                        newCategories.length > 0
                                                            ? newCategories
                                                            : undefined,
                                                });
                                            }}
                                        >
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Places List */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-700">
                                        Địa điểm yêu thích (
                                        {filteredPlaces.length})
                                    </h3>
                                    <Button size="sm" variant="ghost">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {filteredPlaces.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">
                                                Chưa có địa điểm yêu thích
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2"
                                            >
                                                Thêm địa điểm đầu tiên
                                            </Button>
                                        </div>
                                    ) : (
                                        filteredPlaces.map((place) => (
                                            <Card
                                                key={place.id}
                                                className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() =>
                                                    setSelectedPlace(place)
                                                }
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm text-gray-900 truncate">
                                                            {place.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {place.address}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {place.category}
                                                            </Badge>
                                                            {place.priceLevel && (
                                                                <span className="text-xs text-gray-500">
                                                                    {"₫".repeat(
                                                                        place.priceLevel
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "groups" && (
                        <div className="p-4 space-y-4">
                            {showRouteGenerator && selectedGroupId ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Tạo lộ trình cho nhóm
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowRouteGenerator(false);
                                                setSelectedGroupId(null);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <RouteGenerator groupId={selectedGroupId} />
                                </div>
                            ) : showGroupForm ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Tạo nhóm mới
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setShowGroupForm(false)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <GroupForm
                                        onSubmit={handleCreateGroup}
                                        onCancel={() => setShowGroupForm(false)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Nhóm của tôi ({groups.length})
                                        </h3>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setShowGroupForm(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tạo nhóm
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {groups.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">
                                                    Chưa có nhóm nào
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Tạo nhóm để lên kế hoạch
                                                    cùng bạn bè
                                                </p>
                                            </div>
                                        ) : (
                                            groups.map((group) => (
                                                <GroupCard
                                                    key={group.id}
                                                    group={{
                                                        ...group,
                                                        startTime: new Date(
                                                            group.startTime
                                                        ),
                                                        endTime: new Date(
                                                            group.endTime
                                                        ),
                                                        createdAt: new Date(
                                                            group.createdAt
                                                        ),
                                                    }}
                                                    isOwner={true}
                                                    onVote={() =>
                                                        console.log(
                                                            "Vote on group:",
                                                            group.id
                                                        )
                                                    }
                                                    onShare={() =>
                                                        console.log(
                                                            "Share group:",
                                                            group.id
                                                        )
                                                    }
                                                    onSettings={() =>
                                                        console.log(
                                                            "Settings for group:",
                                                            group.id
                                                        )
                                                    }
                                                    onPlan={() => {
                                                        setSelectedGroupId(
                                                            group.id
                                                        );
                                                        setShowRouteGenerator(
                                                            true
                                                        );
                                                    }}
                                                />
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="p-4 space-y-4">
                            {status === "loading" ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Đang tải...</p>
                                </div>
                            ) : session ? (
                                <>
                                    <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                                        {session.user?.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={session.user.image}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-8 w-8 text-blue-600" />
                                        )}
                                    </div>
                                    <h3 className="font-medium text-gray-900">
                                        {session.user?.name || "Người dùng"}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {session.user?.email}
                                    </p>
                                    <div className="space-y-2 mt-4">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Cài đặt
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-red-600 hover:text-red-700"
                                            onClick={() => signOut()}
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Đăng xuất
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <User className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Đăng nhập để sử dụng
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Lưu địa điểm yêu thích và tạo nhóm
                                    </p>
                                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                                    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
                                        "demo-google-client-id" ? (
                                        <Button
                                            onClick={() => signIn("google")}
                                            className="w-full mb-2"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2"
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
                                            Đăng nhập với Google
                                        </Button>
                                    ) : (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800 mb-2">
                                                🔧{" "}
                                                <strong>
                                                    Cần cấu hình Google OAuth
                                                </strong>
                                            </p>
                                            <p className="text-xs text-yellow-700">
                                                Để sử dụng đăng nhập, vui lòng:
                                            </p>
                                            <ol className="text-xs text-yellow-700 ml-4 mt-1 list-decimal">
                                                <li>Tạo Google OAuth app</li>
                                                <li>Cập nhật .env.local</li>
                                                <li>Restart dev server</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
