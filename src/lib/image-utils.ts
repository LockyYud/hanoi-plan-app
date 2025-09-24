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
    const imageType = getImageType(src);

    if (imageType === "invalid") {
        return fallback ? React.createElement(React.Fragment, null, fallback) : null;
    }

    return React.createElement("img", {
        src,
        alt,
        className,
        onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
            // Hide broken images
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
        }
    });
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