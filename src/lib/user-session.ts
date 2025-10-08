import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get or create user from session for JWT strategy compatibility
 * Since JWT strategy doesn't automatically create user records,
 * we need to find/create them on-demand for API endpoints that require database user records
 */
export async function getUserFromSession() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return { user: null, session: null, error: "Authentication required" };
    }

    if (!prisma) {
        return { user: null, session, error: "Database not available" };
    }

    try {
        // Find existing user
        let user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        // Create user if doesn't exist (JWT strategy compatibility)
        if (!user) {
            console.log(`👤 Creating new user for: ${session.user.email}`);
            user = await prisma.user.create({
                data: {
                    email: session.user.email,
                    name: session.user.name || "Unknown User",
                    avatarUrl: session.user.image || undefined,
                },
            });
        }

        return { user, session, error: null };
    } catch (error) {
        console.error("Error getting/creating user:", error);
        return { user: null, session, error: "Failed to get user" };
    }
}
