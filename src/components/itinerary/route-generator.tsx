"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Wand2, MapPin, Clock, Users, Settings, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { ItineraryCard } from "./itinerary-card";
import { toast } from "sonner";

interface RouteGeneratorProps {
    groupId: string;
    className?: string;
}

export function RouteGenerator({ groupId, className }: RouteGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedRoutes, setGeneratedRoutes] = useState<any[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
    const [showPreferences, setShowPreferences] = useState(false);

    // Preferences state
    const [maxStops, setMaxStops] = useState([5]);
    const [maxTravelTime, setMaxTravelTime] = useState([120]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [startLocation, setStartLocation] = useState("");
    const [endLocation, setEndLocation] = useState("");

    const handleGenerateRoutes = async () => {
        setIsGenerating(true);

        try {
            const preferences = {
                maxStops: maxStops[0],
                maxTravelTime: maxTravelTime[0],
                categories: selectedCategories,
                ...(startLocation && {
                    startLocation: {
                        lat: 21.0285,
                        lng: 105.8542,
                        name: startLocation,
                    },
                }),
                ...(endLocation && {
                    endLocation: {
                        lat: 21.0285,
                        lng: 105.8542,
                        name: endLocation,
                    },
                }),
            };

            const response = await fetch("/api/itineraries/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupId,
                    preferences,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate routes");
            }

            const result = await response.json();
            setGeneratedRoutes(result.routes);
            toast.success(`Đã tạo ${result.routes.length} lộ trình thú vị!`);
        } catch (error) {
            console.error("Error generating routes:", error);
            toast.error("Error creating route");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header & Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5" />
                            Auto-generate route
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreferences(!showPreferences)}
                        >
                            <Settings className="h-4 w-4 mr-1" />
                            Tùy chỉnh
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Preferences Panel */}
                    {showPreferences && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">
                                Tùy chỉnh lộ trình
                            </h4>

                            {/* Max Stops */}
                            <div className="space-y-2">
                                <Label>
                                    Số điểm tối đa: {maxStops[0]} điểm
                                </Label>
                                <Slider
                                    value={maxStops}
                                    onValueChange={setMaxStops}
                                    min={2}
                                    max={8}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            {/* Max Travel Time */}
                            <div className="space-y-2">
                                <Label>
                                    Thời gian tối đa:{" "}
                                    {Math.floor(maxTravelTime[0] / 60)}h
                                    {maxTravelTime[0] % 60}m
                                </Label>
                                <Slider
                                    value={maxTravelTime}
                                    onValueChange={setMaxTravelTime}
                                    min={60}
                                    max={480}
                                    step={30}
                                    className="w-full"
                                />
                            </div>

                            {/* Categories */}
                            <div className="space-y-2">
                                <Label>Loại địa điểm ưa thích</Label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((category) => (
                                        <Badge
                                            key={category}
                                            variant={
                                                selectedCategories.includes(
                                                    category
                                                )
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className="cursor-pointer"
                                            onClick={() =>
                                                toggleCategory(category)
                                            }
                                        >
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Start/End Locations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startLocation">
                                        Điểm bắt đầu (tùy chọn)
                                    </Label>
                                    <Input
                                        id="startLocation"
                                        value={startLocation}
                                        onChange={(e) =>
                                            setStartLocation(e.target.value)
                                        }
                                        placeholder="e.g., Central Park"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endLocation">
                                        Điểm kết thúc (tùy chọn)
                                    </Label>
                                    <Input
                                        id="endLocation"
                                        value={endLocation}
                                        onChange={(e) =>
                                            setEndLocation(e.target.value)
                                        }
                                        placeholder="e.g., Downtown"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerateRoutes}
                        disabled={isGenerating}
                        className="w-full"
                        size="lg"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating route...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Smart route
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Generated Routes */}
            {generatedRoutes.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                            Các lộ trình được đề xuất ({generatedRoutes.length})
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateRoutes}
                        >
                            Regenerate
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {generatedRoutes.map((route, index) => (
                            <ItineraryCard
                                key={route.id}
                                itinerary={route}
                                rank={index + 1}
                                isSelected={selectedRoute === route.id}
                                onSelect={() => setSelectedRoute(route.id)}
                                onEdit={() =>
                                    console.log("Edit route:", route.id)
                                }
                                onShare={() =>
                                    console.log("Share route:", route.id)
                                }
                            />
                        ))}
                    </div>

                    {/* Finalize Button */}
                    {selectedRoute && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-green-900">
                                            Finalize route
                                        </h4>
                                        <p className="text-sm text-green-700">
                                            Lộ trình đã được chọn, sẵn sàng chia
                                            sẻ với nhóm
                                        </p>
                                    </div>
                                    <Button className="bg-green-600 hover:bg-green-700">
                                        Finalize & Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Empty State */}
            {generatedRoutes.length === 0 && !isGenerating && (
                <div className="text-center py-12 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Smart route
                    </h3>
                    <p className="text-sm mb-4">
                        AI sẽ phân tích sở thích của nhóm và tạo ra những lộ
                        trình tối ưu nhất
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-400">
                        <span>🎯 Tối ưu thời gian</span>
                        <span>💰 Phù hợp ngân sách</span>
                        <span>❤️ Dựa trên sở thích</span>
                    </div>
                </div>
            )}
        </div>
    );
}
