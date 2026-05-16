import { getDb } from "../db";
import { enforceContentPolicy, PolicyResult } from "../policies/content-policy";

/**
 * Preference service for managing user display preferences.
 * Handles storage and retrieval of user customization settings
 * including custom greeting templates, theme choices, and layout preferences.
 *
 * All template content is validated through the content policy
 * before storage to prevent injection attacks.
 */

export interface UserPreference {
  slot: string;
  content: string;
  type: "template" | "setting";
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Saves a user preference to the database.
 * Validates content through the content policy before storing.
 */
export function savePreference(
  userId: string,
  preference: UserPreference
): SaveResult {
  // Validate template content through content policy
  if (preference.type === "template") {
    const policyResult: PolicyResult = enforceContentPolicy(preference.content);
    if (!policyResult.allowed) {
      return { success: false, error: policyResult.reason };
    }
    // Use sanitized content if available
    if (policyResult.sanitized) {
      preference.content = policyResult.sanitized;
    }
  }

  const db = getDb();

  // Upsert the preference
  db.prepare(
    `INSERT INTO user_content (user_id, slot, content, type, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, slot) DO UPDATE SET
       content = excluded.content,
       updated_at = excluded.updated_at`
  ).run(userId, preference.slot, preference.content, preference.type);

  return { success: true };
}

/**
 * Retrieves a user's preference by slot name.
 */
export function getPreference(
  userId: string,
  slot: string
): UserPreference | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT slot, content, type FROM user_content WHERE user_id = ? AND slot = ?"
    )
    .get(userId, slot) as UserPreference | undefined;

  return row || null;
}

/**
 * Lists all preferences for a user.
 */
export function listPreferences(userId: string): UserPreference[] {
  const db = getDb();
  return db
    .prepare("SELECT slot, content, type FROM user_content WHERE user_id = ?")
    .all(userId) as UserPreference[];
}
