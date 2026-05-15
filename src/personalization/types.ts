/**
 * Base interface for all personalization widgets.
 * Widgets are rendered on error pages to provide contextual navigation.
 */
export interface Widget {
  render(context: Record<string, unknown>): string;
}

/**
 * Serialized widget data stored in the personalization cookie.
 * The _type field determines which widget class to instantiate.
 */
export interface SerializedWidget {
  _type: string;
  [key: string]: unknown;
}
