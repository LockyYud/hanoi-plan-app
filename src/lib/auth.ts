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
            if (session?.user) {
                // Use user.id from database if available, otherwise use token
                session.user.id = user?.id || token?.sub || "anonymous"
            }
            return session
        },
        jwt: async ({ user, token }) => {
            if (user) {
                token.uid = user.id
            }
            return token
        },
        // Map Google profile fields to Prisma schema
        signIn: async ({ user, account, profile }) => {
            if (account?.provider === "google" && profile) {
                console.log("SignIn callback - original user:", user);
                console.log("SignIn callback - profile:", profile);

                // Map Google's 'picture' field to our 'avatarUrl' field
                user.avatarUrl = (profile as any).picture || user.image;
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

    // Add secret - required for production
    secret: process.env.NEXTAUTH_SECRET,

    // Debug mode for production troubleshooting
    debug: process.env.NODE_ENV === "development",
}
