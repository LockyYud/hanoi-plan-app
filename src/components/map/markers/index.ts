/**
 * Map Markers Components
 * 
 * All marker/pin related components for the map
 */

export { PinBase } from "./pin-base";
export { PinoryPin } from "./pinory-pin";
export { PushPinIcon } from "./push-pin-icon";
export { ClusterMarker } from "./cluster-marker";
export { createMapPinElement, destroyMapPinElement, type ReactMapPinElement } from "./marker-helper";

// Legacy exports for backward compatibility
/** @deprecated Use PinoryPin instead */
export { PinoryPin as MapPin } from "./pinory-pin";
/** @deprecated Use PinoryPin instead */
export { PinoryPin as PhotoPin } from "./pinory-pin";
