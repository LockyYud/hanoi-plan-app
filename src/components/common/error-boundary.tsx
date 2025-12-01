"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error Boundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const FallbackComponent =
                this.props.fallback || DefaultErrorFallback;
            return (
                <FallbackComponent
                    error={this.state.error}
                    reset={() =>
                        this.setState({ hasError: false, error: undefined })
                    }
                />
            );
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({
    error,
    reset,
}: {
    error?: Error;
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Có lỗi xảy ra
                </h2>

                <p className="text-gray-600 mb-4">
                    Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
                </p>

                {error && process.env.NODE_ENV === "development" && (
                    <details className="mb-4 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                            Chi tiết lỗi (Development)
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                <div className="space-y-2">
                    <Button onClick={reset} className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="w-full"
                    >
                        Tải lại trang
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default ErrorBoundary;
