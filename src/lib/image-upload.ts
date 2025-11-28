/**
 * Service for uploading images to ShareVoucher API
 */

interface ImageUploadResponse {
    success: boolean;
    url?: string;
    error?: string;
}

export class ImageUploadService {
    private static readonly API_BASE_URL = 'https://sharevoucher.app/api/v1';
    private static readonly INTERNAL_UPLOAD_ENDPOINT = '/internal/asset/image';

    /**
     * Upload image using the internal API endpoint (only method available)
     */
    static async uploadImage(file: File, basicAuthToken?: string): Promise<ImageUploadResponse> {
        try {
            console.log('🔍 Starting internal image upload:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                hasAuth: !!basicAuthToken
            });

            const formData = new FormData();
            formData.append('file', file);

            // Headers based on the cURL example
            const headers: HeadersInit = {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
            };

            if (basicAuthToken) {
                headers['authorization'] = `Basic ${basicAuthToken}`;
                console.log('🔑 Using Basic Auth token:', basicAuthToken.substring(0, 10) + '...');
            }

            const url = `${this.API_BASE_URL}${this.INTERNAL_UPLOAD_ENDPOINT}`;
            console.log('📡 Making request to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            console.log('📊 Response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
                try {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', errorText);
                    errorMessage += ` - ${errorText}`;
                } catch {
                    // If response reading fails, use default message
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ API Response:', result);

            // Extract image URL from response
            const imageUrl = result.url || result.data?.url || result.image_url;

            if (!imageUrl) {
                console.error('❌ No image URL in response:', result);
                throw new Error('No image URL returned from API');
            }

            console.log('🎯 Successfully got image URL:', imageUrl);
            return {
                success: true,
                url: imageUrl,
            };

        } catch (error) {
            console.error('❌ Internal image upload error:', error);
            console.error('🔍 Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error',
            };
        }
    }

    /**
     * Upload multiple images in parallel
     */
    static async uploadMultipleImages(
        files: File[],
        basicAuthToken?: string
    ): Promise<ImageUploadResponse[]> {
        const uploadPromises = files.map(file =>
            this.uploadImage(file, basicAuthToken)
        );

        return Promise.all(uploadPromises);
    }


}

/**
 * Hook for using image upload service in React components
 */
/**
 * Upload image via Next.js API proxy (bypasses CORS)
 */
async function uploadViaProxy(file: File, noteId?: string): Promise<ImageUploadResponse> {
    try {
        console.log('🔄 Uploading via proxy:', {
            fileName: file.name,
            noteId: noteId || 'none'
        });

        const formData = new FormData();
        formData.append('file', file);

        // Add noteId if provided
        if (noteId) {
            formData.append('noteId', noteId);
            console.log('📎 Attaching to note:', noteId);
        }

        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // If response is not JSON, use status text or default message
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        if (!result.success || !result.url) {
            throw new Error('Invalid response from proxy');
        }

        return {
            success: true,
            url: result.url,
        };

    } catch (error) {
        console.error('❌ Proxy upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown proxy error',
        };
    }
}

/**
 * Upload multiple files in parallel with concurrency limit
 */
async function uploadWithConcurrency(
    files: File[],
    noteId: string | undefined,
    concurrency: number = 3,
    onProgress?: (completed: number, total: number) => void
): Promise<ImageUploadResponse[]> {
    const results: ImageUploadResponse[] = new Array(files.length);
    let completedCount = 0;

    // Create chunks based on concurrency limit
    const chunks: number[][] = [];
    for (let i = 0; i < files.length; i += concurrency) {
        const chunk: number[] = [];
        for (let j = i; j < Math.min(i + concurrency, files.length); j++) {
            chunk.push(j);
        }
        chunks.push(chunk);
    }

    // Process each chunk in parallel
    for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (index) => {
            const result = await uploadViaProxy(files[index], noteId);
            results[index] = result;
            completedCount++;
            onProgress?.(completedCount, files.length);
            return result;
        });

        await Promise.all(chunkPromises);
    }

    return results;
}

export function useImageUpload() {
    const uploadImage = async (file: File, noteId?: string): Promise<ImageUploadResponse> => {
        return uploadViaProxy(file, noteId);
    };

    const uploadMultipleImages = async (
        files: File[],
        noteId?: string,
        onProgress?: (completed: number, total: number) => void
    ): Promise<ImageUploadResponse[]> => {
        // Upload images in parallel with concurrency limit of 3
        // This balances speed and server load
        return uploadWithConcurrency(files, noteId, 3, onProgress);
    };

    return {
        uploadImage,
        uploadMultipleImages,
    };
}
