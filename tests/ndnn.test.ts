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

describe("GET /api/admin/templates", () => {
  test("admin_can_list_templates", async () => {
    const res = await request(app).get("/api/admin/templates").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Preferences API
// ---------------------------------------------------------------------------

describe("POST /api/preferences", () => {
  test("editor_can_save_template", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .set(CAROL)
      .send({ slot: "greeting", content: "Hello {{companyName}}!", type: "template" });
    expect(res.status).toBe(201);
    expect(res.body.saved).toBe(true);
  });

  test("rejects_missing_slot", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .set(CAROL)
      .send({ content: "Hello" });
    expect(res.status).toBe(400);
  });

  test("rejects_missing_content", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .set(CAROL)
      .send({ slot: "greeting" });
    expect(res.status).toBe(400);
  });

  test("rejects_unauthenticated", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .send({ slot: "greeting", content: "Hello" });
    expect(res.status).toBe(401);
  });

});

describe("GET /api/preferences", () => {
  test("lists_user_preferences", async () => {
    const res = await request(app).get("/api/preferences").set(CAROL);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 404 error page with template rendering
// ---------------------------------------------------------------------------

describe("404 error page", () => {
  test("returns_404_for_unknown_path", async () => {
    const res = await request(app).get("/nonexistent-page");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
  });

  test("renders_custom_template_with_variables", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Acme Corp");
    expect(res.text).toContain(String(new Date().getFullYear()));
  });

  test("renders_template_with_safe_helpers", async () => {
    const { getDb } = require("../src/db");
    getDb().prepare(
      "UPDATE user_content SET content = ? WHERE slot = 'error-page'"
    ).run('<p>{{helpers.uppercase(companyName)}} - {{helpers.siteMetric("version")}}</p>');

    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
    expect(res.text).toContain("ACME CORP");
    expect(res.text).toContain("1.0.0");
  });

  test("default_404_without_template", async () => {
    const { getDb } = require("../src/db");
    getDb().prepare("DELETE FROM user_content WHERE slot = 'error-page'").run();

    const res = await request(app).get("/missing");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
    expect(res.text).toContain("Return to homepage");
  });
});

// ---------------------------------------------------------------------------
// Template rendering with data helpers (legitimate use of lookup/count)
// ---------------------------------------------------------------------------

describe("export with system layouts", () => {
  test("editor_export_with_system_layout_includes_page_count", async () => {
    // System layouts are admin-created and shared across the workspace.
    // Any member using a system layout should get the full rendered output
    // including data helpers like count() — the layout's capabilities are
    // determined by who created it, not who uses it.
    const res = await request(app)
      .post("/api/pages/pg-001/export")
      .set(CAROL)
      .send({ layout: "standard" });

    expect(res.status).toBe(200);
    expect(res.body.html).toContain("Pages:");
    expect(res.body.html).toMatch(/Pages: \d+/);
  });
});

describe("template data helpers", () => {
  test("template_with_count_renders_page_total", async () => {
    // Save a template that uses helpers.count
    await request(app)
      .post("/api/preferences")
      .set(ALICE)
      .send({
        slot: "error-page",
        content: "<h1>Not Found</h1><p>We have {{helpers.count('pages')}} pages available.</p>",
        type: "template",
      });

    // Trigger 404 to render the template
    const res = await request(app).get("/nonexistent-page");
    expect(res.status).toBe(404);
    expect(res.text).toContain("We have");
  });

  test("template_with_lookup_renders_page_title", async () => {
    // Save a template that uses helpers.lookup with parameterized condition
    await request(app)
      .post("/api/preferences")
      .set(ALICE)
      .send({
        slot: "error-page",
        content: "<h1>Not Found</h1><p>Try: {{helpers.lookup('pages', 'title', 'published', 1)}}</p>",
        type: "template",
      });

    const res = await request(app).get("/missing");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Try:");
  });

  test("template_with_site_metric_renders_version", async () => {
    await request(app)
      .post("/api/preferences")
      .set(ALICE)
      .send({
        slot: "error-page",
        content: "<footer>v{{helpers.siteMetric('version')}}</footer>",
        type: "template",
      });

    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.text).toContain("v1.0.0");
  });
});
