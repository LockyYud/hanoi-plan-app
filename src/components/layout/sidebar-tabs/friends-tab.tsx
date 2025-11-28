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
        <h3 className="text-[10px] sm:text-xs font-bold text-[#EDEDED] uppercase tracking-wider flex-1 min-w-0">
          Bạn bè
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {friends.length}
          </span>
        </h3>
        <Button
          size="sm"
          onClick={() => setShowInviteDialog(true)}
          className="h-7 sm:h-8 px-2 sm:px-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-[10px] sm:text-xs flex-shrink-0"
          title="Mời bạn bè"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Mời bạn</span>
        </Button>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Bell className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">
              Lời mời kết bạn ({friendRequests.length})
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
                    alt={request.requester.name || request.requester.email}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <User className="w-10 h-10 p-2 bg-yellow-500/20 text-yellow-400 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#EDEDED] truncate">
                    {request.requester.name || request.requester.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Muốn kết bạn với bạn
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectFriendRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="h-8 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs border-neutral-700"
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
            <p className="text-sm">Chưa có bạn bè</p>
            <p className="text-xs text-gray-600 mt-1">
              Bắt đầu kết nối với mọi người để
              <br />
              khám phá và chia sẻ địa điểm
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-[#A0A0A0] uppercase tracking-wider font-bold px-1">
              Danh sách bạn bè
            </div>
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors"
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
                  <div className="text-sm font-medium text-[#EDEDED] truncate">
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
