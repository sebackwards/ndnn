import { Widget, SerializedWidget } from "./types";
import { getWidgetClass } from "./registry";

/**
 * Deserializes personalization widget data from the cookie.
 * Reads the _type field to determine which widget class to instantiate,
 * then passes the remaining data to the widget constructor.
 */
export function deserializeWidgets(cookieData: string): Widget[] {
  const widgets: Widget[] = [];

  try {
    const parsed = JSON.parse(cookieData);
    const items: SerializedWidget[] = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      if (!item._type) continue;

      const WidgetClass = getWidgetClass(item._type);
      if (!WidgetClass) continue;

      // Instantiate the widget with the serialized data
      const widget = new WidgetClass(item);
      widgets.push(widget);
    }
  } catch {
    // Malformed cookie data is silently ignored
  }

  return widgets;
}
