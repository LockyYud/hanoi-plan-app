import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to upload images to ShareVoucher API
 * This bypasses CORS issues by making the request from server-side
 */
export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Proxy: Starting image upload to ShareVoucher API');

        // Get the file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        console.log('📁 File received:', {
            name: file.name,
            size: file.size,
            type: file.type
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

        // Extract image URL from response
        const imageUrl = result.url || result.data?.url || result.image_url;

        if (!imageUrl) {
            console.error('❌ No image URL in response:', result);
            return NextResponse.json(
                { error: 'No image URL returned from ShareVoucher API', details: result },
                { status: 500 }
            );
        }

        console.log('🎯 Image uploaded successfully:', imageUrl);

        return NextResponse.json({
            success: true,
            url: imageUrl,
            originalResponse: result
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
