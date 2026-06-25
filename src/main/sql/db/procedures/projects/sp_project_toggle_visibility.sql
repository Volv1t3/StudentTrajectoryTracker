-- sp_project_toggle_visibility
-- Toggles is_visible for a project.

DROP PROCEDURE IF EXISTS sp_project_toggle_visibility;

DELIMITER $$

CREATE PROCEDURE sp_project_toggle_visibility(
  IN p_project_id INT UNSIGNED,
  IN p_admin_id   INT UNSIGNED
)
BEGIN
  UPDATE projects
  SET is_visible = NOT is_visible, updated_at = NOW()
  WHERE id = p_project_id;

  CALL sp_audit_write(
    'administrator', p_admin_id, 'update',
    'projects', p_project_id,
    NULL, NULL, 'Project visibility toggled', NULL
  );
END$$

DELIMITER ;
