import request from "supertest";
import { createApp } from "../src/index";
import { resetDb } from "../src/db";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  resetDb();
  app = createApp();
});

const ALICE = { "X-API-Key": "key-alice" };   // admin, ws-alpha
const CAROL = { "X-API-Key": "key-carol" };   // editor, ws-alpha
const FRANK = { "X-API-Key": "key-frank" };   // viewer, ws-alpha
const BOB = { "X-API-Key": "key-bob" };       // admin, ws-beta

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

describe("health", () => {
  test("returns_ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

describe("authentication", () => {
  test("rejects_missing_api_key", async () => {
    const res = await request(app).get("/api/pages");
    expect(res.status).toBe(401);
  });

  test("rejects_invalid_api_key", async () => {
    const res = await request(app).get("/api/pages").set("X-API-Key", "bad");
    expect(res.status).toBe(401);
  });

  test("accepts_valid_api_key", async () => {
    const res = await request(app).get("/api/pages").set(ALICE);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Pages CRUD
// ---------------------------------------------------------------------------

describe("GET /api/pages", () => {
  test("returns_workspace_pages", async () => {
    const res = await request(app).get("/api/pages").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  test("other_workspace_isolated", async () => {
    const res = await request(app).get("/api/pages").set(BOB);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test("viewer_can_list_pages", async () => {
    const res = await request(app).get("/api/pages").set(FRANK);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/pages/:id", () => {
  test("returns_page_detail", async () => {
    const res = await request(app).get("/api/pages/pg-001").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Getting Started");
  });

  test("blocks_cross_workspace_access", async () => {
    const res = await request(app).get("/api/pages/pg-004").set(ALICE);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/pages", () => {
  test("admin_can_create_page", async () => {
    const res = await request(app)
      .post("/api/pages")
      .set(ALICE)
      .send({ title: "New Page", slug: "new-page", content: "<p>Hello</p>" });
    expect(res.status).toBe(201);
  });

  test("editor_can_create_page", async () => {
    const res = await request(app)
      .post("/api/pages")
      .set(CAROL)
      .send({ title: "Editor Page", slug: "editor-page" });
    expect(res.status).toBe(201);
  });

  test("viewer_cannot_create_page", async () => {
    const res = await request(app)
      .post("/api/pages")
      .set(FRANK)
      .send({ title: "Blocked", slug: "blocked" });
    expect(res.status).toBe(403);
  });

  test("rejects_missing_title", async () => {
    const res = await request(app)
      .post("/api/pages")
      .set(ALICE)
      .send({ slug: "no-title" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/pages/:id", () => {
  test("admin_can_update_page", async () => {
    const res = await request(app)
      .put("/api/pages/pg-001")
      .set(ALICE)
      .send({ title: "Updated Title" });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);
  });

  test("viewer_cannot_update_page", async () => {
    const res = await request(app)
      .put("/api/pages/pg-001")
      .set(FRANK)
      .send({ title: "Hacked" });
    expect(res.status).toBe(403);
  });

  test("blocks_cross_workspace_update", async () => {
    const res = await request(app)
      .put("/api/pages/pg-004")
      .set(ALICE)
      .send({ title: "Stolen" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/pages/:id", () => {
  test("admin_can_delete_page", async () => {
    const res = await request(app).delete("/api/pages/pg-003").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  test("editor_cannot_delete_page", async () => {
    const res = await request(app).delete("/api/pages/pg-001").set(CAROL);
    expect(res.status).toBe(403);
  });

  test("blocks_cross_workspace_delete", async () => {
    const res = await request(app).delete("/api/pages/pg-004").set(ALICE);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

describe("GET /api/admin/users", () => {
  test("admin_can_list_users", async () => {
    const res = await request(app).get("/api/admin/users").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  test("viewer_cannot_list_users", async () => {
    const res = await request(app).get("/api/admin/users").set(FRANK);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/system-info", () => {
  test("admin_can_view_system_info", async () => {
    const res = await request(app).get("/api/admin/system-info").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.html).toContain("system-info");
  });

  test("editor_cannot_view_system_info", async () => {
    const res = await request(app).get("/api/admin/system-info").set(CAROL);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/widget-types", () => {
  test("admin_can_list_widget_types", async () => {
    const res = await request(app).get("/api/admin/widget-types").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.types).toContain("RecentPagesWidget");
    expect(res.body.types).toContain("BrandingWidget");
  });
});

// ---------------------------------------------------------------------------
// 404 handler with personalization
// ---------------------------------------------------------------------------

describe("404 error page", () => {
  test("returns_404_for_unknown_path", async () => {
    const res = await request(app).get("/nonexistent-page");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
  });

  test("renders_branding_widget_from_cookie", async () => {
    const cookie = JSON.stringify({ _type: "BrandingWidget", logoText: "TestCorp", tagline: "We test" });
    const res = await request(app)
      .get("/nonexistent")
      .set("Cookie", `nxPersonalization=${cookie}`);
    expect(res.status).toBe(404);
    expect(res.text).toContain("TestCorp");
    expect(res.text).toContain("We test");
  });

  test("renders_breadcrumb_widget_from_cookie", async () => {
    const cookie = JSON.stringify({ _type: "BreadcrumbWidget", separator: " / " });
    const res = await request(app)
      .get("/docs/api/v2")
      .set("Cookie", `nxPersonalization=${cookie}`);
    expect(res.status).toBe(404);
    expect(res.text).toContain("Home / docs / api / v2");
  });

  test("renders_multiple_widgets_from_cookie", async () => {
    const cookie = JSON.stringify([
      { _type: "BrandingWidget", logoText: "Multi" },
      { _type: "BreadcrumbWidget" },
    ]);
    const res = await request(app)
      .get("/some/path")
      .set("Cookie", `nxPersonalization=${cookie}`);
    expect(res.status).toBe(404);
    expect(res.text).toContain("Multi");
    expect(res.text).toContain("breadcrumb");
  });

  test("ignores_malformed_cookie_gracefully", async () => {
    const res = await request(app)
      .get("/bad")
      .set("Cookie", "nxPersonalization=not-valid-json");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
  });

  test("ignores_unknown_widget_type_in_cookie", async () => {
    const cookie = JSON.stringify({ _type: "NonExistentWidget" });
    const res = await request(app)
      .get("/bad")
      .set("Cookie", `nxPersonalization=${cookie}`);
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
    expect(res.text).not.toContain("widget");
  });

  test("default_404_without_cookie", async () => {
    const res = await request(app).get("/missing");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Return to homepage");
  });
});

// ---------------------------------------------------------------------------
// Widget preview via X-Widget-Preview header
// ---------------------------------------------------------------------------

describe("X-Widget-Preview header", () => {
  test("editor_can_preview_branding_widget", async () => {
    const preview = JSON.stringify({ _type: "BrandingWidget", logoText: "Preview" });
    const res = await request(app)
      .get("/api/pages")
      .set(CAROL)
      .set("X-Widget-Preview", preview);
    expect(res.status).toBe(200);
    expect(res.body._widgetPreview).toContain("Preview");
  });

  test("editor_can_preview_breadcrumb_widget", async () => {
    const preview = JSON.stringify({ _type: "BreadcrumbWidget", separator: " :: " });
    const res = await request(app)
      .get("/api/pages")
      .set(CAROL)
      .set("X-Widget-Preview", preview);
    expect(res.status).toBe(200);
    expect(res.body._widgetPreview).toContain("breadcrumb");
  });

  test("no_preview_without_header", async () => {
    const res = await request(app).get("/api/pages").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body._widgetPreview).toBeUndefined();
  });
});
