-- Update existing invitation URLs that contain localhost
-- Run this after deploying to production
-- First, check how many invitations need updating
SELECT
    id,
    userId,
    inviteCode,
    inviteUrl,
    createdAt
FROM
    FriendInvitation
WHERE
    inviteUrl LIKE '%localhost%'
ORDER BY
    createdAt DESC;

-- Update invitation URLs
-- Replace 'https://your-domain.vercel.app' with your actual production URL
UPDATE FriendInvitation
SET
    inviteUrl = REPLACE (
        inviteUrl,
        'http://localhost:3000',
        'https://your-domain.vercel.app'
    )
WHERE
    inviteUrl LIKE '%localhost%';

-- Verify the update
SELECT
    id,
    userId,
    inviteCode,
    inviteUrl,
    createdAt
FROM
    FriendInvitation
WHERE
    inviteCode IN (
        SELECT
            inviteCode
        FROM
            FriendInvitation
        WHERE
            inviteUrl NOT LIKE '%localhost%'
    )
ORDER BY
    createdAt DESC;