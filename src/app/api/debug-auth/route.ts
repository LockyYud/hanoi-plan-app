import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const debug = {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        googleClientIdValid: process.env.GOOGLE_CLIENT_ID !== "demo-google-client-id",
        providersCount: authOptions.providers?.length || 0,
        sessionStrategy: authOptions.session?.strategy,
        debug: authOptions.debug,
        environment: process.env.NODE_ENV,
    };

    return NextResponse.json(debug);
}


