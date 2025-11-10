import React from "react";

/**
 * Utility functions for handling images in the application
 */

/**
 * Check if a string is a base64 data URL
 */
export function isBase64Image(url: string): boolean {
    return typeof url === "string" && url.startsWith("data:image");
}

/**
 * Check if a string is a valid HTTP/HTTPS URL
 */
export function isHttpUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Check if an image URL is valid (either base64 or HTTP/HTTPS)
 */
export function isValidImageUrl(url: string): boolean {
    return isBase64Image(url) || isHttpUrl(url);
}

/**
 * Get image type (base64, url, or invalid)
 */
export function getImageType(url: string): "base64" | "url" | "invalid" {
    if (isBase64Image(url)) return "base64";
    if (isHttpUrl(url)) return "url";
    return "invalid";
}

/**
 * React component for rendering images that can be either base64 or URL
 */
interface ImageDisplayProps {
    src: string;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
}

export function ImageDisplay({ src, alt, className, fallback }: ImageDisplayProps) {
    const [hasError, setHasError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    const imageType = getImageType(src);

    // Debug logging
    React.useEffect(() => {
        console.log('🖼️ ImageDisplay:', { src, imageType, isValid: imageType !== 'invalid' });
    }, [src, imageType]);

    if (imageType === "invalid") {
        console.warn('⚠️ Invalid image URL:', src);
        return fallback ? React.createElement(React.Fragment, null, fallback) : null;
    }

    if (hasError) {
        console.error('❌ Failed to load image:', src);
        // Return fallback or error placeholder instead of hiding
        return fallback ? React.createElement(React.Fragment, null, fallback) :
            React.createElement('div', {
                className: `${className} flex items-center justify-center bg-neutral-800`,
                style: { minHeight: '100px' }
            },
                React.createElement('span', { className: 'text-2xl' }, '📷'),
                React.createElement('span', {
                    className: 'text-xs text-red-400 ml-2',
                    title: src
                }, 'Lỗi tải ảnh')
            );
    }

    return React.createElement('div', { className: 'relative' },
        isLoading && React.createElement('div', {
            className: 'absolute inset-0 flex items-center justify-center bg-neutral-800',
        },
            React.createElement('div', { className: 'animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full' })
        ),
        React.createElement("img", {
            src,
            alt,
            className,
            onLoad: () => {
                console.log('✅ Image loaded successfully:', src);
                setIsLoading(false);
            },
            onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                console.error('❌ Image failed to load:', src);
                const target = e.target as HTMLImageElement;
                console.error('❌ Error details:', {
                    naturalWidth: target.naturalWidth,
                    naturalHeight: target.naturalHeight,
                    complete: target.complete
                });
                setHasError(true);
                setIsLoading(false);
            }
        })
    );
}

/**
 * Hook for handling image loading states
 */
export function useImageLoader() {
    const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
    const [errorStates, setErrorStates] = React.useState<Record<string, boolean>>({});

    const handleImageLoad = (url: string) => {
        setLoadingStates(prev => ({ ...prev, [url]: false }));
        setErrorStates(prev => ({ ...prev, [url]: false }));
    };

    const handleImageError = (url: string) => {
        setLoadingStates(prev => ({ ...prev, [url]: false }));
        setErrorStates(prev => ({ ...prev, [url]: true }));
    };

    const startLoading = (url: string) => {
        setLoadingStates(prev => ({ ...prev, [url]: true }));
        setErrorStates(prev => ({ ...prev, [url]: false }));
    };

    return {
        isLoading: (url: string) => loadingStates[url] || false,
        hasError: (url: string) => errorStates[url] || false,
        handleImageLoad,
        handleImageError,
        startLoading,
    };
}