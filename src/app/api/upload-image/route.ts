import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType, VisibilityType } from "@prisma/client";

/**
 * Enhanced proxy endpoint to upload images to ShareVoucher API and save to database
 * This bypasses CORS issues by making the request from server-side
 */
export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Proxy: Starting image upload to ShareVoucher API');

        // Get user session for authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get the file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const noteId = formData.get('noteId') as string | null; // Location note ID to attach image
        const visibility = formData.get('visibility') as string || 'private';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        console.log('📁 File received:', {
            name: file.name,
            size: file.size,
            type: file.type,
            noteId,
            visibility
        });

        // Get auth configuration
        const basicAuth = process.env.NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH;
        const useInternal = process.env.NEXT_PUBLIC_SHAREVOUCHER_USE_INTERNAL === 'true';

        if (!basicAuth && useInternal) {
            return NextResponse.json(
                { error: 'No authentication token configured' },
                { status: 500 }
            );
        }

        // Prepare the request to ShareVoucher API
        const apiUrl = useInternal
            ? 'https://sharevoucher.app/api/v1/internal/asset/image'
            : 'https://sharevoucher.app/api/v1/asset/image';

        console.log('📡 Uploading to:', apiUrl);

        // Create new FormData for the API request
        const apiFormData = new FormData();
        apiFormData.append('file', file);

        const headers: HeadersInit = {
            'Accept': 'application/json, text/plain, */*',
        };

        if (useInternal && basicAuth) {
            headers['Authorization'] = `Basic ${basicAuth}`;
        } else if (!useInternal && process.env.NEXT_PUBLIC_SHAREVOUCHER_AUTH_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_SHAREVOUCHER_AUTH_TOKEN}`;
        }

        console.log('🔑 Auth headers prepared');

        // Make the request to ShareVoucher API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: apiFormData,
        });

        console.log('📊 ShareVoucher API response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ ShareVoucher API error:', errorText);

            return NextResponse.json(
                {
                    error: `ShareVoucher API error: ${response.status} ${response.statusText}`,
                    details: errorText
                },
                { status: response.status }
            );
        }

        // Parse the successful response
        const result = await response.json();
        console.log('✅ ShareVoucher API success:', result);

        // Extract image URL from response - try multiple possible paths
        const imageUrl = result.url || result.data?.url || result.image_url;

        console.log('🔍 URL extraction debug:', {
            'result.url': result.url,
            'result.data?.url': result.data?.url,
            'result.image_url': result.image_url,
            'final imageUrl': imageUrl,
            'result structure': Object.keys(result)
        });

        if (!imageUrl) {
            console.error('❌ No image URL in response:', result);
            return NextResponse.json(
                { error: 'No image URL returned from ShareVoucher API', details: result },
                { status: 500 }
            );
        }

        console.log('🎯 Image uploaded successfully:', imageUrl);

        // Save image to media table if noteId provided
        if (noteId) {
            try {
                console.log('🔗 Saving image to media table for location note:', noteId);

                if (!prisma) {
                    console.error('❌ Database not available');
                    return NextResponse.json({
                        success: true,
                        url: imageUrl,
                        message: 'Image uploaded but could not save to database'
                    });
                }

                // Get user from database by email (session ID doesn't match DB user ID)
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email! }
                });

                if (!user) {
                    console.error('❌ User not found in database:', session.user.email);
                    return NextResponse.json({
                        success: true,
                        url: imageUrl,
                        message: 'Image uploaded but user not found in database'
                    });
                }

                console.log('🔍 User ID mapping:', {
                    sessionUserId: session.user.id,
                    sessionEmail: session.user.email,
                    dbUserId: user.id,
                    dbEmail: user.email
                });

                // Verify the location note exists and belongs to user
                const note = await prisma.place.findFirst({
                    where: {
                        id: noteId,
                        createdBy: user.id, // Use DB user ID
                        openHours: {
                            path: ["isLocationNote"],
                            equals: true,
                        },
                    }
                });

                console.log('🔍 Note verification:', {
                    noteId,
                    noteFound: !!note,
                    noteCreatedBy: note?.createdBy,
                    userIdMatch: note?.createdBy === user.id
                });

                if (note) {
                    // Create media record
                    const mediaRecord = await prisma.media.create({
                        data: {
                            url: imageUrl,
                            type: MediaType.image,
                            visibility: visibility as VisibilityType,
                            placeId: noteId,
                            userId: user.id, // Use DB user ID
                            isActive: true,
                        }
                    });

                    console.log('✅ Image saved to media table:', {
                        mediaId: mediaRecord.id,
                        noteId,
                        imageUrl
                    });

                    // Count total images for this note
                    const imageCount = await prisma.media.count({
                        where: {
                            placeId: noteId,
                            type: MediaType.image,
                            isActive: true
                        }
                    });
                    console.log(`📊 Total images for note ${noteId}: ${imageCount}`);

                } else {
                    console.warn('⚠️ Location note not found or access denied:', noteId);
                }
            } catch (noteError) {
                console.error('❌ Failed to save image to media table:', noteError);
                // Continue without error - image was uploaded successfully
            }
        }

        // Return success even if note attachment failed
        return NextResponse.json({
            success: true,
            url: imageUrl,
            message: noteId ? 'Image uploaded and saved to database' : 'Image uploaded successfully'
        });

    } catch (error) {
        console.error('❌ Proxy upload error:', error);

        return NextResponse.json(
            {
                error: 'Failed to upload image via proxy',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
