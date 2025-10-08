import { createRoot, type Root } from "react-dom/client";
import { MapPin } from "./map-pin";
import { CategoryType } from "@prisma/client";

interface LocationNote {
  readonly id: string;
  readonly content: string;
  readonly address: string;
  readonly lat: number;
  readonly lng: number;
  readonly mood?: string;
  readonly timestamp: Date;
  readonly images?: string[];
  readonly hasImages?: boolean;
}

export type { LocationNote };

interface MarkerHelperProps {
  readonly category: CategoryType;
  readonly note?: LocationNote | null;
  readonly mood?: string;
  readonly isSelected?: boolean;
  readonly onClick?: () => void;
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
    <MapPin
      category={props.category}
      note={props.note}
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
