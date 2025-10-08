import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        const debug = {
            hasSession: !!session,
            sessionData: session ? {
                user: {
                    id: session.user?.id,
                    name: session.user?.name,
                    email: session.user?.email,
                    hasImage: !!session.user?.image,
                },
                expires: session.expires,
            } : null,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(debug);
    } catch (error) {
        return NextResponse.json({
            error: "Failed to get session",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
