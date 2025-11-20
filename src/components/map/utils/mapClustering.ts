/**
 * Map Clustering Utilities
 * 
 * Utilities for managing Supercluster configuration and operations
 */

import Supercluster from 'supercluster';
import type { Pinory } from '@/lib/types';

/**
 * Default Supercluster configuration
 */
export const DEFAULT_CLUSTER_CONFIG = {
  radius: 60, // Cluster radius in pixels
  maxZoom: 16, // Max zoom to cluster points on
  minZoom: 0,
  minPoints: 2, // Minimum points to form a cluster
};

/**
 * Create and initialize Supercluster index
 */
export function createClusterIndex(
  points: Array<{
    type: 'Feature';
    properties: Pinory;
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>,
  config = DEFAULT_CLUSTER_CONFIG
): Supercluster<Pinory> {
  const index = new Supercluster<Pinory>(config);
  index.load(points);
  return index;
}

/**
 * Get cluster expansion zoom
 */
export function getClusterExpansionZoom(
  clusterIndex: Supercluster<Pinory>,
  clusterId: number,
  maxZoom = 20
): number {
  try {
    return Math.min(clusterIndex.getClusterExpansionZoom(clusterId), maxZoom);
  } catch (error) {
    console.error('Error getting cluster expansion zoom:', error);
    return maxZoom;
  }
}

/**
 * Get cluster leaves (individual points)
 */
export function getClusterLeaves(
  clusterIndex: Supercluster<Pinory>,
  clusterId: number,
  limit = Infinity
) {
  try {
    return clusterIndex.getLeaves(clusterId, limit);
  } catch (error) {
    console.error('Error getting cluster leaves:', error);
    return [];
  }
}
