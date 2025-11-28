"use client";

import { useEffect, useState } from "react";
import { useFriendStore } from "@/lib/store";
import { useFriendAPI } from "@/lib/hooks";
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
    friendPinories,
  } = useFriendStore();

  const { fetchFriends } = useFriendAPI();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (showFriendsLayer && friends.length === 0) {
      fetchFriends();
    }
  }, [showFriendsLayer, friends.length, fetchFriends]);

  return (
    <div className="absolute top-4 right-20 z-[10]">
      {/* Toggle Button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            className="absolute top-0 right-0 z-[11]"
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
              variant={showFriendsLayer ? "default" : "outline"}
              size="icon"
              onClick={() => setIsOpen(true)}
              className="shadow-lg rounded-full w-12 h-12 relative hover:scale-110 active:scale-95 transition-transform duration-200 bg-white border-2"
              style={{
                borderColor: showFriendsLayer
                  ? "var(--color-primary-500)"
                  : "var(--color-neutral-200)",
                backgroundColor: showFriendsLayer
                  ? "var(--color-primary-500)"
                  : "white",
                color: showFriendsLayer ? "white" : "var(--color-neutral-700)",
              }}
              title="Friends' Places"
            >
              <Users className="w-5 h-5" />
              {showFriendsLayer && friendPinories.length > 0 && (
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
                    backgroundColor: "var(--color-primary-600)",
                  }}
                >
                  {friendPinories.length > 99 ? "99+" : friendPinories.length}
                </motion.span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="absolute top-0 right-0 z-[10]"
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
            <Card
              className="w-80 max-w-[calc(100vw-5rem)] border-2 bg-white"
              style={{
                boxShadow: "var(--shadow-lg)",
                borderColor: "var(--color-neutral-200)",
              }}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div
                  className="flex items-center justify-between pb-3 border-b-2"
                  style={{
                    borderColor: "var(--color-neutral-200)",
                  }}
                >
                  <h3
                    className="font-bold flex items-center gap-2 text-base"
                    style={{
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    <Users
                      className="w-5 h-5"
                      style={{
                        color: "var(--color-primary-500)",
                      }}
                    />
                    Friends' Places
                    {friendPinories.length > 0 && (
                      <span
                        className="text-white text-xs rounded-full px-2 py-0.5 font-bold"
                        style={{
                          backgroundColor: "var(--color-primary-500)",
                        }}
                      >
                        {friendPinories.length}
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
                      className="h-8 w-8 transition-colors duration-200"
                      style={{
                        color: "var(--color-neutral-700)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-neutral-100)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>

                {/* Show/Hide Toggle */}
                <motion.div
                  className="flex items-center justify-between py-3 px-3 rounded-lg border"
                  style={{
                    backgroundColor: "var(--color-neutral-100)",
                    borderColor: "var(--color-neutral-200)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{
                    backgroundColor: "var(--color-neutral-50)",
                  }}
                >
                  <Label
                    htmlFor="show-friends-layer"
                    className="text-sm font-semibold cursor-pointer"
                    style={{
                      color: "var(--color-neutral-900)",
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
                        color: "var(--color-neutral-600)",
                      }}
                    >
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
                        className="w-full text-left p-3 rounded-lg transition-colors duration-200 border-2"
                        style={{
                          backgroundColor:
                            selectedFriendId === null
                              ? "var(--color-primary-50)"
                              : "white",
                          borderColor:
                            selectedFriendId === null
                              ? "var(--color-primary-500)"
                              : "var(--color-neutral-200)",
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
                              background:
                                "linear-gradient(to bottom right, var(--color-primary-500), var(--color-primary-700))",
                            }}
                          >
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            All Friends
                          </span>
                          <motion.span
                            className="ml-auto text-xs font-bold text-white rounded-full px-2.5 py-1 min-w-[28px] text-center"
                            style={{
                              backgroundColor: "var(--color-primary-500)",
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
                                ? "var(--color-primary-50)"
                                : "white",
                            borderColor:
                              selectedFriendId === friend.id
                                ? "var(--color-primary-500)"
                                : "var(--color-neutral-200)",
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
                                  alt={friend.name || friend.email}
                                  width={32}
                                  height={32}
                                  className="rounded-full border-2 shadow-sm"
                                  style={{
                                    borderColor: "var(--color-neutral-200)",
                                  }}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                                style={{
                                  background:
                                    "linear-gradient(to bottom right, var(--color-neutral-500), var(--color-neutral-700))",
                                }}
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
                            <span
                              className="text-sm font-semibold truncate flex-1"
                              style={{
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {friend.name || friend.email}
                            </span>
                            {friend.pinoriesCount > 0 && (
                              <motion.span
                                className="text-xs font-bold rounded-full px-2.5 py-1 min-w-[28px] text-center"
                                style={{
                                  backgroundColor: "var(--color-neutral-100)",
                                  color: "var(--color-neutral-700)",
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
                      backgroundColor: "var(--color-neutral-50)",
                      borderColor: "var(--color-neutral-200)",
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
                        background:
                          "linear-gradient(to bottom right, var(--color-neutral-500), var(--color-neutral-700))",
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
                      <Users className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.p
                      className="font-bold text-sm"
                      style={{
                        color: "var(--color-neutral-900)",
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
                        color: "var(--color-neutral-600)",
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
