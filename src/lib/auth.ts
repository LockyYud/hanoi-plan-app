import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// Temporarily commented out for JWT strategy
// import { PrismaAdapter } from "@auth/prisma-adapter"
// import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    // Temporarily disable database adapter to fix Vercel session issues
    // Will re-enable after confirming JWT strategy works
    // ...(hasRequiredEnvVars && hasDatabaseConnection ? { adapter: PrismaAdapter(prisma) } : {}),

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
        strategy: "jwt", // Force JWT strategy for reliable Vercel deployment
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    callbacks: {
        // JWT callback - runs on sign in and when JWT is accessed
        jwt: async ({ token, user, account, profile }) => {
            console.log("JWT callback called:", { 
                hasToken: !!token, 
                hasUser: !!user, 
                hasAccount: !!account,
                provider: account?.provider 
            });

            // Initial sign in - user object is available
            if (user) {
                console.log("JWT callback - initial sign in:", user);
                
                // Store user data in token
                token.uid = user.id;
                token.email = user.email;
                token.name = user.name;
                
                // Handle Google profile data
                if (account?.provider === "google" && profile) {
                    const googleProfile = profile as { picture?: string };
                    token.picture = googleProfile.picture || user.image;
                    console.log("JWT callback - stored Google profile picture");
                }
                
                console.log("JWT callback - token enriched with user data");
            }

            console.log("JWT callback result - token keys:", Object.keys(token));
            return token;
        },

        // Session callback - shapes the session object returned to client
        session: async ({ session, token }) => {
            console.log("Session callback called:", { 
                hasSession: !!session, 
                hasToken: !!token,
                tokenKeys: token ? Object.keys(token) : [] 
            });

            if (session?.user && token) {
                // Map token data to session
                session.user.id = token.uid as string || token.sub || "anonymous";
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
                
                console.log("Session callback - session user ID:", session.user.id);
            }

            console.log("Session callback result:", {
                hasUser: !!session?.user,
                userId: session?.user?.id,
                userEmail: session?.user?.email
            });
            
            return session;
        },

        // Sign in callback - control whether sign in is allowed
        signIn: async ({ user, account }) => {
            console.log("SignIn callback called:", {
                provider: account?.provider,
                userId: user?.id,
                userEmail: user?.email
            });
            
            console.log("SignIn callback - approved for provider:", account?.provider);
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
