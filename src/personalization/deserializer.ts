import { Widget, SerializedWidget } from "./types";
import { getWidgetClass } from "./registry";

/**
 * Schema definitions for widget field validation.
 * Ensures widget data conforms to expected types before instantiation.
 */
const WIDGET_SCHEMAS: Record<string, Record<string, string>> = {
  RecentPagesWidget: { workspaceId: "string", limit: "number" },
  BreadcrumbWidget: { separator: "string" },
  BrandingWidget: { logoText: "string", tagline: "string" },
  MetricsWidget: { probe: "string", args: "string" },
};

/**
 * Validates widget data against its schema.
 * Checks that provided fields match expected types.
 */
function validateWidgetSchema(item: SerializedWidget): boolean {
  const schema = WIDGET_SCHEMAS[item._type];
  if (!schema) return false;

  for (const [field, expectedType] of Object.entries(schema)) {
    if (field in item && typeof item[field] !== expectedType) {
      return false;
    }
  }
  return true;
}

/**
 * Deserializes personalization widget data from the cookie.
 * Validates the schema of each widget before instantiation.
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

      // Validate widget data against schema
      if (!validateWidgetSchema(item)) continue;

      const WidgetClass = getWidgetClass(item._type);
      if (!WidgetClass) continue;

      // Instantiate the widget with the validated data
      const widget = new WidgetClass(item);
      widgets.push(widget);
    }
  } catch {
    // Malformed cookie data is silently ignored
  }

  return widgets;
}
