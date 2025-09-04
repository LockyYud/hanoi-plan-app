import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_CLIENT_ID !== "demo-google-client-id"
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })]
            : []),
        // EmailProvider({
        //   server: {
        //     host: process.env.EMAIL_SERVER_HOST,
        //     port: process.env.EMAIL_SERVER_PORT,
        //     auth: {
        //       user: process.env.EMAIL_SERVER_USER,
        //       pass: process.env.EMAIL_SERVER_PASSWORD,
        //     },
        //   },
        //   from: process.env.EMAIL_FROM,
        // }),
    ],
    session: {
        strategy: "database",
    },
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id
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
}
