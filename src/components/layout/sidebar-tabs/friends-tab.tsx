"use client";

import { Button } from "@/components/ui/button";
import { Plus, Bell, Users, User } from "lucide-react";

interface Friend {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    pinoriesCount: number;
}

interface FriendRequest {
    id: string;
    requester: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
    createdAt: Date;
}

interface FriendsTabProps {
    friends: Friend[];
    friendRequests: FriendRequest[];
    processingRequest: string | null;
    setShowInviteDialog: (show: boolean) => void;
    handleAcceptFriendRequest: (requestId: string) => void;
    handleRejectFriendRequest: (requestId: string) => void;
}

export function FriendsTab({
    friends,
    friendRequests,
    processingRequest,
    setShowInviteDialog,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
}: FriendsTabProps) {
    return (
        <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider flex-1 min-w-0">
                    Friends
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {friends.length}
                    </span>
                </h3>
                <Button
                    size="sm"
                    onClick={() => setShowInviteDialog(true)}
                    className="h-7 sm:h-8 px-2 sm:px-3 bg-purple-600 hover:bg-purple-500 text-white text-[10px] sm:text-xs flex-shrink-0"
                    title="Invite friends"
                >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Invite</span>
                </Button>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Bell className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-500">
                            Friend requests ({friendRequests.length})
                        </span>
                    </div>
                    <div className="space-y-2">
                        {friendRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-700/30 hover:bg-yellow-900/30 rounded-lg transition-colors"
                            >
                                {request.requester.avatarUrl ? (
                                    <img
                                        src={request.requester.avatarUrl}
                                        alt={
                                            request.requester.name ||
                                            request.requester.email
                                        }
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <User className="w-10 h-10 p-2 bg-yellow-500/20 text-yellow-400 rounded-full" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">
                                        {request.requester.name ||
                                            request.requester.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Wants to be friends
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleAcceptFriendRequest(
                                                request.id
                                            )
                                        }
                                        disabled={
                                            processingRequest === request.id
                                        }
                                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                                    >
                                        ✓
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            handleRejectFriendRequest(
                                                request.id
                                            )
                                        }
                                        disabled={
                                            processingRequest === request.id
                                        }
                                        className="h-8 px-3 bg-secondary hover:bg-accent text-foreground text-xs border-border"
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            <div className="space-y-2">
                {friends.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm">No friends yet</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Start connecting with people to
                            <br />
                            discover and share places
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold px-1">
                            Friends list
                        </div>
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                            >
                                {friend.avatarUrl ? (
                                    <img
                                        src={friend.avatarUrl}
                                        alt={friend.name || friend.email}
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <User className="w-10 h-10 p-2 bg-purple-500/20 text-purple-400 rounded-full" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">
                                        {friend.name || friend.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {friend.pinoriesCount} pinories
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
