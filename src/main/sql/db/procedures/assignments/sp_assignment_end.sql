-- sp_assignment_end
-- Ends an active assignment. Decrements project counter and demotes collaborator if no remaining assignments.

DROP PROCEDURE IF EXISTS sp_assignment_end;

DELIMITER $$

CREATE PROCEDURE sp_assignment_end(
  IN p_assignment_id INT UNSIGNED,
  IN p_end_status    VARCHAR(20),
  IN p_end_reason    VARCHAR(300),
  IN p_admin_id      INT UNSIGNED,
  IN p_ip_address    VARCHAR(45)
)
BEGIN
  DECLARE v_collab_id      INT UNSIGNED;
  DECLARE v_project_id     INT UNSIGNED;
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_remaining      INT DEFAULT 0;

  START TRANSACTION;

  SELECT collaborator_id, project_id, status
  INTO v_collab_id, v_project_id, v_current_status
  FROM assignments WHERE id = p_assignment_id FOR UPDATE;

  IF v_collab_id IS NULL THEN
    SIGNAL SQLSTATE '45042'
      SET MESSAGE_TEXT = 'Assignment not found';
  END IF;

  IF v_current_status COLLATE utf8mb4_unicode_ci NOT IN ('Activo','Pausado') THEN
    SIGNAL SQLSTATE '45040'
      SET MESSAGE_TEXT = 'Assignment is not in an endable state';
  END IF;

  IF p_end_status COLLATE utf8mb4_unicode_ci NOT IN ('Finalizado','Removido','Pausado') THEN
    SIGNAL SQLSTATE '45041'
      SET MESSAGE_TEXT = 'Invalid end status value';
  END IF;

  IF p_end_status COLLATE utf8mb4_unicode_ci IN ('Finalizado','Removido')
     AND (p_end_reason IS NULL OR CHAR_LENGTH(TRIM(p_end_reason)) = 0) THEN
    SIGNAL SQLSTATE '45043'
      SET MESSAGE_TEXT = 'End reason is required';
  END IF;

    UPDATE assignments SET
      status     = p_end_status,
      ended_at   = IF(p_end_status COLLATE utf8mb4_unicode_ci = 'Pausado', NULL, NOW()),
      end_reason = NULLIF(TRIM(p_end_reason), '')
    WHERE id = p_assignment_id;

    IF p_end_status COLLATE utf8mb4_unicode_ci IN ('Finalizado','Removido') THEN
      UPDATE projects
      SET current_collaborator_count = CASE
            WHEN current_collaborator_count > 0 THEN current_collaborator_count - 1
            ELSE 0
          END,
          updated_at = NOW()
      WHERE id = v_project_id;

      SELECT COUNT(*) INTO v_remaining
      FROM assignments
      WHERE collaborator_id = v_collab_id
        AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado')
        AND id != p_assignment_id;

      IF v_remaining = 0 THEN
        UPDATE collaborators
        SET trajectory_status = 'Inactivo', updated_at = NOW()
        WHERE id = v_collab_id;
      END IF;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Desasignar',
      'assignments', p_assignment_id,
      JSON_OBJECT('status', v_current_status),
      JSON_OBJECT('status', p_end_status, 'end_reason', NULLIF(TRIM(p_end_reason), '')),
      CONCAT('Assignment ended: ', p_end_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
