import { createRoot, type Root } from "react-dom/client";
import { PinoryPin } from "./pinory-pin";
import type { Pinory } from "@/lib/types";

// Legacy export for backward compatibility
/** @deprecated Use Pinory from @/lib/types instead */
export type LocationNote = Pinory;

interface MarkerHelperProps {
    readonly note?: Pinory | null;
    readonly mood?: string;
    readonly isSelected?: boolean;
    readonly onClick?: () => void;
    readonly isFriendPinory?: boolean;
}

interface ReactMapPinElement extends HTMLElement {
    _reactRoot?: Root;
}

export type { ReactMapPinElement };

export function createMapPinElement(
    props: MarkerHelperProps
): ReactMapPinElement {
    const container = document.createElement("div") as ReactMapPinElement;
    container.className = "react-map-pin";

    const root = createRoot(container);
    root.render(
        <PinoryPin
            pinory={props.note}
            mood={props.mood}
            isSelected={props.isSelected}
            onClick={props.onClick}
            size="medium"
        />
    );

    // Store root for cleanup
    container._reactRoot = root;

    return container;
}

export function destroyMapPinElement(element: ReactMapPinElement): void {
    const root = element._reactRoot;
    if (root) {
        // React 19 compatible cleanup
        try {
            root.render(null);
        } catch (error) {
            console.warn("Error cleaning up React root:", error);
        }
        delete element._reactRoot;
    }
}
