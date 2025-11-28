/**
 * useFriendAPI
 * 
 * API hook for Friend-related operations.
 * Handles all API calls and updates the useFriendStore.
 * 
 * Separates data fetching from state management.
 */

import { useCallback } from 'react';
import { useFriendStore } from '@/lib/store';

export function useFriendAPI() {
    const {
        setFriends,
        setFriendRequests,
        setFriendPinories,
        setActivityFeed,
        setLoading,
        removeFriendRequest: removeFriendRequestFromStore,
        removeFriend: removeFriendFromStore,
    } = useFriendStore();

    /**
     * Fetch user's friends list
     */
    const fetchFriends = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/friends', {
                credentials: 'include',
            });
            console.log('Fetching friends...');
            if (response.ok) {
                const data = await response.json();
                console.log('Response status:', data);
                setFriends(data.friends);
            } else {
                console.error('Failed to fetch friends:', response.status);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    }, [setFriends, setLoading]);

    /**
     * Fetch friend requests
     */
    const fetchFriendRequests = useCallback(async () => {
        try {
            const response = await fetch('/api/friends/requests?type=received', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data.requests);
            } else {
                console.error('Failed to fetch friend requests:', response.status);
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    }, [setFriendRequests]);

    /**
     * Fetch friend pinories (location notes)
     */
    const fetchFriendPinories = useCallback(
        async (friendId?: string) => {
            try {
                setLoading(true);
                const url = friendId
                    ? `/api/location-notes?type=friends&friendId=${friendId}`
                    : '/api/location-notes?type=friends';

                const response = await fetch(url, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    // API trả về array trực tiếp, không có property locationNotes
                    setFriendPinories(Array.isArray(data) ? data : []);
                } else {
                    console.error('Failed to fetch friend location notes:', response.status);
                    setFriendPinories([]);
                }
            } catch (error) {
                console.error('Error fetching friend location notes:', error);
                setFriendPinories([]);
            } finally {
                setLoading(false);
            }
        },
        [setFriendPinories, setLoading]
    );

    /**
     * Fetch activity feed
     */
    const fetchActivityFeed = useCallback(
        async (type = 'all') => {
            try {
                setLoading(true);
                const response = await fetch(`/api/feed?type=${type}&limit=50`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setActivityFeed(data.feed);
                } else {
                    console.error('Failed to fetch activity feed:', response.status);
                }
            } catch (error) {
                console.error('Error fetching activity feed:', error);
            } finally {
                setLoading(false);
            }
        },
        [setActivityFeed, setLoading]
    );

    /**
     * Send friend request
     */
    const sendFriendRequest = useCallback(async (targetUserId: string) => {
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId }),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Friend request sent:', data);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }, []);

    /**
     * Accept friend request
     */
    const acceptFriendRequest = useCallback(
        async (requestId: string) => {
            try {
                const response = await fetch(`/api/friends/accept/${requestId}`, {
                    method: 'POST',
                    credentials: 'include',
                });

                if (response.ok) {
                    // Remove from requests, refresh friends list
                    removeFriendRequestFromStore(requestId);
                    await fetchFriends();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to accept friend request');
                }
            } catch (error) {
                console.error('Error accepting friend request:', error);
                throw error;
            }
        },
        [removeFriendRequestFromStore, fetchFriends]
    );

    /**
     * Reject friend request
     */
    const rejectFriendRequest = useCallback(
        async (requestId: string) => {
            try {
                const response = await fetch(`/api/friends/reject/${requestId}`, {
                    method: 'POST',
                    credentials: 'include',
                });

                if (response.ok) {
                    removeFriendRequestFromStore(requestId);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to reject friend request');
                }
            } catch (error) {
                console.error('Error rejecting friend request:', error);
                throw error;
            }
        },
        [removeFriendRequestFromStore]
    );

    /**
     * Unfriend a user
     */
    const unfriend = useCallback(
        async (friendshipId: string) => {
            try {
                const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    removeFriendFromStore(friendshipId);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to unfriend');
                }
            } catch (error) {
                console.error('Error unfriending:', error);
                throw error;
            }
        },
        [removeFriendFromStore]
    );

    return {
        fetchFriends,
        fetchFriendRequests,
        fetchFriendPinories,
        fetchActivityFeed,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        unfriend,
    };
}
