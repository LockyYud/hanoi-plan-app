import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Check if we have required environment variables
const hasRequiredEnvVars = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL;

export const authOptions: NextAuthOptions = {
    // Only use PrismaAdapter if we have database connection
    ...(hasRequiredEnvVars ? { adapter: PrismaAdapter(prisma) } : {}),

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
        strategy: hasRequiredEnvVars ? "database" : "jwt",
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
    },

    pages: {
        signIn: "/",
        error: "/",
    },

    // Add secret with fallback
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",

    // Debug mode for production troubleshooting
    debug: process.env.NODE_ENV === "development",
}
