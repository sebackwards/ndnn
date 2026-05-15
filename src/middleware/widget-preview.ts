import { Request, Response, NextFunction } from "express";
import { deserializeWidgets } from "../personalization/deserializer";

/**
 * Widget preview middleware for editors/admins.
 * Reads the X-Widget-Preview header and appends rendered widget HTML
 * to the response. Used for testing widget configurations before saving.
 *
 * This allows editors to preview how a widget will look by sending
 * the widget config in a request header alongside any normal API call.
 */
export function widgetPreviewMiddleware(req: Request, res: Response, next: NextFunction): void {
  const previewHeader = req.headers["x-widget-preview"] as string | undefined;

  if (!previewHeader) {
    next();
    return;
  }

  // Store the original json method
  const originalJson = res.json.bind(res);

  // Override res.json to append widget preview HTML
  res.json = function (body: any) {
    const widgets = deserializeWidgets(previewHeader);
    const context = { requestedPath: req.path, method: req.method };

    let previewHtml = "";
    for (const widget of widgets) {
      previewHtml += widget.render(context);
    }

    // Append preview data to the response
    if (previewHtml) {
      body._widgetPreview = previewHtml;
    }

    return originalJson(body);
  };

  next();
}
