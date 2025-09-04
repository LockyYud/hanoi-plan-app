"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Calendar,
    MapPin,
    DollarSign,
    Share2,
    Settings,
    Vote,
    Clock,
    Route,
} from "lucide-react";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";

interface GroupMember {
    user: {
        name: string;
        email: string;
    };
    role: "owner" | "member";
}

interface Group {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    budgetMin?: number;
    budgetMax?: number;
    vibeTags: string;
    areaPref: string;
    members: GroupMember[];
    createdAt: Date;
}

interface GroupCardProps {
    group: Group;
    onJoin?: () => void;
    onVote?: () => void;
    onShare?: () => void;
    onSettings?: () => void;
    onPlan?: () => void;
    isOwner?: boolean;
}

export function GroupCard({
    group,
    onJoin,
    onVote,
    onShare,
    onSettings,
    onPlan,
    isOwner = false,
}: GroupCardProps) {
    const vibes = group.vibeTags.split(",").filter(Boolean);
    const areas = group.areaPref.split(",").filter(Boolean);

    const formatBudget = () => {
        if (!group.budgetMin && !group.budgetMax) return null;
        if (group.budgetMin && group.budgetMax) {
            return `${formatPrice(group.budgetMin)} - ${formatPrice(group.budgetMax)}`;
        }
        if (group.budgetMin) return `Từ ${formatPrice(group.budgetMin)}`;
        if (group.budgetMax) return `Tối đa ${formatPrice(group.budgetMax)}`;
        return null;
    };

    const isUpcoming = group.startTime > new Date();
    const isActive =
        group.startTime <= new Date() && group.endTime >= new Date();
    const isPast = group.endTime < new Date();

    const getStatusColor = () => {
        if (isPast) return "bg-gray-100 text-gray-600";
        if (isActive) return "bg-green-100 text-green-600";
        return "bg-blue-100 text-blue-600";
    };

    const getStatusText = () => {
        if (isPast) return "Đã kết thúc";
        if (isActive) return "Đang diễn ra";
        return "Sắp diễn ra";
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">
                            {group.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor()}>
                                <Clock className="h-3 w-3 mr-1" />
                                {getStatusText()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {group.members.length} thành viên
                            </Badge>
                        </div>
                    </div>
                    {isOwner && (
                        <Button variant="ghost" size="sm" onClick={onSettings}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Time & Date */}
                <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="text-sm">
                        <div className="font-medium">
                            {formatDate(group.startTime)}
                        </div>
                        <div className="text-gray-600">
                            {formatTime(group.startTime)} -{" "}
                            {formatTime(group.endTime)}
                        </div>
                    </div>
                </div>

                {/* Budget */}
                {formatBudget() && (
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                            {formatBudget()}
                        </span>
                    </div>
                )}

                {/* Areas */}
                {areas.length > 0 && (
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                            {areas.map((area) => (
                                <Badge
                                    key={area}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {area}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vibes */}
                {vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {vibes.slice(0, 4).map((vibe) => (
                            <Badge
                                key={vibe}
                                variant="secondary"
                                className="text-xs"
                            >
                                {vibe}
                            </Badge>
                        ))}
                        {vibes.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                                +{vibes.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Members */}
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((member, index) => (
                            <div
                                key={index}
                                className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                                title={member.user.name}
                            >
                                {member.user.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {group.members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs">
                                +{group.members.length - 3}
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-gray-600 ml-2">
                        {group.members.map((m) => m.user.name).join(", ")}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {!isPast && (
                        <>
                            <Button
                                size="sm"
                                onClick={onPlan}
                                className="flex-1"
                            >
                                <Route className="h-4 w-4 mr-1" />
                                Lên kế hoạch
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onVote}
                            >
                                <Vote className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm" onClick={onShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                    {!group.members.some(
                        (m) => m.user.email === "you@example.com"
                    ) && (
                        <Button variant="outline" size="sm" onClick={onJoin}>
                            Tham gia
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
