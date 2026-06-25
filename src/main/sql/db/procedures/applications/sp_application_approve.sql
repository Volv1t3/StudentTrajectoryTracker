-- ============================================================================
-- Procedure: sp_application_approve
-- Description: Core transactional procedure that atomically approves an
--              application AND creates the resulting assignment.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_application_approve;

DELIMITER $$

CREATE PROCEDURE sp_application_approve(
  IN  p_application_id  INT UNSIGNED,
  IN  p_admin_id        INT UNSIGNED,
  IN  p_role_in_project VARCHAR(150),
  IN  p_admin_notes     TEXT,
  IN  p_ip_address      VARCHAR(45),
  OUT p_assignment_id   INT UNSIGNED
)
BEGIN
  DECLARE v_app_status    VARCHAR(20);
  DECLARE v_collab_id     INT UNSIGNED;
  DECLARE v_project_id    INT UNSIGNED;
  DECLARE v_traj_status   VARCHAR(20);
  DECLARE v_max_collab    SMALLINT UNSIGNED;
  DECLARE v_cur_count     SMALLINT UNSIGNED;
  DECLARE v_dup_assign    INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT status, collaborator_id, project_id
  INTO v_app_status, v_collab_id, v_project_id
  FROM applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_app_status IS NULL THEN
    SIGNAL SQLSTATE '45023'
      SET MESSAGE_TEXT = 'Application not found';
  END IF;

  IF v_app_status COLLATE utf8mb4_unicode_ci NOT IN ('Pendiente', 'En_Revisión') THEN
    SIGNAL SQLSTATE '45020'
      SET MESSAGE_TEXT = 'Application cannot be approved from its current status';
  END IF;

  SELECT max_collaborators, current_collaborator_count
  INTO v_max_collab, v_cur_count
  FROM projects WHERE id = v_project_id FOR UPDATE;

  IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
    SIGNAL SQLSTATE '45021'
      SET MESSAGE_TEXT = 'Project is at max collaborator capacity';
  END IF;

  SELECT COUNT(*) INTO v_dup_assign
  FROM assignments
  WHERE collaborator_id = v_collab_id
    AND project_id      = v_project_id
    AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado');

  IF v_dup_assign > 0 THEN
    SIGNAL SQLSTATE '45022'
      SET MESSAGE_TEXT = 'Collaborator already has a live assignment for this project';
  END IF;

  SELECT trajectory_status INTO v_traj_status
  FROM collaborators WHERE id = v_collab_id FOR UPDATE;

  START TRANSACTION;
    UPDATE applications SET
      status            = 'Aprobada',
      approved_at       = NOW(),
      reviewed_at       = COALESCE(reviewed_at, NOW()),
      approver_admin_id = p_admin_id,
      admin_notes       = COALESCE(p_admin_notes, admin_notes)
    WHERE id = p_application_id;

    INSERT INTO assignments (
      collaborator_id, project_id, application_id,
      assigned_by_admin_id, role_in_project,
      assigned_at, status
    ) VALUES (
      v_collab_id, v_project_id, p_application_id,
      p_admin_id, p_role_in_project,
      NOW(), 'Activo'
    );
    SET p_assignment_id = LAST_INSERT_ID();

    UPDATE projects
    SET current_collaborator_count = current_collaborator_count + 1,
        updated_at                 = NOW()
    WHERE id = v_project_id;

    IF v_traj_status COLLATE utf8mb4_unicode_ci != 'Vinculado' THEN
      UPDATE collaborators
      SET trajectory_status = 'Vinculado', updated_at = NOW()
      WHERE id = v_collab_id;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Aprobar',
      'applications', p_application_id,
      JSON_OBJECT('status', v_app_status),
      JSON_OBJECT('status', 'Aprobada'),
      CONCAT('Application approved; assignment ', LAST_INSERT_ID(), ' created'),
      p_ip_address
    );

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Asignar',
      'assignments', p_assignment_id,
      NULL,
      JSON_OBJECT('collaborator_id', v_collab_id,
                  'project_id', v_project_id,
                  'status', 'Activo'),
      'Assignment created from application approval',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
