import { Widget } from "./types";
import { RecentPagesWidget } from "./widgets/recent-pages";
import { BreadcrumbWidget } from "./widgets/breadcrumb";
import { BrandingWidget } from "./widgets/branding";
import { SystemInfoWidget } from "./widgets/system-info";

type WidgetConstructor = new (data: Record<string, unknown>) => Widget;

/**
 * Registry of available widget types.
 * Maps type name strings to their constructor functions.
 * Used by the deserializer to instantiate widgets from cookie data.
 */
const widgetRegistry: Record<string, WidgetConstructor> = {
  RecentPagesWidget,
  BreadcrumbWidget,
  BrandingWidget,
  SystemInfoWidget,
};

/**
 * Look up a widget constructor by its type name.
 */
export function getWidgetClass(typeName: string): WidgetConstructor | undefined {
  return widgetRegistry[typeName];
}

/**
 * Returns all registered widget type names.
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(widgetRegistry);
}
