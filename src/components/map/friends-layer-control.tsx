"use client";

import { useEffect, useState } from "react";
import { useFriendStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, X, UserCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
        <div className="absolute top-4 right-20 z-10">
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        className="absolute top-0 right-0"
                        initial={{ scale: 0, opacity: 0 }}
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
                            variant={showFriendsLayer ? "default" : "outline"}
                            size="icon"
                            onClick={() => setIsOpen(true)}
                            className="shadow-lg rounded-full w-12 h-12 relative hover:scale-110 active:scale-95 transition-transform duration-200"
                            title="Friends' Places"
                        >
                            <Users className="w-5 h-5" />
                            {showFriendsLayer &&
                                friendLocationNotes.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 15,
                                            delay: 0.1,
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                                    >
                                        {friendLocationNotes.length > 99
                                            ? "99+"
                                            : friendLocationNotes.length}
                                    </motion.span>
                                )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Control Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute top-0 right-0"
                        initial={{
                            opacity: 0,
                            scale: 0,
                            originX: 1,
                            originY: 0,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            originX: 1,
                            originY: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0,
                            originX: 1,
                            originY: 0,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                        }}
                    >
                        <Card className="w-80 shadow-xl border-2 border-gray-300 bg-white">
                            <div className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                                    <h3 className="font-bold flex items-center gap-2 text-base text-gray-900">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        Friends' Places
                                        {friendLocationNotes.length > 0 && (
                                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                                                {friendLocationNotes.length}
                                            </span>
                                        )}
                                    </h3>
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
                                            className="h-8 w-8 hover:bg-gray-100 transition-colors duration-200"
                                        >
                                            <X className="w-5 h-5 text-gray-700" />
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Show/Hide Toggle */}
                                <motion.div
                                    className="flex items-center justify-between py-3 px-3 bg-gray-100 rounded-lg border border-gray-200"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    whileHover={{
                                        backgroundColor: "rgb(243 244 246)",
                                    }}
                                >
                                    <Label
                                        htmlFor="show-friends-layer"
                                        className="text-sm font-semibold cursor-pointer text-gray-900"
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
                                        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Filter by friend
                                        </Label>
                                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            <motion.button
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                                whileHover={{
                                                    scale: 1.02,
                                                    x: 2,
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`w-full text-left p-3 rounded-lg hover:bg-blue-100 transition-colors duration-200 border-2 ${
                                                    selectedFriendId === null
                                                        ? "bg-blue-100 border-blue-400 shadow-sm"
                                                        : "border-gray-200 hover:border-blue-300"
                                                }`}
                                                onClick={() =>
                                                    setSelectedFriendId(null)
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                                                        <Users className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        All Friends
                                                    </span>
                                                    <motion.span
                                                        className="ml-auto text-xs font-bold bg-blue-500 text-white rounded-full px-2.5 py-1 min-w-[28px] text-center"
                                                        key={
                                                            friendLocationNotes.length
                                                        }
                                                        initial={{ scale: 1.3 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 500,
                                                        }}
                                                    >
                                                        {
                                                            friendLocationNotes.length
                                                        }
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
                                                        delay:
                                                            0.35 + index * 0.05,
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 25,
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        x: 2,
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 border-2 ${
                                                        selectedFriendId ===
                                                        friend.id
                                                            ? "bg-blue-50 border-blue-400 shadow-sm"
                                                            : "border-gray-200 hover:border-blue-300"
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedFriendId(
                                                            friend.id
                                                        )
                                                    }
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
                                                                    src={
                                                                        friend.avatarUrl
                                                                    }
                                                                    alt={
                                                                        friend.name ||
                                                                        friend.email
                                                                    }
                                                                    width={32}
                                                                    height={32}
                                                                    className="rounded-full border-2 border-gray-200 shadow-sm"
                                                                />
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div
                                                                className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-md"
                                                                whileHover={{
                                                                    rotate: 5,
                                                                }}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 300,
                                                                }}
                                                            >
                                                                <UserCircle2 className="w-5 h-5 text-white" />
                                                            </motion.div>
                                                        )}
                                                        <span className="text-sm font-semibold text-gray-900 truncate flex-1">
                                                            {friend.name ||
                                                                friend.email}
                                                        </span>
                                                        {friend.locationNotesCount >
                                                            0 && (
                                                            <motion.span
                                                                className="text-xs font-bold bg-gray-200 text-gray-700 rounded-full px-2.5 py-1 min-w-[28px] text-center"
                                                                key={
                                                                    friend.locationNotesCount
                                                                }
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
                                                                {
                                                                    friend.locationNotesCount
                                                                }
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
                                        className="text-center py-8 bg-gray-100 rounded-lg border-2 border-gray-200"
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
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-3 shadow-md"
                                            animate={{
                                                rotate: [0, 10, -10, 10, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatDelay: 3,
                                            }}
                                        >
                                            <Users className="w-6 h-6 text-white" />
                                        </motion.div>
                                        <motion.p
                                            className="font-bold text-gray-900 text-sm"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            No friends yet
                                        </motion.p>
                                        <motion.p
                                            className="text-xs mt-1 text-gray-700 font-medium"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            Add friends to see their locations
                                        </motion.p>
                                    </motion.div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
