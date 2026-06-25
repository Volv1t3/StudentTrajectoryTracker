-- sp_assignment_create_manual
-- Creates an approved application and its resulting assignment directly from the admin manual linkage flow.

DROP PROCEDURE IF EXISTS sp_assignment_create_manual;

DELIMITER $$

CREATE PROCEDURE sp_assignment_create_manual(
  IN  p_collaborator_id    INT UNSIGNED,
  IN  p_project_id         INT UNSIGNED,
  IN  p_admin_id           INT UNSIGNED,
  IN  p_reason_for_linking TEXT,
  IN  p_role_in_project    VARCHAR(150),
  IN  p_admin_notes        TEXT,
  IN  p_ip_address         VARCHAR(45),
  OUT p_assignment_id      INT UNSIGNED
)
BEGIN
  DECLARE v_dup_count      INT DEFAULT 0;
  DECLARE v_max_collab     SMALLINT UNSIGNED;
  DECLARE v_cur_count      SMALLINT UNSIGNED;
  DECLARE v_project_row_id INT UNSIGNED;
  DECLARE v_traj_status    VARCHAR(20);
  DECLARE v_application_id INT UNSIGNED;

  START TRANSACTION;

    SELECT trajectory_status
    INTO v_traj_status
    FROM collaborators
    WHERE id = p_collaborator_id
    FOR UPDATE;

    IF v_traj_status IS NULL THEN
      SIGNAL SQLSTATE '45032'
        SET MESSAGE_TEXT = 'Collaborator not found';
    END IF;

    SELECT id, max_collaborators, current_collaborator_count
    INTO v_project_row_id, v_max_collab, v_cur_count
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF v_project_row_id IS NULL THEN
      SIGNAL SQLSTATE '45033'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;

    SELECT COUNT(*) INTO v_dup_count
    FROM assignments
    WHERE collaborator_id = p_collaborator_id
      AND project_id = p_project_id
      AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado');

    IF v_dup_count > 0 THEN
      SIGNAL SQLSTATE '45030'
        SET MESSAGE_TEXT = 'Live assignment already exists';
    END IF;

    IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
      SIGNAL SQLSTATE '45031'
        SET MESSAGE_TEXT = 'Project at max capacity';
    END IF;

    INSERT INTO applications (
      collaborator_id,
      project_id,
      reason_for_applying,
      status,
      applied_at,
      reviewed_at,
      approved_at,
      approver_admin_id,
      admin_notes
    ) VALUES (
      p_collaborator_id,
      p_project_id,
      p_reason_for_linking,
      'Aprobada',
      NOW(),
      NOW(),
      NOW(),
      p_admin_id,
      NULLIF(TRIM(p_admin_notes), '')
    );
    SET v_application_id = LAST_INSERT_ID();

    INSERT INTO assignments (
      collaborator_id, project_id, application_id,
      assigned_by_admin_id, role_in_project,
      assigned_at, status
    ) VALUES (
      p_collaborator_id, p_project_id, v_application_id,
      p_admin_id, NULLIF(TRIM(p_role_in_project), ''),
      NOW(), 'Activo'
    );
    SET p_assignment_id = LAST_INSERT_ID();

    UPDATE projects
    SET current_collaborator_count = current_collaborator_count + 1,
        updated_at = NOW()
    WHERE id = p_project_id;

    IF v_traj_status COLLATE utf8mb4_unicode_ci != 'Vinculado' THEN
      UPDATE collaborators
      SET trajectory_status = 'Vinculado', updated_at = NOW()
      WHERE id = p_collaborator_id;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Aprobar',
      'applications', v_application_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'status', 'Aprobada',
                  'reason_for_applying', p_reason_for_linking),
      'Manual linkage created approved application',
      p_ip_address
    );

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Asignar',
      'assignments', p_assignment_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'application_id', v_application_id,
                  'role', NULLIF(TRIM(p_role_in_project), ''),
                  'status', 'Activo'),
      'Manual linkage assignment created by admin',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
