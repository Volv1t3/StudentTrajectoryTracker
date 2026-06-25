-- ============================================================================
-- Procedure: sp_application_submit
-- Description: Creates a new application record with validation for
--              collaborator status, project visibility, and capacity.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_application_submit;

DELIMITER $$

CREATE PROCEDURE sp_application_submit(
  IN  p_collaborator_id     INT UNSIGNED,
  IN  p_project_id          INT UNSIGNED,
  IN  p_reason_for_applying TEXT,
  IN  p_ip_address          VARCHAR(45),
  OUT p_application_id      INT UNSIGNED
)
BEGIN
  DECLARE v_traj_status    VARCHAR(20);
  DECLARE v_proj_status    VARCHAR(20);
  DECLARE v_proj_visible   BOOLEAN;
  DECLARE v_max_collab     SMALLINT UNSIGNED;
  DECLARE v_cur_count      SMALLINT UNSIGNED;
  DECLARE v_dup_count      INT DEFAULT 0;

  SELECT trajectory_status INTO v_traj_status
  FROM collaborators WHERE id = p_collaborator_id;

  IF v_traj_status NOT IN ('contactado','vinculado') THEN
    SIGNAL SQLSTATE '45010'
      SET MESSAGE_TEXT = 'Collaborator status does not permit applying to projects';
  END IF;

  SELECT status, is_visible, max_collaborators, current_collaborator_count
  INTO v_proj_status, v_proj_visible, v_max_collab, v_cur_count
  FROM projects WHERE id = p_project_id;

  IF v_proj_status != 'activo' OR v_proj_visible = FALSE THEN
    SIGNAL SQLSTATE '45012'
      SET MESSAGE_TEXT = 'Project is not accepting applications';
  END IF;

  IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
    SIGNAL SQLSTATE '45013'
      SET MESSAGE_TEXT = 'Project has reached maximum collaborator capacity';
  END IF;

  SELECT COUNT(*) INTO v_dup_count
  FROM applications
  WHERE collaborator_id = p_collaborator_id
    AND project_id      = p_project_id
    AND status NOT IN ('retirada','rechazada');

  IF v_dup_count > 0 THEN
    SIGNAL SQLSTATE '45011'
      SET MESSAGE_TEXT = 'An active application already exists for this project';
  END IF;

  START TRANSACTION;
    INSERT INTO applications (
      collaborator_id, project_id, reason_for_applying,
      status, applied_at
    ) VALUES (
      p_collaborator_id, p_project_id, p_reason_for_applying,
      'pendiente', NOW()
    );

    SET p_application_id = LAST_INSERT_ID();

    CALL sp_audit_write(
      'system', NULL, 'create',
      'applications', p_application_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'status', 'pendiente'),
      'Application submitted by collaborator',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
