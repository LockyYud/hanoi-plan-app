"use client";

import { Newspaper, User } from "lucide-react";

interface ActivityFeedItem {
    id: string;
    type: "location_note" | "journey";
    user: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
    createdAt: Date;
}

interface FeedTabProps {
    activityFeed: ActivityFeedItem[];
}

export function FeedTab({ activityFeed }: FeedTabProps) {
    return (
        <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">
                    Hoạt động
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {activityFeed.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-3">
                {activityFeed.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Newspaper className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm">Chưa có hoạt động</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Khi bạn bè thêm địa điểm hoặc hành trình,
                            <br />
                            chúng sẽ hiển thị ở đây
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activityFeed.map((item) => (
                            <div
                                key={item.id}
                                className="p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {item.user.avatarUrl ? (
                                        <img
                                            src={item.user.avatarUrl}
                                            alt={
                                                item.user.name ||
                                                item.user.email
                                            }
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 p-2 bg-blue-500/20 text-blue-400 rounded-full" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground mb-1">
                                            {item.user.name || item.user.email}
                                        </div>
                                        <div className="text-sm text-gray-300 mb-1">
                                            {item.type === "location_note" &&
                                                "📍 Added new pinory"}
                                            {item.type === "journey" &&
                                                "🗺️ Created new journey"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
