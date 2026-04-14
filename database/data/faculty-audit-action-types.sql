-- Seed data for user_account_faculty_audit_action_type.
-- Safe to re-run due to ON DUPLICATE KEY UPDATE.

CREATE TABLE IF NOT EXISTS user_account_faculty_audit_action_type (
  action_type_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action_text VARCHAR(30) NOT NULL,
  PRIMARY KEY (action_type_id),
  UNIQUE KEY uq_faculty_audit_action_text (action_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO user_account_faculty_audit_action_type (action_text)
VALUES
  ('Marked as faculty'),
  ('Undid faculty status'),
  ('Bulk marked as faculty'),
  ('Bulk undid faculty status')
ON DUPLICATE KEY UPDATE action_text = VALUES(action_text);
