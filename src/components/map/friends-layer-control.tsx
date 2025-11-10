"use client";

import { useEffect, useState } from "react";
import { useFriendStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, X, UserCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export function FriendsLayerControl() {
    const {
        showFriendsLayer,
        setShowFriendsLayer,
        selectedFriendId,
        setSelectedFriendId,
        friends,
        fetchFriends,
        friendLocationNotes,
    } = useFriendStore();

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (showFriendsLayer && friends.length === 0) {
            fetchFriends();
        }
    }, [showFriendsLayer, friends.length, fetchFriends]);

    return (
        <div className="absolute top-4 right-4 z-10">
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    variant={showFriendsLayer ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="shadow-lg"
                >
                    <Users className="w-4 h-4 mr-2" />
                    Friends' Places
                    {showFriendsLayer && friendLocationNotes.length > 0 && (
                        <span className="ml-2 bg-white text-blue-600 text-xs rounded-full px-2 py-0.5">
                            {friendLocationNotes.length}
                        </span>
                    )}
                </Button>
            )}

            {/* Control Panel */}
            {isOpen && (
                <Card className="w-80 shadow-lg">
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Friends' Places
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Show/Hide Toggle */}
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="show-friends-layer"
                                className="text-sm"
                            >
                                Show friends' locations
                            </Label>
                            <Switch
                                id="show-friends-layer"
                                checked={showFriendsLayer}
                                onCheckedChange={(checked) => {
                                    setShowFriendsLayer(checked);
                                    if (!checked) {
                                        setSelectedFriendId(null);
                                    }
                                }}
                            />
                        </div>

                        {/* Friend Filter */}
                        {showFriendsLayer && friends.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Filter by friend
                                </Label>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    <button
                                        className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                            selectedFriendId === null
                                                ? "bg-gray-100"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedFriendId(null)
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium">
                                                All Friends
                                            </span>
                                        </div>
                                    </button>

                                    {friends.map((friend) => (
                                        <button
                                            key={friend.id}
                                            className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                                selectedFriendId === friend.id
                                                    ? "bg-gray-100"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setSelectedFriendId(friend.id)
                                            }
                                        >
                                            <div className="flex items-center gap-2">
                                                {friend.avatarUrl ? (
                                                    <Image
                                                        src={friend.avatarUrl}
                                                        alt={
                                                            friend.name ||
                                                            friend.email
                                                        }
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <UserCircle2 className="w-5 h-5 text-gray-400" />
                                                )}
                                                <span className="text-sm">
                                                    {friend.name ||
                                                        friend.email}
                                                </span>
                                                <span className="ml-auto text-xs text-gray-500">
                                                    {friend.locationNotesCount}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Friends Message */}
                        {showFriendsLayer && friends.length === 0 && (
                            <div className="text-center py-4 text-sm text-gray-500">
                                No friends yet. Add friends to see their
                                locations.
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}



