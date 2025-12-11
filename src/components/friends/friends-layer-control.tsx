"use client";

import { useEffect, useState, useMemo } from "react";
import { useFriendStore } from "@/lib/store";
import { useFriendAPI } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, X, UserCircle2, Plus, Bell, Check, UserX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { InviteDialog } from "./invite-dialog";
import { toast } from "sonner";

// Custom hook to detect mobile viewport
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
}

// Panel Content Component
interface PanelContentProps {
    readonly friendPinories: ReadonlyArray<{
        id: string;
        creator?: { id: string };
    }>;
    readonly showFriendsLayer: boolean;
    readonly setShowFriendsLayer: (value: boolean) => void;
    readonly selectedFriendId: string | null;
    readonly setSelectedFriendId: (id: string | null) => void;
    readonly friends: ReadonlyArray<{
        id: string;
        name?: string | null;
        email: string;
        avatarUrl?: string | null;
        pinoriesCount: number;
    }>;
    readonly friendRequests: ReadonlyArray<{
        id: string;
        requester: {
            id: string;
            name?: string | null;
            email: string;
            avatarUrl?: string | null;
        };
        createdAt: Date;
    }>;
    readonly setIsOpen: (value: boolean) => void;
    readonly setShowInviteDialog: (value: boolean) => void;
    readonly onAcceptRequest: (requestId: string) => void;
    readonly onRejectRequest: (requestId: string) => void;
    readonly processingRequest: string | null;
    readonly isMobile: boolean;
}

function PanelContent({
    friendPinories,
    showFriendsLayer,
    setShowFriendsLayer,
    selectedFriendId,
    setSelectedFriendId,
    friends,
    friendRequests,
    setIsOpen,
    setShowInviteDialog,
    onAcceptRequest,
    onRejectRequest,
    processingRequest,
    isMobile,
}: PanelContentProps) {
    return (
        <div className="p-4 space-y-3">
            {/* Header */}
            <div
                className="flex items-center justify-between pb-3 border-b-2"
                style={{
                    borderColor: "var(--border)",
                }}
            >
                <h3
                    className="font-bold flex items-center gap-2 text-base"
                    style={{
                        color: "var(--foreground)",
                    }}
                >
                    <Users
                        className="w-5 h-5"
                        style={{
                            color: "var(--color-primary-500)",
                        }}
                    />
                    Friends
                    {friends.length > 0 && (
                        <span
                            className="text-white text-xs rounded-full px-2 py-0.5 font-bold"
                            style={{
                                backgroundColor: "var(--color-primary-500)",
                            }}
                        >
                            {friends.length}
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    {/* Invite Friend Button */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInviteDialog(true)}
                            className="h-8 px-3 text-xs font-semibold"
                            style={{
                                borderColor: "var(--color-primary-500)",
                                color: "var(--color-primary-500)",
                            }}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Invite
                        </Button>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                        }}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 transition-colors duration-200"
                            style={{
                                color: "var(--muted-foreground)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "var(--secondary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "transparent";
                            }}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-2 px-1">
                        <Bell className="w-4 h-4 text-yellow-500" />
                        <Label className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                            Friend requests ({friendRequests.length})
                        </Label>
                    </div>
                    <div className="space-y-2">
                        {friendRequests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + index * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-lg border-2"
                                style={{
                                    backgroundColor: "rgba(234, 179, 8, 0.1)",
                                    borderColor: "rgba(234, 179, 8, 0.3)",
                                }}
                            >
                                {request.requester.avatarUrl ? (
                                    <Image
                                        src={request.requester.avatarUrl}
                                        alt={
                                            request.requester.name ||
                                            request.requester.email
                                        }
                                        width={36}
                                        height={36}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center"
                                        style={{
                                            backgroundColor:
                                                "rgba(234, 179, 8, 0.2)",
                                        }}
                                    >
                                        <UserCircle2 className="w-5 h-5 text-yellow-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-sm font-medium truncate"
                                        style={{ color: "var(--foreground)" }}
                                    >
                                        {request.requester.name ||
                                            request.requester.email}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--muted-foreground)",
                                        }}
                                    >
                                        Wants to be friends
                                    </p>
                                </div>
                                <div className="flex gap-1.5">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 bg-green-600 hover:bg-green-700"
                                            onClick={() =>
                                                onAcceptRequest(request.id)
                                            }
                                            disabled={
                                                processingRequest === request.id
                                            }
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </Button>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            style={{
                                                borderColor: "var(--border)",
                                                color: "var(--muted-foreground)",
                                            }}
                                            onClick={() =>
                                                onRejectRequest(request.id)
                                            }
                                            disabled={
                                                processingRequest === request.id
                                            }
                                        >
                                            <UserX className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Show/Hide Toggle */}
            <motion.div
                className="flex items-center justify-between py-3 px-3 rounded-lg border"
                style={{
                    backgroundColor: "var(--secondary)",
                    borderColor: "var(--border)",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{
                    backgroundColor: "var(--accent)",
                }}
            >
                <Label
                    htmlFor="show-friends-layer"
                    className="text-sm font-semibold cursor-pointer"
                    style={{
                        color: "var(--foreground)",
                    }}
                >
                    Show on map
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
            </motion.div>

            {/* Friend Filter */}
            {showFriendsLayer && friends.length > 0 && (
                <motion.div
                    className="space-y-2 pt-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{
                            color: "var(--muted-foreground)",
                        }}
                    >
                        Filter by friend
                    </Label>
                    <div
                        className={`space-y-1.5 overflow-y-auto pr-1 custom-scrollbar ${
                            isMobile ? "max-h-48" : "max-h-64"
                        }`}
                    >
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{
                                scale: 1.02,
                                x: 2,
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full text-left p-3 rounded-lg transition-colors duration-200 border-2"
                            style={{
                                backgroundColor:
                                    selectedFriendId === null
                                        ? "var(--accent)"
                                        : "var(--card)",
                                borderColor:
                                    selectedFriendId === null
                                        ? "var(--color-primary-500)"
                                        : "var(--border)",
                                boxShadow:
                                    selectedFriendId === null
                                        ? "var(--shadow-sm)"
                                        : "none",
                            }}
                            onClick={() => setSelectedFriendId(null)}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                                    style={{
                                        background: "var(--color-primary-500)",
                                    }}
                                >
                                    <Users
                                        className="w-4 h-4"
                                        style={{
                                            color: "var(--primary-foreground)",
                                        }}
                                    />
                                </div>
                                <span
                                    className="text-sm font-bold"
                                    style={{
                                        color: "var(--foreground)",
                                    }}
                                >
                                    All Friends
                                </span>
                                <motion.span
                                    className="ml-auto text-xs font-bold rounded-full px-2.5 py-1 min-w-[28px] text-center"
                                    style={{
                                        backgroundColor:
                                            "var(--color-primary-500)",
                                        color: "var(--primary-foreground)",
                                    }}
                                    key={friendPinories.length}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                    }}
                                >
                                    {friendPinories.length}
                                </motion.span>
                            </div>
                        </motion.button>

                        {friends.map((friend, index) => (
                            <motion.button
                                key={friend.id}
                                initial={{
                                    opacity: 0,
                                    x: -20,
                                }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                }}
                                transition={{
                                    delay: 0.35 + index * 0.05,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    x: 2,
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full text-left p-3 rounded-lg transition-colors duration-200 border-2"
                                style={{
                                    backgroundColor:
                                        selectedFriendId === friend.id
                                            ? "var(--accent)"
                                            : "var(--card)",
                                    borderColor:
                                        selectedFriendId === friend.id
                                            ? "var(--color-primary-500)"
                                            : "var(--border)",
                                    boxShadow:
                                        selectedFriendId === friend.id
                                            ? "var(--shadow-sm)"
                                            : "none",
                                }}
                                onClick={() => setSelectedFriendId(friend.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {friend.avatarUrl ? (
                                        <motion.div
                                            whileHover={{
                                                rotate: 5,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                            }}
                                        >
                                            <Image
                                                src={friend.avatarUrl}
                                                alt={
                                                    friend.name || friend.email
                                                }
                                                width={32}
                                                height={32}
                                                className="rounded-full border-2 shadow-sm"
                                                style={{
                                                    borderColor:
                                                        "var(--border)",
                                                }}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                                            style={{
                                                background:
                                                    "var(--muted-foreground)",
                                            }}
                                            whileHover={{
                                                rotate: 5,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                            }}
                                        >
                                            <UserCircle2
                                                className="w-5 h-5"
                                                style={{
                                                    color: "var(--card)",
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                    <span
                                        className="text-sm font-semibold truncate flex-1"
                                        style={{
                                            color: "var(--foreground)",
                                        }}
                                    >
                                        {friend.name || friend.email}
                                    </span>
                                    {friend.pinoriesCount > 0 && (
                                        <motion.span
                                            className="text-xs font-bold rounded-full px-2.5 py-1 min-w-[28px] text-center"
                                            style={{
                                                backgroundColor:
                                                    "var(--secondary)",
                                                color: "var(--muted-foreground)",
                                            }}
                                            key={friend.pinoriesCount}
                                            initial={{
                                                scale: 1.3,
                                            }}
                                            animate={{
                                                scale: 1,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                            }}
                                        >
                                            {friend.pinoriesCount}
                                        </motion.span>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* No Friends Message */}
            {showFriendsLayer && friends.length === 0 && (
                <motion.div
                    className="text-center py-8 rounded-lg border-2"
                    style={{
                        backgroundColor: "var(--secondary)",
                        borderColor: "var(--border)",
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                    }}
                >
                    <motion.div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md"
                        style={{
                            background: "var(--muted-foreground)",
                        }}
                        animate={{
                            rotate: [0, 10, -10, 10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                        }}
                    >
                        <Users
                            className="w-6 h-6"
                            style={{ color: "var(--card)" }}
                        />
                    </motion.div>
                    <motion.p
                        className="font-bold text-sm"
                        style={{
                            color: "var(--foreground)",
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        No friends yet
                    </motion.p>
                    <motion.p
                        className="text-xs mt-1 font-medium"
                        style={{
                            color: "var(--muted-foreground)",
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Add friends to see their locations
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
}

export function FriendsLayerControl() {
    const {
        showFriendsLayer,
        setShowFriendsLayer,
        selectedFriendId,
        setSelectedFriendId,
        friends,
        friendPinories,
        friendRequests,
    } = useFriendStore();

    const {
        fetchFriends,
        fetchFriendRequests,
        acceptFriendRequest,
        rejectFriendRequest,
    } = useFriendAPI();

    const [isOpen, setIsOpen] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [processingRequest, setProcessingRequest] = useState<string | null>(
        null
    );
    const isMobile = useIsMobile();

    // Client-side filter to get displayed pinories count
    const displayedPinoriesCount = useMemo(() => {
        if (!selectedFriendId) return friendPinories.length;
        return friendPinories.filter(
            (pinory) => pinory.creator?.id === selectedFriendId
        ).length;
    }, [friendPinories, selectedFriendId]);

    // Handle accept friend request
    const handleAcceptRequest = async (requestId: string) => {
        setProcessingRequest(requestId);
        try {
            await acceptFriendRequest(requestId);
            toast.success("Friend request accepted");
            fetchFriends();
            fetchFriendRequests();
        } catch (error) {
            console.error("Error accepting friend request:", error);
            toast.error("Failed to accept friend request");
        } finally {
            setProcessingRequest(null);
        }
    };

    // Handle reject friend request
    const handleRejectRequest = async (requestId: string) => {
        setProcessingRequest(requestId);
        try {
            await rejectFriendRequest(requestId);
            toast.success("Friend request declined");
            fetchFriendRequests();
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            toast.error("Failed to decline friend request");
        } finally {
            setProcessingRequest(null);
        }
    };

    useEffect(() => {
        if (showFriendsLayer && friends.length === 0) {
            fetchFriends();
        }
    }, [showFriendsLayer, friends.length, fetchFriends]);

    // Fetch friend requests when panel opens
    useEffect(() => {
        if (isOpen) {
            fetchFriendRequests();
        }
    }, [isOpen, fetchFriendRequests]);

    return (
        <>
            {/* Toggle Button - Left side, below Pinories button */}
            <div className="absolute top-20 left-4 z-[10]">
                <AnimatePresence mode="wait">
                    {!isOpen && (
                        <motion.div
                            initial={false}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            exit={{
                                scale: 0,
                                opacity: 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                            }}
                        >
                            <Button
                                variant={
                                    showFriendsLayer ? "default" : "outline"
                                }
                                size="icon"
                                onClick={() => setIsOpen(true)}
                                className="shadow-lg rounded-full w-12 h-12 relative hover:scale-110 active:scale-95 transition-transform duration-200 border-2 cursor-pointer"
                                style={{
                                    borderColor: showFriendsLayer
                                        ? "var(--color-primary-500)"
                                        : "var(--border)",
                                    backgroundColor: showFriendsLayer
                                        ? "var(--color-primary-500)"
                                        : "var(--card)",
                                    color: showFriendsLayer
                                        ? "var(--primary-foreground)"
                                        : "var(--muted-foreground)",
                                }}
                                title="Friends"
                            >
                                <Users className="w-5 h-5" />
                                {/* Friend Requests Badge */}
                                {friendRequests.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 15,
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md animate-pulse"
                                    >
                                        {friendRequests.length > 9
                                            ? "9+"
                                            : friendRequests.length}
                                    </motion.span>
                                )}
                                {/* Pinories Count Badge (when no requests) */}
                                {friendRequests.length === 0 &&
                                    showFriendsLayer &&
                                    displayedPinoriesCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 15,
                                                delay: 0.1,
                                            }}
                                            className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-primary-600)",
                                            }}
                                        >
                                            {displayedPinoriesCount > 99
                                                ? "99+"
                                                : displayedPinoriesCount}
                                        </motion.span>
                                    )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Panel - Dropdown style, opens to the right */}
                {!isMobile && (
                    <AnimatePresence mode="wait">
                        {isOpen && (
                            <motion.div
                                className="absolute top-0 left-0 z-[10]"
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                    originX: 0,
                                    originY: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    originX: 0,
                                    originY: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0,
                                    originX: 0,
                                    originY: 0,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 30,
                                }}
                            >
                                <Card
                                    className="w-80 border-2"
                                    style={{
                                        boxShadow: "var(--shadow-lg)",
                                        borderColor: "var(--border)",
                                        backgroundColor: "var(--card)",
                                    }}
                                >
                                    <PanelContent
                                        friendPinories={friendPinories}
                                        showFriendsLayer={showFriendsLayer}
                                        setShowFriendsLayer={
                                            setShowFriendsLayer
                                        }
                                        selectedFriendId={selectedFriendId}
                                        setSelectedFriendId={
                                            setSelectedFriendId
                                        }
                                        friends={friends}
                                        friendRequests={friendRequests}
                                        setIsOpen={setIsOpen}
                                        setShowInviteDialog={
                                            setShowInviteDialog
                                        }
                                        onAcceptRequest={handleAcceptRequest}
                                        onRejectRequest={handleRejectRequest}
                                        processingRequest={processingRequest}
                                        isMobile={isMobile}
                                    />
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Mobile Bottom Sheet */}
            {isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-[100]"
                                style={{
                                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl border-t-2 flex flex-col"
                                style={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    boxShadow:
                                        "0 -4px 20px rgba(0, 0, 0, 0.15)",
                                    height: "70vh",
                                    maxHeight: "85vh",
                                }}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.5 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 100) {
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {/* Drag Handle */}
                                <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
                                    <div
                                        className="w-10 h-1 rounded-full"
                                        style={{
                                            backgroundColor:
                                                "var(--muted-foreground)",
                                            opacity: 0.4,
                                        }}
                                    />
                                </div>

                                {/* Scrollable Content */}
                                <div
                                    className="flex-1 overflow-y-auto overscroll-contain"
                                    style={{
                                        paddingBottom:
                                            "env(safe-area-inset-bottom, 20px)",
                                    }}
                                >
                                    <PanelContent
                                        friendPinories={friendPinories}
                                        showFriendsLayer={showFriendsLayer}
                                        setShowFriendsLayer={
                                            setShowFriendsLayer
                                        }
                                        selectedFriendId={selectedFriendId}
                                        setSelectedFriendId={
                                            setSelectedFriendId
                                        }
                                        friends={friends}
                                        friendRequests={friendRequests}
                                        setIsOpen={setIsOpen}
                                        setShowInviteDialog={
                                            setShowInviteDialog
                                        }
                                        onAcceptRequest={handleAcceptRequest}
                                        onRejectRequest={handleRejectRequest}
                                        processingRequest={processingRequest}
                                        isMobile={isMobile}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}

            {/* Invite Dialog */}
            <InviteDialog
                isOpen={showInviteDialog}
                onClose={() => setShowInviteDialog(false)}
            />
        </>
    );
}
