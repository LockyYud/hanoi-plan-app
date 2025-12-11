import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PublicPinoryView } from "@/components/pinory/share/public-pinory-view";
import { FriendPinoryShareView } from "@/components/pinory/share/friend-pinory-share-view";

interface SharePageProps {
    params: Promise<{
        shareSlug: string;
    }>;
}

/**
 * Fetch shared pinory data server-side
 */
async function getSharedPinory(shareSlug: string, session: any) {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const response = await fetch(
            `${baseUrl}/api/pinory/share/${shareSlug}`,
            {
                headers: {
                    // Pass session cookie if available
                    cookie: session
                        ? `next-auth.session-token=${session.sessionToken}`
                        : "",
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching shared pinory:", error);
        return null;
    }
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({
    params,
}: SharePageProps): Promise<Metadata> {
    const { shareSlug } = await params;
    const session = await getServerSession(authOptions);
    const data = await getSharedPinory(shareSlug, session);

    if (!data?.pinory) {
        return {
            title: "Pinory Not Found",
            description: "This shared location could not be found.",
        };
    }

    const { pinory } = data;
    const firstImage = pinory.images?.[0];

    return {
        title: `${pinory.name} - Shared on Pinory`,
        description:
            pinory.note ||
            pinory.content ||
            `Check out this location in Hanoi: ${pinory.address}`,
        openGraph: {
            title: pinory.name,
            description:
                pinory.note ||
                pinory.content ||
                `A location shared on Pinory: ${pinory.address}`,
            images: firstImage ? [firstImage] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: pinory.name,
            description:
                pinory.note ||
                pinory.content ||
                `A location shared on Pinory: ${pinory.address}`,
            images: firstImage ? [firstImage] : [],
        },
    };
}

/**
 * Universal Share Page - Entry point for all share links
 * Server-side logic determines which view to show
 */
export default async function SharePage({ params }: SharePageProps) {
    const { shareSlug } = await params;
    const session = await getServerSession(authOptions);
    const data = await getSharedPinory(shareSlug, session);

    // Handle not found
    if (!data || !data.canView) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Cannot Access This Share
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        {data?.reason ||
                            "This share link is invalid, expired, or you don't have permission to view it."}
                    </p>
                    {!session && (
                        <div className="pt-4">
                            <a
                                href="/login"
                                className="text-blue-500 hover:underline"
                            >
                                Sign in to view
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { viewType, pinory, shareInfo } = data;

    // CASE 1: Owner viewing their own share -> redirect to map
    if (viewType === "owner") {
        redirect(`/?pinory=${pinory.id}`);
    }

    // CASE 2: Friend viewing -> Show friend view
    if (viewType === "friend") {
        return <FriendPinoryShareView pinory={pinory} shareInfo={shareInfo} />;
    }

    // CASE 3: Public or anonymous -> Show public view
    return <PublicPinoryView pinory={pinory} shareInfo={shareInfo} />;
}
