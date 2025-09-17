import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Check if we have required environment variables and database
const hasRequiredEnvVars = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL;
const hasDatabaseConnection = prisma !== null;

export const authOptions: NextAuthOptions = {
    // Enable PrismaAdapter now that schema is fixed
    ...(hasRequiredEnvVars && hasDatabaseConnection ? { adapter: PrismaAdapter(prisma) } : {}),

    providers: [
        ...(process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_CLIENT_ID !== "demo-google-client-id"
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })]
            : []),
    ],

    session: {
        strategy: (hasRequiredEnvVars && hasDatabaseConnection) ? "database" : "jwt",
    },

    callbacks: {
        session: async ({ session, user, token }) => {
            console.log("Session callback called:", { session: !!session, user: !!user, token: !!token });
            
            if (session?.user) {
                // For database strategy, use user.id; for JWT strategy, use token.sub
                if (user?.id) {
                    session.user.id = user.id;
                    console.log("Session callback - using database user ID:", user.id);
                } else if (token?.sub) {
                    session.user.id = token.sub;
                    console.log("Session callback - using JWT token sub:", token.sub);
                } else {
                    session.user.id = "anonymous";
                    console.log("Session callback - fallback to anonymous");
                }
            }
            
            console.log("Session callback result:", session);
            return session;
        },
        jwt: async ({ user, token }) => {
            console.log("JWT callback called:", { user: !!user, token: !!token });
            
            if (user) {
                token.uid = user.id;
                console.log("JWT callback - set token.uid:", user.id);
            }
            
            console.log("JWT callback result:", token);
            return token;
        },
        // Map Google profile fields to Prisma schema
        signIn: async ({ user, account, profile }) => {
            console.log("SignIn callback called:", { 
                provider: account?.provider, 
                userId: user?.id,
                userEmail: user?.email 
            });
            
            if (account?.provider === "google" && profile) {
                console.log("SignIn callback - original user:", user);
                console.log("SignIn callback - profile:", profile);

                // Map Google's 'picture' field to our 'avatarUrl' field
                user.avatarUrl = (profile as { picture?: string }).picture || user.image || undefined;
                // Remove the image field to avoid Prisma validation error
                delete user.image;

                console.log("SignIn callback - modified user:", user);
            }
            return true;
        },
    },

    pages: {
        signIn: "/",
        error: "/",
    },

    // Add secret with fallback
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",

    // Debug mode for production troubleshooting
    debug: process.env.NODE_ENV === "development" || process.env.NEXTAUTH_DEBUG === "true",
}
