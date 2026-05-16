import { getDb } from "../db";
import { enforceContentPolicy, PolicyResult } from "../policies/content-policy";

export interface UserPreference {
  slot: string;
  content: string;
  type: "template" | "setting";
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export function savePreference(
  userId: string,
  preference: UserPreference
): SaveResult {
  if (preference.type === "template" || preference.type === "setting") {
    const policyResult: PolicyResult = enforceContentPolicy(preference.content);
    if (!policyResult.allowed) {
      return { success: false, error: policyResult.reason };
    }
    if (policyResult.sanitized) {
      preference.content = policyResult.sanitized;
    }
  }

  const db = getDb();

  db.prepare(
    `INSERT INTO user_content (user_id, slot, content, type, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, slot) DO UPDATE SET
       content = excluded.content,
       type = excluded.type,
       updated_at = excluded.updated_at`
  ).run(userId, preference.slot, preference.content, preference.type);

  return { success: true };
}

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

export function listPreferences(userId: string): UserPreference[] {
  const db = getDb();
  return db
    .prepare("SELECT slot, content, type FROM user_content WHERE user_id = ?")
    .all(userId) as UserPreference[];
}
